/* eslint-disable max-classes-per-file */

// Statt JWT (nahezu) komplett zu implementieren, koennte man z.B. Passport
// verwenden
import { logger } from '../../shared';

export class AuthorizationInvalidError implements Error {
    name = 'AuthorizationInvalidError';

    constructor(public message: string) {
        logger.silly('AuthorizationInvalidError.constructor()');
    }
}

export class TokenInvalidError implements Error {
    name = 'TokenInvalidError';

    constructor(public message: string) {
        logger.silly('TokenInvalidError.constructor()');
    }
}

export class TokenExpiredError implements Error {
    name = 'TokenExpiredError';

    constructor(public message: string) {
        logger.silly('TokenExpiredError.constructor()');
    }
}
