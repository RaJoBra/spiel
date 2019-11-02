/* eslint-disable no-unused-expressions,max-lines,max-lines-per-function,no-underscore-dangle */

/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* globals describe, it, before */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

// Testrunner: Mocha, jest (von Facebook, vor allem fuer React), Tape, Ava
//
// Assertions: Chai oder Expect oder Should
//  Monatl. Downloads:
//      Chai    2,9 Mio
//      Expect  2,0 Mio    (Teil von jest, s.o.)
//      Should  1,1 Mio
//
// REST-Schnittstelle testen: Supertest oder (primitiver!) request

import * as chai from 'chai';
import * as http from 'http';
import * as request from 'supertest';
import {
    HttpStatus,
    SERVER_CONFIG,
    connectDB,
    logger,
} from '../../../server/shared';
import { PATHS, app } from '../../../server/app';
import stringify from 'fast-safe-stringify';

// Fuer BDD (= Behavior-Driven Development)
// https://www.chaijs.com/plugins/chai-string
import('chai-string')
    .then(chaiString => chai.use(chaiString))
    .catch(err => {
        logger.error(`${stringify(err)}`);
        process.exit(1); // eslint-disable-line no-process-exit
    });

// -----------------------------------------------------------------------------
// T e s t s e r v e r   m i t   H T T P   u n d   R a n d o m   P o r t
// -----------------------------------------------------------------------------
const { host } = SERVER_CONFIG;

// Testserver starten und dabei mit der DB verbinden
let server: http.Server;
before(async () => {
    await connectDB();

    server = app.listen(0, host, () => {
        logger.info(`Node ${process.version}`);
        const address = server.address();
        if (address !== null && typeof address !== 'string') {
            logger.info(
                `Testserver ist gestartet: http://${host}:${address.port}`,
            );
        }
        server.emit('testServerStarted');
    });
});

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idGetVorhanden = '00000000-0000-0000-0000-000000000001';
const idNichtVorhanden = '00000000-0000-0000-0000-000000000999';

const neuesSpiel: object = {
    titel: 'Neu',
    rating: 1,
    art: 'DRUCKAUSGABE',
    verlag: 'HSKA_VERLAG',
    preis: 99.99,
    rabatt: 0.099,
    lieferbar: true,
    datum: '2016-02-28',
    isbn: '0-0070-0644-6',
    homepage: 'https://test.de/',
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
    autoren: [{ nachname: 'Test', vorname: 'Theo' }],
};
const neuesSpielInvalid: object = {
    titel: 'Blabla',
    rating: -1,
    art: 'UNSICHTBAR',
    verlag: 'NO_VERLAG',
    preis: 0,
    rabatt: 0,
    lieferbar: true,
    datum: '2016-02-01',
    isbn: 'falsche-ISBN',
    autoren: [{ nachname: 'Test', vorname: 'Theo' }],
    schlagwoerter: [],
};
const neuesSpielTitelExistiert: object = {
    titel: 'Alpha',
    rating: 1,
    art: 'DRUCKAUSGABE',
    verlag: 'HSKA_VERLAG',
    preis: 99.99,
    rabatt: 0.099,
    lieferbar: true,
    datum: '2016-02-28',
    isbn: '0-0070-9732-8',
    autoren: [{ nachname: 'Test', vorname: 'Theo' }],
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
};

const geaendertesSpiel: object = {
    titel: 'Geaendert',
    rating: 1,
    art: 'DRUCKAUSGABE',
    verlag: 'HSKA_VERLAG',
    preis: 33.33,
    rabatt: 0.033,
    lieferbar: true,
    datum: '2016-02-03',
    homepage: 'https://test.te',
    autoren: [{ nachname: 'Gamma', vorname: 'Claus' }],
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
};
const idPutVorhanden = '00000000-0000-0000-0000-000000000003';

const geaendertesSpielIdNichtVorhanden: object = {
    titel: 'Nichtvorhanden',
    rating: 1,
    art: 'DRUCKAUSGABE',
    verlag: 'HSKA_VERLAG',
    preis: 33.33,
    rabatt: 0.033,
    lieferbar: true,
    datum: '2016-02-03',
    autoren: [{ nachname: 'Gamma', vorname: 'Claus' }],
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
};
const idPutNichtVorhanden = '00000000-0000-0000-0000-000000000999';

const geaendertesSpielInvalid: object = {
    titel: 'Alpha',
    rating: -1,
    art: 'UNSICHTBAR',
    verlag: 'NO_VERLAG',
    preis: 0.01,
    rabatt: 0,
    lieferbar: true,
    datum: '2016-02-01',
    isbn: 'falsche-ISBN',
    autoren: [{ nachname: 'Test', vorname: 'Theo' }],
    schlagwoerter: [],
};

const idDeleteVorhanden = '00000000-0000-0000-0000-000000000005';

const loginDaten: object = {
    username: 'admin',
    password: 'p',
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------

// JWT fuer Authentifizierung
let token = '';

const path = PATHS.spiele;
const loginPath = PATHS.login;

// Test-Suite
/* eslint-disable @typescript-eslint/no-floating-promises*/
describe('GET /spiele', () =>
    it('Alle Spiele', (done: MochaDone) => {
        request(server)
            .get(path)
            // Assertion = Expectation
            .expect(HttpStatus.OK)
            .expect('Content-Type', /json/u)
            // Promise
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                // response.body ist ein JSON-Array mit mind. 1 JSON-Objekt
                response.body.should.be.not.empty;

                done();
            });
    }));

describe('GET /spiele/:id', () => {
    it('Spiel zu vorhandener ID', (done: MochaDone) => {
        request(server)
            .get(`${path}/${idGetVorhanden}`)
            .expect(HttpStatus.OK)
            .expect('Content-Type', /json/u)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                // response.body enthaelt ein JSON-Objekt mit Atom-Links
                const selfLink = response.body._links.self.href;
                // http://chaijs.com/plugins/chai-string
                selfLink.should.endWith(idGetVorhanden);
                done();
            });
    });

    it('Kein Spiel zu nicht-vorhandener ID', (done: MochaDone) => {
        request(server)
            .get(`${path}/${idNichtVorhanden}`)
            .expect(HttpStatus.NOT_FOUND)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                response.body.should.be.empty;
                done();
            });
    });

    it('Spiel zu vorhandener ID mit ETag', (done: MochaDone) => {
        request(server)
            .get(`${path}/${idGetVorhanden}`)
            .set('If-None-Match', '"0"')
            .expect(HttpStatus.NOT_MODIFIED)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .end((error, _) => {
                if (error) {
                    return done(error);
                }
                done();
            });
    });
});

describe('GET /spiele?...', () => {
    it('Spiele mit einem Titel, der ein "a" enthaelt', (done: MochaDone) => {
        const teilTitel = 'a';
        request(server)
            .get(`${path}?titel=${teilTitel}`)
            .expect(HttpStatus.OK)
            .expect('Content-Type', /json/u)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }

                const { body } = response;
                // response.body ist ein JSON-Array mit mind. 1 JSON-Objekt
                body.should.be.not.empty;

                // Jedes Spiel hat einen Titel mit dem Teilstring 'a'
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                body.map((spiel: any) => spiel.titel).forEach((titel: string) =>
                    titel.should.contain(teilTitel),
                );
                done();
            });
    });

    it('Keine Spiele mit einem Titel, der "XX" enthaelt', (done: MochaDone) => {
        request(server)
            .get(`${path}?titel=XX`)
            .expect(HttpStatus.NOT_FOUND)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                response.body.should.be.empty;
                done();
            });
    });

    it('Mind. 1 Spiel mit dem Schlagwort "javascript"', (done: MochaDone) => {
        const schlagwort = 'javascript';

        request(server)
            .get(`${path}?${schlagwort}=true`)
            .expect(HttpStatus.OK)
            .expect('Content-Type', /json/u)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                const { body } = response;

                // response.body ist ein JSON-Array mit mind. 1 JSON-Objekt
                body.should.be.not.empty;

                // Jedes Spiel hat im Array der Schlagwoerter "javascript"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                body.map((spiel: any) => spiel.schlagwoerter).forEach(
                    (s: Array<string>) =>
                        s.should.contain(`${schlagwort.toUpperCase()}`),
                );
                done();
            });
    });

    it('Keine Spiele mit dem Schlagwort "csharp"', (done: MochaDone) => {
        request(server)
            .get(`${path}?csharp=true`)
            .expect(HttpStatus.NOT_FOUND)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                response.body.should.be.empty;
                done();
            });
    });
});

describe('POST /spiele', () => {
    // before(): 1-malige Ausfuehrung vor allen Tests
    // beforeEach(): Ausfuehrung vor jedem einzelnen Test
    // analog: after() und afterEach()

    // Einmaliges Einloggen, um den Authentifizierungs-Token zu erhalten
    before((done: MochaDone) => {
        request(server)
            .post(`${loginPath}`)
            .set('Content-type', 'application/x-www-form-urlencoded')
            .send(loginDaten)
            .expect(HttpStatus.OK)
            // Promise
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                ({ token } = response.body);
                token.should.be.not.empty;
                // synchroner Before-Hook
                done();
            });
    });

    it('Neues Spiel', (done: MochaDone) => {
        request(server)
            .post(path)
            .set('Authorization', `Bearer ${token}`)
            .send(neuesSpiel)
            .expect(HttpStatus.CREATED)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }

                const { location } = response.header;
                location.should.be.not.empty;

                // UUID: Muster von HEX-Ziffern
                const indexLastSlash: number = location.lastIndexOf('/');
                const idStr = location.substring(indexLastSlash + 1);
                idStr.should.match(
                    /* eslint-disable-next-line max-len */
                    /[\dA-Fa-f]{8}-[\dA-Fa-f]{4}-[\dA-Fa-f]{4}-[\dA-Fa-f]{4}-[\dA-Fa-f]{12}/u,
                );
                done();
            });
    });

    it('Neues Spiel mit ungueltigen Daten', (done: MochaDone) => {
        request(server)
            .post(path)
            .set('Authorization', `Bearer ${token}`)
            .send(neuesSpielInvalid)
            .expect(HttpStatus.BAD_REQUEST)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }

                const { body } = response;
                body.art.should.be.equal(
                    'Die Art eines Spieles muss KINDLE oder DRUCKAUSGABE sein.',
                );
                body.rating.should.endWith('ist keine gueltige Bewertung.');
                body.verlag.should.be.equal(
                    'Der Verlag eines Spieles muss IWI_VERLAG oder HSKA_VERLAG sein.',
                );
                body.isbn.should.endWith('ist keine gueltige ISBN-Nummer.');
                done();
            });
    });

    it('Neues Spiel, aber der Titel existiert bereits', (done: MochaDone) => {
        request(server)
            .post(path)
            .set('Authorization', `Bearer ${token}`)
            .send(neuesSpielTitelExistiert)
            .expect(HttpStatus.BAD_REQUEST)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                response.text.should.contain('Titel');
                done();
            });
    });

    it('Neues Spiel, aber ohne Token', (done: MochaDone) => {
        request(server)
            .post(path)
            .send(neuesSpiel)
            .expect(HttpStatus.UNAUTHORIZED)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                response.body.should.be.empty;
                done();
            });
    });

    it('Neues Spiel, aber mit falschem Token', (done: MochaDone) => {
        request(server)
            .post(path)
            .set('Authorization', 'Bearer x')
            .send(neuesSpiel)
            .expect(HttpStatus.UNAUTHORIZED)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                response.body.should.be.empty;
                done();
            });
    });
});

describe('PUT /spiele/:id', () => {
    // this.retries(4)

    before((done: MochaDone) => {
        request(server)
            .post(`${loginPath}`)
            .set('Content-type', 'application/x-www-form-urlencoded')
            .send(loginDaten)
            .expect(HttpStatus.OK)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                ({ token } = response.body);
                token.should.be.not.empty;
                done();
            });
    });

    it('Vorhandenes Spiel aendern', (done: MochaDone) => {
        request(server)
            .put(`${path}/${idPutVorhanden}`)
            .set('Authorization', `Bearer ${token}`)
            .set('If-Match', '"0"')
            .send(geaendertesSpiel)
            .expect(HttpStatus.NO_CONTENT)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                response.body.should.be.empty;
                done();
            });
    });

    it('Nicht-vorhandenes Spiel aendern', (done: MochaDone) => {
        request(server)
            .put(`${path}/${idPutNichtVorhanden}`)
            .set('Authorization', `Bearer ${token}`)
            .set('If-Match', '"0"')
            .send(geaendertesSpielIdNichtVorhanden)
            .expect(HttpStatus.PRECONDITION_FAILED)
            .end(error => {
                if (error) {
                    return done(error);
                }
                done();
            });
    });

    it('Vorhandenes Spiel aendern, aber mit ungueltigen Daten', (done: MochaDone) => {
        request(server)
            .put(`${path}/${idPutVorhanden}`)
            .set('Authorization', `Bearer ${token}`)
            .set('If-Match', '"0"')
            .send(geaendertesSpielInvalid)
            .expect(HttpStatus.BAD_REQUEST)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                const { body } = response;
                body.art.should.be.equal(
                    'Die Art eines Spieles muss KINDLE oder DRUCKAUSGABE sein.',
                );
                body.rating.should.endWith('ist keine gueltige Bewertung.');
                body.verlag.should.be.equal(
                    'Der Verlag eines Spieles muss IWI_VERLAG oder HSKA_VERLAG sein.',
                );
                body.isbn.should.endWith('ist keine gueltige ISBN-Nummer.');
                done();
            });
    });

    it('Vorhandenes Spiel aendern, aber ohne Token', (done: MochaDone) => {
        request(server)
            .put(`${path}/${idPutVorhanden}`)
            .set('If-Match', '"0"')
            .send(geaendertesSpiel)
            .expect(HttpStatus.UNAUTHORIZED)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                response.body.should.be.empty;
                done();
            });
    });

    it('Vorhandenes Spiel aendern, aber mit falschem Token', (done: MochaDone) => {
        request(server)
            .put(`${path}/${idPutVorhanden}`)
            .set('Authorization', 'Bearer x')
            .set('If-Match', '"0"')
            .send(geaendertesSpiel)
            .expect(HttpStatus.UNAUTHORIZED)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                response.body.should.be.empty;
                done();
            });
    });
});

describe('DELETE /spiele', () => {
    before((done: MochaDone) => {
        request(server)
            .post(`${loginPath}`)
            .set('Content-type', 'application/x-www-form-urlencoded')
            .send(loginDaten)
            .expect(HttpStatus.OK)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                ({ token } = response.body);
                token.should.be.not.empty;
                done();
            });
    });

    it('Vorhandenes Spiel loeschen', (done: MochaDone) => {
        request(server)
            .delete(`${path}/${idDeleteVorhanden}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(HttpStatus.NO_CONTENT)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                response.body.should.be.empty;
                done();
            });
    });

    it('Spiel loeschen, aber ohne Token', (done: MochaDone) => {
        request(server)
            .delete(`${path}/${idDeleteVorhanden}`)
            .expect(HttpStatus.UNAUTHORIZED)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                response.body.should.be.empty;
                done();
            });
    });

    it('Spiel loeschen, aber mit falschem Token', (done: MochaDone) => {
        request(server)
            .delete(`${path}/${idDeleteVorhanden}`)
            .set('Authorization', 'Bearer x')
            .expect(HttpStatus.UNAUTHORIZED)
            .end((error, response) => {
                if (error) {
                    return done(error);
                }
                response.body.should.be.empty;
                done();
            });
    });
});
