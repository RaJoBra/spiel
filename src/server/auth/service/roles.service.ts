import { join } from 'path';
import { logger } from '../../shared';
// https://nodejs.org/api/fs.html
// https://github.com/nodejs/node/blob/master/lib/buffer.js#L191
// Einzulesende oder zu schreibende Dateien im Format UTF-8
import { readFileSync } from 'fs';

export class RolesService {
    private static readonly ROLES: Array<string> = JSON.parse(
        readFileSync(join(__dirname, 'json', 'roles.json'), 'utf-8'),
    );

    findAllRoles() {
        return RolesService.ROLES;
    }

    getNormalizedRoles(roles: Array<string>) {
        if (roles === undefined || roles.length === 0) {
            logger.debug('RolesService.getNormalizedRoles(): undefined || []');
            return [];
        }

        const normalizedRoles = roles.filter(
            r => this.getNormalizedRole(r) !== undefined,
        );
        logger.debug(`RolesService.getNormalizedRoles(): ${normalizedRoles}`);
        return normalizedRoles;
    }

    private getNormalizedRole(role: string) {
        if (role === undefined) {
            return undefined;
        }

        // Falls der Rollenname in Grossspielstaben geschrieben ist, wird er
        // trotzdem gefunden
        return this.findAllRoles().find(
            r => r.toLowerCase() === role.toLowerCase(),
        );
    }
}
