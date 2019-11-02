import { Document, Schema, model } from 'mongoose';
import { MAX_RATING, autoIndex, optimistic } from '../../shared';
import { isISBN, isURL, isUUID } from 'validator';

export const schema = new Schema(
    {
        // MongoDB erstellt implizit einen Index fuer _id
        _id: { type: String },
        titel: { type: String, required: true, unique: true },
        rating: Number,
        art: String,
        verlag: { type: String, required: true },
        preis: { type: Number, required: true },
        rabatt: Number,
        lieferbar: Boolean,
        datum: Date,
        isbn: { type: String, required: true, unique: true, immutable: true },
        homepage: String,
        schlagwoerter: { type: [String], index: true },
        autoren: [Schema.Types.Mixed],
    },
    {
        toJSON: { getters: true, virtuals: false },
        // createdAt und updatedAt als automatisch gepflegte Felder
        timestamps: true,
        autoIndex,
    },
);

// Optimistische Synchronisation durch das Feld __v fuer die Versionsnummer
schema.plugin(optimistic);

export const Spiel = model('Spiel', schema);

const isPresent = (obj: string | undefined) =>
    obj !== undefined && obj !== null;
const isEmpty = (obj: string | undefined) =>
    obj === undefined || obj === null || obj === '';

export const validateSpiel = (spiel: any) => {
    const err: any = {};
    const { titel, art, rating, verlag, isbn, homepage } = spiel;

    const spielDocument = spiel as Document;
    if (!spielDocument.isNew && !isUUID(spielDocument._id)) {
        err.id = 'Das Spiel hat eine ungueltige ID.';
    }

    if (isEmpty(titel)) {
        err.titel = 'Ein Spiel muss einen Titel haben.';
    } else if (!/^\w.*/u.test(titel)) {
        err.titel =
            'Ein Spieltitel muss mit einem Spielstaben, einer Ziffer oder _ beginnen.';
    }
    if (isEmpty(art)) {
        err.art = 'Die Art eines Spieles muss gesetzt sein';
    } else if (art !== 'KINDLE' && spiel.art !== 'DRUCKAUSGABE') {
        err.art = 'Die Art eines Spieles muss KINDLE oder DRUCKAUSGABE sein.';
    }
    if (isPresent(rating) && (rating < 0 || rating > MAX_RATING)) {
        err.rating = `${rating} ist keine gueltige Bewertung.`;
    }
    if (isEmpty(verlag)) {
        err.verlag = 'Der Verlag des Spieles muss gesetzt sein.';
    } else if (verlag !== 'IWI_VERLAG' && verlag !== 'HSKA_VERLAG') {
        err.verlag =
            'Der Verlag eines Spieles muss IWI_VERLAG oder HSKA_VERLAG sein.';
    }
    if (isPresent(isbn) && !isISBN(isbn)) {
        err.isbn = `${isbn} ist keine gueltige ISBN-Nummer.`;
    }
    // Falls "preis" ein string ist: Pruefung z.B. 12.30
    // if (isPresent(preis) && !isCurrency(`${preis}`)) {
    //     err.preis = `${preis} ist kein gueltiger Preis`
    // }
    if (isPresent(homepage) && !isURL(homepage)) {
        err.homepage = `${homepage} ist keine gueltige URL.`;
    }

    return Object.keys(err).length === 0 ? undefined : err;
};
