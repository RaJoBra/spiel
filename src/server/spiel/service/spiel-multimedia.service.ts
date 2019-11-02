import * as gridFsStream from 'gridfs-stream';
import * as mongo from 'mongodb';
import { HttpStatus, downloadDir, getExtension, logger } from '../../shared';
import { createReadStream, createWriteStream, unlink } from 'fs-extra';
import { Spiel } from '../model/spiel';
import { connection } from 'mongoose';
import { join } from 'path';
import stringify from 'fast-safe-stringify';

export class SpielMultimediaService {
    async save(id: string, filePath: string, mimetype: string) {
        logger.debug(
            `SpielMultimediaService.save(): id = ${id}, ` +
                `filePath=${filePath}, mimetype=${mimetype}`,
        );
        if (filePath === undefined) {
            return false;
        }

        // Gibt es ein Spiel zur angegebenen ID?
        const spiel = await Spiel.findById(id);
        if (spiel === null) {
            return false;
        }

        const gfs = gridFsStream(connection.db, mongo);
        gfs.remove({ filename: id }, err => {
            if (err !== undefined) {
                logger.error(
                    `SpielMultimediaService.save(): Error: ${stringify(err)}`,
                );
                throw err;
            }
            logger.debug(
                `SpielMultimediaService.save(): In GridFS geloescht: ${id}`,
            );
        });
        const writestream = gfs.createWriteStream({
            filename: id,
            content_type: mimetype, // eslint-disable-line camelcase, @typescript-eslint/camelcase
        });
        createReadStream(filePath).pipe(writestream);

        const closeFn = (file: any) => {
            logger.debug(
                'SpielMultimediaService.save(): ' +
                    `In GridFS gespeichert: ${file.filename}`,
            );
            unlink(filePath)
                .then(() =>
                    logger.debug(
                        `SpielMultimediaService.save(): ${filePath} geloescht`,
                    ),
                )
                .catch(() =>
                    logger.error(
                        `SpielMultimediaService.save(): Fehler beim Loeschen von ${filePath}`,
                    ),
                );
        };
        writestream.on('close', closeFn);

        return true;
    }

    // eslint-disable-next-line max-lines-per-function
    async findMedia(
        filename: string,
        sendFileCb: (pathname: string) => void,
        sendErrCb: (statuscode: number) => void,
    ) {
        logger.debug(`SpielMultimediaService.findMedia(): filename${filename}`);
        if (filename === undefined) {
            sendErrCb(HttpStatus.NOT_FOUND);
            return;
        }
        // Gibt es ein Spiel mit dem gegebenen "filename" als ID?
        const spiel = await Spiel.findById(filename);
        if (spiel === null) {
            sendErrCb(HttpStatus.NOT_FOUND);
            return;
        }
        logger.debug(
            `SpielMultimediaService.findMedia(): spiel=${JSON.stringify(
                spiel,
            )}`,
        );

        const gfs = gridFsStream(connection.db, mongo);

        // Einlesen von GridFS
        const readstream = gfs.createReadStream({ filename });
        readstream.on('error', (err: any) => {
            if (
                err.name === 'MongoError' &&
                err.message ===
                    `file with id ${filename} not opened for writing`
            ) {
                sendErrCb(HttpStatus.NOT_FOUND);
            } else {
                logger.error(
                    `SpielMultimediaService.findMedia(): Error: ${stringify(
                        err,
                    )}`,
                );
                sendErrCb(HttpStatus.INTERNAL_ERROR);
            }
        });

        const cbReadFile = (_: Error, file: any) => {
            // MIME-Typ ermitteln und Dateiname festlegen
            const mimeType: string = file.contentType;
            logger.debug(
                `SpielMultimediaService.findMedia(): mimeType = ${mimeType}`,
            );
            const pathname = join(downloadDir, filename);
            const pathnameExt = `${pathname}.${getExtension(mimeType)}`;

            // In temporaere Datei schreiben
            const writestream = createWriteStream(pathnameExt);
            writestream.on('close', () => {
                logger.debug(
                    `SpielMultimediaService: cbReadFile(): ${pathnameExt}`,
                );
                sendFileCb(pathnameExt);
            });
            readstream.pipe(writestream);
        };

        // Meta-Informationen lesen: MIME-Type, ...
        gfs.findOne({ filename }, cbReadFile);
    }
}
