/* eslint-disable @typescript-eslint/no-unused-vars,@typescript-eslint/require-await */

import * as uuid from 'uuid/v4';
import { spiel, spiele } from './spiel';
import { Document } from 'mongoose';
import { logger } from '../../../shared';

/* eslint-disable require-await */
export class SpielServiceMock {
    async findById(id: string) {
        spiel._id = id;
        return this.toSpielDocument(spiel);
    }

    async find(_?: any) {
        return spiele.map(b => this.toSpielDocument(b));
    }

    async create(doc: Document) {
        doc._id = uuid();
        logger.info(`Neues Spiel: ${JSON.stringify(doc)}`);
        return doc;
    }

    async update(doc: Document) {
        if (doc.__v !== undefined) {
            doc.__v++;
        }
        logger.info(`Aktualisiertes Spiel: ${JSON.stringify(doc)}`);
        return Promise.resolve(doc);
    }

    async remove(id: string) {
        logger.info(`ID des geloeschten Spieles: ${id}`);
    }

    private readonly toSpielDocument = (spielJSON: any): Document =>
        new Promise((resolve, _) => resolve(spielJSON)) as any;
}
