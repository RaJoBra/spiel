
/* eslint-disable no-invalid-this,no-process-env,no-process-exit */

import * as mongoose from 'mongoose';
import { join } from 'path';
import { logger } from '../logger';
import { readFileSync } from 'fs';
import stringify from 'fast-safe-stringify';

export const mockDB = process.env.DB_MOCK === 'true';

const { DB_HOST, DB_PORT } = process.env;
// Nullish Coalescing
const host = DB_HOST ?? 'localhost';

// Nullish Coalescing
const portStr = DB_PORT ?? '27017';
const port = parseInt(portStr, 10);

// "mongodb+srv://" statt "mongodb://" bei DNS-Name
const url = `mongodb://${host}:${port}`;
const dbName = 'hska';
const user = 'admin';
const pass = 'p';
const authSource = 'admin';
const replicaSet = 'replicaSet';
const ssl = true;
const sslCert = readFileSync(join(__dirname, 'certificate.cer'));

const useNewUrlParser = true;

const useFindAndModify = false;

const useCreateIndex = true;

const useUnifiedTopology = true;

mongoose.pluralize(undefined);


export const connectDB = async () => {
    if (mockDB) {
        console.warn('Mocking: Keine DB-Verbindung');
        return;
    }

    const { connection } = mongoose;
    console.info(`URL fuer mongoose: ${url}`);

    const options: mongoose.ConnectionOptions = {
        user,
        pass,
        authSource,
        dbName,
        replicaSet,
        ssl,
        sslCert,
        useNewUrlParser,
        useFindAndModify,
        useCreateIndex,
        useUnifiedTopology,
    };

    try {
        await mongoose.connect(url, options);
    } catch (err) {
        logger.error(`${stringify(err)}`);
        logger.error(`FEHLER beim Aufbau der DB-Verbindung: ${err.message}\n`);
        process.exit(0);
    }
    logger.info(`DB-Verbindung zu ${connection.db.databaseName} ist aufgebaut`);

    connection.on('disconnecting', () =>
        logger.warn('DB-Verbindung wird geschlossen...'),
    );
    connection.on('disconnected', () =>
        logger.warn('DB-Verbindung ist geschlossen.'),
    );
    connection.on('error', () => logger.error('Fehlerhafte DB-Verbindung'));
};

// In Produktion auf false setzen
export const autoIndex = true;

const temp = 'temp';
export const uploadDir = join(__dirname, '..', '..', '..', temp, 'upload');
logger.debug(`Upload-Verzeichnis: ${uploadDir}`);
export const downloadDir = join(__dirname, '..', '..', '..', temp, 'download');
logger.debug(`Download-Verzeichnis: ${downloadDir}`);

// https://github.com/prettier/prettier/issues/3847

export const optimistic = (schema: mongoose.Schema) => {
    // https://mongoosejs.com/docs/guide.html#versionKey
    // https://github.com/Automattic/mongoose/issues/1265
    schema.pre('findOneAndUpdate', function() {
        const update = this.getUpdate();
        if (update.__v !== null) {
            delete update.__v;
        }
        const keys = ['$set', '$setOnInsert'];
        for (const key of keys) {
            // Optional Chaining
            // FIXME https://github.com/typescript-eslint/typescript-eslint/issues/1033
            // FIXME https://github.com/prettier/prettier/issues/6595
            if (update[key]?.__v !== null) { // eslint-disable-line prettier/prettier
                delete update[key].__v;
                if (Object.keys(update[key]).length === 0) {
                    delete update[key];
                }
            }
        }

        update.$inc = update.$inc || {}; // eslint-disable-line @typescript-eslint/strict-boolean-expressions,@typescript-eslint/no-unnecessary-condition
        update.$inc.__v = 1;
    });
};
