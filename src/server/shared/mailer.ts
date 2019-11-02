import { FROM, MAIL_CONFIG } from './config';
import { SendMailOptions, SentMessageInfo, createTransport } from 'nodemailer';
import { logger } from './logger';

const transporter = createTransport(MAIL_CONFIG);

export const sendMail = (
    to: string | Array<string>,
    subject: string,
    body: string,
): void => {
    const data: SendMailOptions = { from: FROM, to, subject, html: body };
    logger.debug(`sendMail(): ${JSON.stringify(data)}`);

    const sendMailCb = (err: Error | null, info: SentMessageInfo) => {
        if (err !== null) {
            logger.warn(JSON.stringify(err));
            return;
        }

        logger.debug(`Email verschickt: ${info.response}`);
    };
    return transporter.sendMail(data, sendMailCb);
};
