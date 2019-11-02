import 'source-map-support/register';
import * as http from 'http';
import * as https from 'https';
import * as os from 'os';
import { SERVER_CONFIG, connectDB, logger } from './shared';
import { app } from './app';
import { connection } from 'mongoose';

// Destructuring
const { cert, host, key, port } = SERVER_CONFIG;
// Shorthand Properties
const credentials = { key, cert };

// Arrow Function
const sigintCb = () => {
    logger.info('Server wird heruntergefahren...');
    connection.close(() => process.exit(0)); // eslint-disable-line no-process-exit,@typescript-eslint/no-floating-promises
};

const unhandledRejectionCb = (err: any) => {
    logger.error(err);
    logger.info(
        'Verbindung zu MongoDB wird wegen "unhandledRejection" geschlossen.',
    );
    connection.close(() => process.exit(1)); // eslint-disable-line no-process-exit,@typescript-eslint/no-floating-promises
};

const startServer = () => {
    // https://stackoverflow.com/questions/11744975/enabling-https-on-express-js#answer-11745114
    https
        .createServer(credentials, app as http.RequestListener)
        .listen(port, () => {
            const banner =
                '\n' +
                '______/\\\\\\\\\\\__/\\\\\\\\\\\\\_______/\\\\\\\\\\\\__/\\\\\\\\\\\\\___ \n'+       
                '_____\/////\\\///__\/\\\/////////\\\___/\\\//////////__\/\\\/////////\\\_ \n'+     
                ' _________\/\\\_____\/\\\_______\/\\\__/\\\_____________\/\\\_______\/\\\_\n'+      
                '  _________\/\\\_____\/\\\\\\\\\\\\\\__\/\\\____/\\\\\\\_\/\\\\\\\\\\\\\\__   \n'+  
                '   _________\/\\\_____\/\\\/////////\\\_\/\\\___\/////\\\_\/\\\/////////\\\_   \n'+ 
                '    _________\/\\\_____\/\\\_______\/\\\_\/\\\_______\/\\\_\/\\\_______\/\\\_   \n'+
                '     __/\\\___\/\\\_____\/\\\_______\/\\\_\/\\\_______\/\\\_\/\\\_______\/\\\_  \n'+
                '      _\//\\\\\\\\\______\/\\\\\\\\\\\\\/__\//\\\\\\\\\\\\/__\/\\\\\\\\\\\\\/__ \n'+
                '       __\/////////_______\/////////////_____\////////////____\/////////////____\n'+
                '\n';
            logger.info(banner);
            // https://nodejs.org/docs/v12.0.0/api/process.html
            logger.info(`Node Version:   ${process.version}`);
            logger.info(`Betriebssystem: ${os.type()} ${os.release()}`);
            logger.info(`Rechnername:    ${os.hostname()}`);
            logger.info(
                `https://${host}:${port} ist gestartet: Herunterfahren durch <Strg>C`,
            );
        });
    process.on('SIGINT', sigintCb);
    process.on('unhandledRejection', unhandledRejectionCb);
};

// connectDB() liefert ein Promise
connectDB()
    .then(startServer)
    .catch(() => {
        logger.error('Fehler bei Aufbau der DB-Verbindung');
    });
