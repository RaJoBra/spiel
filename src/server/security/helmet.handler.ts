import * as helmet from 'helmet';

export const helmetHandlers = [
    /* eslint-disable quotes */
    helmet.contentSecurityPolicy({
        directives: {
            // prettier-ignore
            defaultSrc: ["https: 'self'"],
            // prettier-ignore
            styleSrc: ["https: 'unsafe-inline'"],
            // prettier-ignore
            scriptSrc: ["https: 'unsafe-inline' 'unsafe-eval'"],
            imgSrc: ["data: 'self'"],
        },
    }),
    helmet.xssFilter(),
    helmet.frameguard(),
    helmet.hsts(),
    helmet.noSniff(),
    helmet.noCache(),
];
