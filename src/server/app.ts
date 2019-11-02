import * as RateLimit from 'express-rate-limit';
import * as compression from 'compression';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
// Alternative zu multer: connect-multiparty
import * as multer from 'multer';
// in der .d.ts-Datei von response-time muesste um die Function responseTime
// ein gleichnamiger namespace definiert sein.
import * as responseTime from 'response-time';
import {
    MAX_REQUESTS_PER_WINDOW,
    WINDOW_SIZE,
    internalError,
    logRequestHeader,
    notFound,
    notYetImplemented,
    responseTimeFn,
    uploadDir,
    validateContentType,
    validateUUID,
} from './shared';
import {
    create,
    deleteFn,
    download,
    find,
    findById,
    update,
    upload,
} from './spiel/rest';
import { index, neuesSpiel, suche } from './spiel/html';
import { isAdmin, isAdminMitarbeiter, login, validateJwt } from './auth/rest';
// Einlesen von application/json im Request-Rumpf
// Fuer multimediale Daten (Videos, Bilder, Audios): raw-body
import { json, urlencoded } from 'body-parser';
import { graphqlSchema } from './spiel/graphql/graphqlSchema';
import { helmetHandlers } from './security';
import { join } from 'path';

const { Router } = express;

//

const rateLimitOptions: RateLimit.Options = {
    // z.B. 15 Minuten als Zeitfenster (Ms = Millisekunden)
    windowMs: WINDOW_SIZE,
    // z.B. max 100 requests/IP in einem Zeitfenster
    max: MAX_REQUESTS_PER_WINDOW,
};
const limiter = new RateLimit(rateLimitOptions);

// hochgeladene Dateien im Verzeichnis uploads speichern
const uploader = multer({ dest: uploadDir });

// hochgeladene Dateien als Buffer im Hauptspeicher halten
// const storage = multer.memoryStorage()
// const uploader = multer({storage})

export const PATHS = {
    spiele: '/spiele',
    verlage: '/verlage',
    login: '/login',
    graphql: '/api',
    html: '/html',
};

// Express als Middleware = anwendungsneutrale Dienste-/Zwischenschicht,
// d.h. Vermittler zwischen Request und Response.
// Alternativen zu Express (hat die hoechsten Download-Zahlen):
// * Hapi: von Walmart
// * Restify
// * Koa: von den urspruengl. Express-Entwicklern
// * Sails: baut auf Express auf, Waterline als ORM
// * Kraken: baut auf Express auf
//           von PayPal
//           verwaltet von der Node.js Foundation
//           genutzt von Oracle mit Oracle JET

class App {
    // Das App- bzw. Express-Objekt ist zustaendig fuer:
    //  * Konfiguration der Middleware
    //  * Routing
    // http://expressjs.com/en/api.html
    readonly app = express();

    constructor() {
        this.config();
        this.routes();
    }

    private config() {
        // eslint-disable-next-line no-process-env
        if (process.env.NODE_ENV === 'development') {
            // Logging der eingehenden Requests in der Console
            this.app.use(
                morgan('dev'),
                // Protokollierung der Response Time
                responseTime(responseTimeFn),
                // Protokollierung des eingehenden Request-Headers
                logRequestHeader,
            );
        } else {
            this.app.use(helmet.hidePoweredBy());
        }

        this.app.use(
            // Spread Operator ab ES 2015
            ...helmetHandlers,

            // falls CORS fuer die Webanwendung notwendig ist:
            // corsHandler,

            // GZIP-Komprimierung implizit unterstuetzt durch Chrome, FF, ...
            //   Accept-Encoding: gzip
            // Alternative: z.B. nginx als Proxy-Server und dort komprimieren
            compression(),
            limiter,
        );
    }

    private routes() {
        this.spieleRoutes();
        this.verlagRoutes();
        this.loginRoutes();
        this.spielGraphqlRoutes();
        this.htmlRoutes();

        this.app.get('*', notFound);
        this.app.use(internalError);
    }

    private spieleRoutes() {
        // vgl: Spring WebFlux.fn
        // http://expressjs.com/en/api.html
        // Beispiele fuer "Middleware" bei Express:
        //  * Authentifizierung und Autorisierung
        //  * Rumpf bei POST- und PUT-Requests einlesen
        //  * Logging, z.B. von Requests
        //  * Aufruf der naechsten Middleware-Funktion
        // d.h. "Middleware" ist eine Variation der Patterns
        //  * Filter (Interceptoren) und
        //  * Chain of Responsibility
        // Ausblick zu Express 5 (z.Zt. noch als Alpha-Release):
        //  * Router als eigenes Modul https://github.com/pillarjs/router
        //  * Zusaetzliche Syntax beim Routing
        //  * Promises statt Callbacks
        //  * Verbesserte Handhabung von Query Strings
        //  * noch keine .d.ts-Datei
        const router = Router(); // eslint-disable-line new-cap
        router
            .route('/')
            .get(find)
            .post(
                validateJwt,
                validateContentType,
                isAdminMitarbeiter,
                json(),
                create,
            );

        const idParam = 'id';
        router
            .param(idParam, validateUUID)
            .get(`/:${idParam}`, findById)
            .put(
                `/:${idParam}`,
                validateJwt,
                validateContentType,
                isAdminMitarbeiter,
                json(),
                update,
            )
            .delete(`/:${idParam}`, validateJwt, isAdmin, deleteFn)
            // req.file enthaelt die Binaerdatei
            // Postman, Insomnia:   MIME-Typ: multipart/form-data
            //                      Name: file
            .put(
                `/:${idParam}/media`,
                validateJwt,
                isAdminMitarbeiter,
                uploader.single('file'),
                upload,
            )
            .get(`/:${idParam}/media`, download);

        this.app.use(PATHS.spiele, router);
    }

    private verlagRoutes() {
        const router = Router(); // eslint-disable-line new-cap
        router.get('/', notYetImplemented);
        this.app.use(PATHS.verlage, router);
    }

    private loginRoutes() {
        const router = Router(); // eslint-disable-line new-cap
        router.route('/').post(
            urlencoded({
                extended: false,
                type: 'application/x-www-form-urlencoded',
            }),
            login,
        );
        this.app.use(PATHS.login, router);
    }

    private spielGraphqlRoutes() {
        const middleware = graphqlHTTP({
            schema: graphqlSchema,
            // "A graphical interactive in-browser GraphQL IDE"
            graphiql: true,
        });
        this.app.use(PATHS.graphql, middleware);
    }

    private htmlRoutes() {
        const router = Router(); // eslint-disable-line new-cap
        router.route('/').get(index);
        router.route('/suche').get(suche);
        router.route('/neues-spiel').get(neuesSpiel);
        this.app.use(PATHS.html, router);

        // Alternativen zu Pug: EJS, Handlebars, ...
        // https://github.com/expressjs/express/wiki#template-engines
        this.app.set('view engine', 'ejs');
        // __dirname ist das Verzeichnis ".../dist/server"
        this.app.set('views', join(__dirname, 'views'));

        this.app.use(express.static(join(__dirname, 'public')));
    }
}
export const { app } = new App();
