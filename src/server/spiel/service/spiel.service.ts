import * as uuid from 'uuid/v4';
import { Spiel, validateSpiel } from '../model/spiel';
import {
    SpielNotExistsError,
    IsbnExistsError,
    TitelExistsError,
    ValidationError,
    VersionInvalidError,
} from './exceptions';
import { Document, startSession } from 'mongoose';
import { logger, mockDB, sendMail } from '../../shared';
import { SpielServiceMock } from './mock';

// API-Dokumentation zu mongoose:
// http://mongoosejs.com/docs/api.html
// https://github.com/Automattic/mongoose/issues/3949

/* eslint-disable require-await */
export class SpielService {
    private readonly mock: SpielServiceMock | undefined;

    constructor() {
        if (mockDB) {
            this.mock = new SpielServiceMock();
        }
    }

    // Status eines Promise:
    // Pending: das Resultat gibt es noch nicht, weil die asynchrone Operation,
    //          die das Resultat liefert, noch nicht abgeschlossen ist
    // Fulfilled: die asynchrone Operation ist abgeschlossen und
    //            das Promise-Objekt hat einen Wert
    // Rejected: die asynchrone Operation ist fehlgeschlagen and das
    //           Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //           Stattdessen ist im Promise-Objekt die Fehlerursache enthalten.

    async findById(id: string) {
        if (this.mock !== undefined) {
            return this.mock.findById(id);
        }
        logger.debug(`SpielService.findById(): id= ${id}`);

        // ein Spiel zur gegebenen ID asynchron suchen
        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // null falls nicht gefunden
        return Spiel.findById(id);
    }

    async find(query?: any) {
        if (this.mock !== undefined) {
            return this.mock.find(query);
        }

        logger.debug(`SpielService.find(): query=${query}`);
        const tmpQuery = Spiel.find();

        // alle Spiele asynchron suchen u. aufsteigend nach titel sortieren
        // nach _id sortieren: Timestamp des INSERTs (Basis: Sek)
        // https://docs.mongodb.org/manual/reference/object-id
        if (query === undefined || Object.keys(query).length === 0) {
            return tmpQuery.sort('titel');
        }

        const { titel, javascript, typescript, ...dbQuery } = query;

        // Spiele zur Query (= JSON-Objekt durch Express) asynchron suchen
        if (titel !== undefined) {
            // Titel in der Query: Teilstring des Titels,
            // d.h. "LIKE" als regulaerer Ausdruck
            // 'i': keine Unterscheidung zw. Gross- u. Kleinschreibung
            dbQuery.titel = RegExp(titel, 'iu');
        }

        // z.B. {javascript: true, typescript: true}
        if (javascript === 'true') {
            dbQuery.schlagwoerter = ['JAVASCRIPT'];
        }
        if (typescript === 'true') {
            if (dbQuery.schlagwoerter === undefined) {
                dbQuery.schlagwoerter = ['TYPESCRIPT'];
            } else {
                // OR statt AND
                // {$or: [{schlagwoerter: 'JAVASCRIPT'}, {schlagwoerter: 'TYPESCRIPT'}]}
                dbQuery.schlagwoerter.push('TYPESCRIPT');
            }
        }

        logger.debug(`SpielService.find(): dbQuery=${dbQuery}`);

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // leeres Array, falls nichts gefunden wird
        return Spiel.find(dbQuery);
        // Spiel.findOne(query), falls das Suchkriterium eindeutig ist
        // bei findOne(query) wird null zurueckgeliefert, falls nichts gefunden
    }

    // eslint-disable-next-line max-statements,max-lines-per-function
    async create(spiel: Document) {
        if (this.mock !== undefined) {
            return this.mock.create(spiel);
        }

        // Das gegebene Spiel innerhalb von save() asynchron neu anlegen:
        // Promise.reject(err) bei Verletzung von DB-Constraints, z.B. unique

        const err = validateSpiel(spiel);
        if (err !== undefined) {
            const message = JSON.stringify(err);
            logger.debug(
                `SpielService.create(): Validation Message: ${message}`,
            );
            // Promise<void> als Rueckgabewert
            // Eine von Error abgeleitete Klasse hat die Property "message"
            return Promise.reject(new ValidationError(message));
        }

        const session = await startSession();
        session.startTransaction();

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        const { titel }: { titel: string } = spiel as any;
        let tmp = await Spiel.findOne({ titel });
        if (tmp !== null) {
            // Promise<void> als Rueckgabewert
            // Eine von Error abgeleitete Klasse hat die Property "message"
            return Promise.reject(
                new TitelExistsError(`Der Titel "${titel}" existiert bereits.`),
            );
        }

        const { isbn }: { isbn: string } = spiel as any;
        tmp = await Spiel.findOne({ isbn });
        if (tmp !== null) {
            return Promise.reject(
                new IsbnExistsError(
                    `Die ISBN-Nr. "${isbn}" existiert bereits.`,
                ),
            );
        }

        spiel._id = uuid(); // eslint-disable-line require-atomic-updates
        const spielSaved = await spiel.save();

        await session.commitTransaction();
        session.endSession();

        logger.debug(
            `SpielService.create(): spielSaved=${JSON.stringify(spielSaved)}`,
        );

        const to = 'joe@doe.mail';
        const subject = `Neues Spiel ${spielSaved._id}`;
        const body = `Das Spiel mit dem Titel <strong>${titel}</strong> ist angelegt`;
        logger.debug(`sendMail wird aufgerufen: ${to} / ${subject} / ${body}`);
        sendMail(to, subject, body);

        return spielSaved;
    }

    // eslint-disable-next-line max-lines-per-function,max-statements
    async update(spiel: Document, versionStr: string) {
        if (this.mock !== undefined) {
            return this.mock.update(spiel);
        }

        if (versionStr === undefined) {
            return Promise.reject(
                new VersionInvalidError('Die Versionsnummer fehlt'),
            );
        }
        const version = Number.parseInt(versionStr, 10);
        if (Number.isNaN(version)) {
            return Promise.reject(
                new VersionInvalidError('Die Versionsnummer ist ungueltig'),
            );
        }
        logger.debug(`SpielService.update(): version=${version}`);

        logger.debug(`SpielService.update(): spiel=${JSON.stringify(spiel)}`);
        const err = validateSpiel(spiel);
        if (err !== undefined) {
            const message = JSON.stringify(err);
            logger.debug(
                `SpielService.update(): Validation Message: ${message}`,
            );
            // Promise<void> als Rueckgabewert
            return Promise.reject(new ValidationError(message));
        }

        const { titel }: { titel: string } = spiel as any;
        const tmp = await Spiel.findOne({ titel });
        if (tmp !== null && tmp._id !== spiel._id) {
            return Promise.reject(
                new TitelExistsError(
                    `Der Titel "${titel}" existiert bereits bei ${tmp._id}.`,
                ),
            );
        }

        const spielDb = await Spiel.findById(spiel._id);
        if (spielDb === null) {
            return Promise.reject(
                new SpielNotExistsError(`Kein Spiel mit ID ${spiel._id}`),
            );
        }
        if (version < spielDb.toObject().__v) {
            return Promise.reject(
                new VersionInvalidError(
                    `Die Versionsnummer ${version} ist nicht aktuell`,
                ),
            );
        }

        // findByIdAndReplace ersetzt ein Document mit ggf. weniger Properties
        const result = await Spiel.findByIdAndUpdate(spiel._id, spiel);
        if (result === null) {
            return Promise.reject(
                new VersionInvalidError(
                    `Kein Spiel mit ID ${spiel._id} und Version ${version}`,
                ),
            );
        }

        logger.debug(`SpielService.update(): result=${JSON.stringify(result)}`);

        // Weitere Methoden von mongoose zum Aktualisieren:
        //    Spiel.findOneAndUpdate(update)
        //    spiel.update(bedingung)
        return Promise.resolve(result);
    }

    async remove(id: string) {
        if (this.mock !== undefined) {
            return this.mock.remove(id);
        }

        logger.debug(`SpielService.remove(): id=${id}`);

        // Das Spiel zur gegebenen ID asynchron loeschen
        const spielPromise = Spiel.findByIdAndRemove(id);
        // entspricht: findOneAndRemove({_id: id})

        // Ohne then (oder Callback) wird nicht geloescht,
        // sondern ein Query-Objekt zurueckgeliefert
        return spielPromise.then(spiel =>
            logger.debug(
                `SpielService.remove(): geloescht=${JSON.stringify(spiel)}`,
            ),
        );

        // Weitere Methoden von mongoose, um zu loeschen:
        //    Spiel.findOneAndRemove(bedingung)
        //    Spiel.remove(bedingung)
    }
}
