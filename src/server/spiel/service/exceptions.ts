/* eslint-disable max-classes-per-file */

import { logger } from '../../shared';

// http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript#answer-5251506
// https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Error

export class ValidationError implements Error {
    name = 'ValidationError';
    // readonly code = 4711

    constructor(public message: string) {
        logger.debug(`ValidationError.constructor(): ${message}`);
    }
}

export class TitelExistsError implements Error {
    name = 'TitelExistsError';

    constructor(public message: string) {
        logger.debug(`TitelExistsError.constructor(): ${message}`);
    }
}

export class IsbnExistsError implements Error {
    name = 'IsbnExistsError';

    constructor(public message: string) {
        logger.debug(`IsbnExistsError.constructor(): ${message}`);
    }
}

export class VersionInvalidError implements Error {
    name = 'VersionInvalidError';

    constructor(public message: string) {
        logger.debug(`VersionInvalidError.constructor(): ${message}`);
    }
}

export class SpielNotExistsError implements Error {
    name = 'SpielNotExistsError';

    constructor(public message: string) {
        logger.debug(`SpielNotExistsError.constructor(): ${message}`);
    }
}
