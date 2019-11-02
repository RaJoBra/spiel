export const alg = 'RS256';

export const JWT_CONFIG = {
    encoding: 'utf8',
    // ggf. als DN (= distinguished name) gemaess LDAP
    issuer: 'https://hska.de/shop/JuergenZimmermann',
    secret: 'p',
    // 1 Tag in Sek.
    expiration: 24 * 60 * 60, // eslint-disable-line @typescript-eslint/no-magic-numbers
    bearer: 'Bearer',
};
