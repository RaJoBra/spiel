import * as SMTPTransport from 'nodemailer/lib/smtp-transport';

export const FROM = '"Joe Doe" <nnvv0011@hs-karlsruhe.de>';

export const MAIL_CONFIG: SMTPTransport.Options = {
    // host: 'localhost', // default
    host: '127.0.0.1',

    port: 25000,

    secure: false,

    priority: 'normal',
    logger: true,
    headers: { 'X-ProvidedBy': 'Software Engineering' },
};
