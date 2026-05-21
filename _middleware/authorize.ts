import { expressjwt as jwt } from 'express-jwt';
import fs from 'fs';
import path from 'path';

import db from '../_helpers/db';

type FileConfig = {
    secret?: string;
};

function loadFileConfig(): FileConfig {
    try {
        const configPath = path.join(__dirname, '../config.json');
        const raw = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

const fileConfig: FileConfig =
    process.env.NODE_ENV === 'production'
        ? {}
        : loadFileConfig();

const secret =
    process.env.JWT_SECRET || fileConfig.secret;

if (!secret) {
    throw new Error('JWT secret is required');
}

if (
    process.env.NODE_ENV === 'production' &&
    !process.env.JWT_SECRET
) {
    throw new Error(
        'JWT_SECRET environment variable is required in production'
    );
}

export default function authorize(roles: any = []) {

    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        jwt({ secret, algorithms: ['HS256'], requestProperty: 'user' }),

        async (req: any, res: any, next: any) => {

            const account =
                await db.Account.findByPk(req.user.id);

            if (
                !account ||
                (roles.length &&
                    !roles.includes(account.role))
            ) {
                return res.status(401).json({
                    message: 'Unauthorized'
                });
            }

            req.user.role = account.role;

            const refreshTokens =
                await account.getRefreshTokens();

            req.user.ownsToken = (token: any) =>
                !refreshTokens.find(
                    (x: any) => x.token === token
                );

            next();
        }
    ];
}
