

import { readFileSync } from 'fs';
import { resolve } from 'path';

const { AS_HOST, AS_PORT } = process.env; // eslint-disable-line no-process-env
// Nullish Coalescing
const host = AS_HOST ?? 'localhost';

// Nullish Coalescing
const portStr = AS_PORT ?? '8443';
const port = parseInt(portStr, 10);

export const SERVER_CONFIG = {
    host,
    port,

    // https://nodejs.org/api/https.html
    // https://nodejs.org/api/fs.html
    // https://nodejs.org/api/path.html
    // http://2ality.com/2017/11/import-meta.html
    key: readFileSync(resolve(__dirname, 'key.pem')),
    cert: readFileSync(resolve(__dirname, 'certificate.cer')),
};
