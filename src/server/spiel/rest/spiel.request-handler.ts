
import * as mongoose from 'mongoose';
import {
    SpielMultimediaService,
    SpielNotExistsError,
    SpielService,
    IsbnExistsError,
    TitelExistsError,
    ValidationError,
    VersionInvalidError,
} from '../service';
import { HttpStatus, MIME_CONFIG, getBaseUri, logger } from '../../shared';
import { Request, Response } from 'express';
import { Spiel } from '../model/spiel';
import stringify from 'fast-safe-stringify';
import { unlink } from 'fs';

// export bei async und await:
// https://blogs.msdn.microsoft.com/typescript/2015/11/30/announcing-typescript-1-7
// http://tc39.github.io/ecmascript-export
// https://nemethgergely.com/async-function-best-practices#Using-async-functions-with-express

class SpielRequestHandler {
    // Dependency Injection ggf. durch
    // * InversifyJS https://github.com/inversify/InversifyJS
    // * Awilix https://github.com/jeffijoe/awilix
    private readonly spielService = new SpielService();
    private readonly spielMultimediaService = new SpielMultimediaService();

    async findById(req: Request, res: Response) {
        const versionHeader = req.header('If-None-Match');
        logger.debug(`SpielRequestHandler.findById(): versionHeader=${versionHeader}`);
        const { id } = req.params;
        logger.debug(`SpielRequestHandler.findById(): id=${id}`);

        let spiel: mongoose.Document | null = null;
        try {
            spiel = await this.spielService.findById(id);
        } catch (err) {
            // Exception einer export async function bei der Ausfuehrung fangen:
            // https://strongloop.com/strongblog/comparing-node-js-promises-trycatch-zone-js-angular
            logger.error(
                `SpielRequestHandler.findById(): error=${stringify(err)}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        if (spiel === null) {
            logger.debug('SpielRequestHandler.findById(): status=NOT_FOUND');
            res.sendStatus(HttpStatus.NOT_FOUND);
            return;
        }

        logger.debug(
            `SpielRequestHandler.findById(): spiel=${JSON.stringify(spiel)}`,
        );
        const versionDb = spiel.__v;
        if (versionHeader === `"${versionDb}"`) {
            res.sendStatus(HttpStatus.NOT_MODIFIED);
            return;
        }
        logger.debug(`SpielRequestHandler.findById(): VersionDb=${versionDb}`);
        res.header('ETag', `"${versionDb}"`);

        const baseUri = getBaseUri(req);
        const payload = this.toJsonPayload(spiel);
        // HATEOAS: Atom Links
        payload._links = {
            self: { href: `${baseUri}/${id}` },
            list: { href: `${baseUri}` },
            add: { href: `${baseUri}` },
            update: { href: `${baseUri}/${id}` },
            remove: { href: `${baseUri}/${id}` },
        };
        res.json(payload);
    }

    async find(req: Request, res: Response) {
        // z.B. https://.../spiel?titel=Alpha
        const { query } = req;
        logger.debug(
            `SpielRequestHandler.find(): queryParams=${JSON.stringify(query)}`,
        );

        let spiele: Array<mongoose.Document> = [];
        try {
            spiele = await this.spielService.find(query);
        } catch (err) {
            logger.error(`SpielRequestHandler.find(): error=${stringify(err)}`);
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
        }

        logger.debug(
            `SpielRequestHandler.find(): spiele=${JSON.stringify(spiele)}`,
        );
        if (spiele.length === 0) {
            // Alternative: https://www.npmjs.com/package/http-errors
            // Damit wird aber auch der Stacktrace zum Client
            // uebertragen, weil das resultierende Fehlerobjekt
            // von Error abgeleitet ist.
            logger.debug('SpielRequestHandler.find(): status = NOT_FOUND');
            res.sendStatus(HttpStatus.NOT_FOUND);
            return;
        }

        const baseUri = getBaseUri(req);

        // asynchrone for-of Schleife statt synchrones spiele.map()
        const payload = [];
        for await (const spiel of spiele) {
            const spielResource = this.toJsonPayload(spiel);
            // HATEOAS: Atom Links je Spiel
            spielResource._links = { self: { href: `${baseUri}/${spiel._id}` } };
            payload.push(spielResource);
        }

        logger.debug(`SpielRequestHandler.find(): payload=${payload}`);
        res.json(payload);
    }

    async create(req: Request, res: Response) {
        const contentType = req.header(MIME_CONFIG.contentType);
        if (
            // Optional Chaining
            // FIXME https://github.com/typescript-eslint/typescript-eslint/issues/1033
            // FIXME https://github.com/prettier/prettier/issues/6595
            contentType?.toLowerCase() !== MIME_CONFIG.json // eslint-disable-line prettier/prettier
        ) {
            logger.debug('SpielRequestHandler.create() status=NOT_ACCEPTABLE');
            res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
            return;
        }

        const spiel = new Spiel(req.body);
        logger.debug(
            `SpielRequestHandler.create(): body=${JSON.stringify(spiel)}`,
        );

        let spielSaved: mongoose.Document | undefined;
        try {
            spielSaved = await this.spielService.create(spiel);
        } catch (err) {
            if (err instanceof ValidationError) {
                res.status(HttpStatus.BAD_REQUEST).send(
                    JSON.parse(err.message),
                );
                return;
            }
            if (err instanceof TitelExistsError) {
                res.status(HttpStatus.BAD_REQUEST).send(err.message);
                return;
            }
            if (err instanceof IsbnExistsError) {
                res.status(HttpStatus.BAD_REQUEST).send(err.message);
                return;
            }

            logger.error(
                `SpielRequestHandler.create(): error=${stringify(err)}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        const location = `${getBaseUri(req)}/${spielSaved._id}`;
        logger.debug(`SpielRequestHandler.create(): location=${location}`);
        res.location(location);
        res.sendStatus(HttpStatus.CREATED);
    }

    // eslint-disable-next-line max-lines-per-function
    async update(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`SpielRequestHandler.update(): id=${id}`);

        const contentType = req.header(MIME_CONFIG.contentType);
        if (
            contentType?.toLowerCase() !== MIME_CONFIG.json
        ) {
            res.status(HttpStatus.NOT_ACCEPTABLE);
            return;
        }
        const versionHeader = req.header('If-Match');
        logger.debug(
            `SpielRequestHandler.update() versionHeader=${versionHeader}`,
        );
        if (versionHeader === undefined) {
            const msg = 'Versionsnummer fehlt';
            logger.debug(
                `SpielRequestHandler.update(): status=412, message=${msg}`,
            );
            res.status(HttpStatus.PRECONDITION_FAILED).send(msg);
            return;
        }
        const versionHeaderLength = versionHeader.length;
        if (versionHeaderLength < 3) { // eslint-disable-line @typescript-eslint/no-magic-numbers
            const msg = `Ungueltige Versionsnummer: ${versionHeader}`;
            logger.debug(
                `SpielRequestHandler.update(): status=412, message=${msg}`,
            );
            res.status(HttpStatus.PRECONDITION_FAILED).send(msg);
            return;
        }
        const versionHeaderStr =
            versionHeader.substring(1, versionHeaderLength - 1);

        const spiel = new Spiel(req.body);
        spiel._id = id;
        logger.debug(
            `SpielRequestHandler.update(): spiel=${JSON.stringify(spiel)}`,
        );

        let result: mongoose.Document | undefined;
        try {
            result = await this.spielService.update(spiel, versionHeaderStr);
        } catch (err) {
            logger.debug(
                `SpielRequestHandler.update(): error=${stringify(err)}`,
            );
            if (err instanceof VersionInvalidError) {
                logger.debug(
                    `SpielRequestHandler.update(): status=412, message=${err.message}`,
                );
                res.status(HttpStatus.PRECONDITION_FAILED).send(err.message);
                return;
            }
            if (err instanceof ValidationError) {
                res.status(HttpStatus.BAD_REQUEST).send(
                    JSON.parse(err.message),
                );
                return;
            }
            if (
                err instanceof SpielNotExistsError ||
                err instanceof TitelExistsError
            ) {
                res.status(HttpStatus.PRECONDITION_FAILED).send(err.message);
                return;
            }

            logger.error(
                `SpielRequestHandler.update(): error=${stringify(err)}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        logger.debug(`SpielRequestHandler.update(): result=${result}`);
        res.sendStatus(HttpStatus.NO_CONTENT);
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`SpielRequestHandler.delete(): id=${id}`);

        try {
            await this.spielService.remove(id);
        } catch (err) {
            logger.error(
                `SpielRequestHandler.delete(): error=${stringify(err)}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        logger.debug('SpielRequestHandler.delete(): NO_CONTENT');
        res.sendStatus(HttpStatus.NO_CONTENT);
    }

    async upload(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`SpielRequestHandler.upload(): id=${id}`);

        // Multer ergaenzt das Request-Objekt um die Property "file".
        // Das file-Objekt wiederum enthaelt die Properties path, size, mimetype.
        if (Object.keys(req).includes('file') === false) {
            const msg = 'Keine Property "file" im Request-Objekt';
            logger.error(`SpielRequestHandler.upload(): error=${msg}`);
            res.status(HttpStatus.INTERNAL_ERROR).send(msg);
            return;
        }

        const { file } = req as any;
        const { path, mimetype } = file;
        let result: boolean | undefined;
        try {
            result = await this.spielMultimediaService.save(id, path, mimetype);
        } catch (err) {
            logger.error(
                `SpielRequestHandler.upload(): error=${stringify(err)}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        if (result === false) {
            res.sendStatus(HttpStatus.NOT_FOUND);
        }

        logger.debug('SpielRequestHandler.upload(): NO_CONTENT');
        res.sendStatus(HttpStatus.NO_CONTENT);
    }

    async download(req: Request, res: Response) {
        const { id } = req.params;
        const cbSendFile = (pathname: string) => {
            logger.debug(`SpielRequestHandler.download(): pathname=${pathname}`);
            const unlinkCb = (err: any) => {
                if (err !== undefined && err !== null) {
                    logger.error(
                        `SpielRequestHandler.download(): error=${stringify(
                            err,
                        )}`,
                    );
                    throw err;
                }
                logger.debug(
                    `SpielRequestHandler.download(): geloescht: ${pathname}`,
                );
            };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            res.sendFile(pathname, (__: unknown) => unlink(pathname, unlinkCb));
        };
        const cbSendErr = (statuscode: number) => res.sendStatus(statuscode);

        try {
            await this.spielMultimediaService.findMedia(
                id,
                cbSendFile,
                cbSendErr,
            );
        } catch (err) {
            logger.error(
                `SpielRequestHandler.download(): error=${stringify(err)}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
        }
    }

    private toJsonPayload(spiel: mongoose.Document): any {
        const {
            titel,
            rating,
            art,
            verlag,
            preis,
            rabatt,
            lieferbar,
            datum,
            isbn,
            schlagwoerter,
            autoren,
        } = spiel as any;
        return {
            titel,
            rating,
            art,
            verlag,
            preis,
            rabatt,
            lieferbar,
            datum,
            isbn,
            schlagwoerter,
            autoren,
        };
    }
}

const handler = new SpielRequestHandler();

export const findById = (req: Request, res: Response) =>
    handler.findById(req, res);
export const find = (req: Request, res: Response) => handler.find(req, res);
export const create = (req: Request, res: Response) => handler.create(req, res);
export const update = (req: Request, res: Response) => handler.update(req, res);
export const deleteFn = (req: Request, res: Response) =>
    handler.delete(req, res);
export const upload = (req: Request, res: Response) => handler.upload(req, res);
export const download = (req: Request, res: Response) =>
    handler.download(req, res);
