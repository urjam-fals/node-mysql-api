import { expressjwt } from 'express-jwt';
import db from '../_helpers/db';
import config from '../config.json';

const {secret} = config;

export default function authorize(roles: any = []){
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        expressjwt({ secret, algorithms: ['HS256'] }),

        async (req: any, res: any, next: any) => {
            if (!req.auth) {
                return res.status(401).json({ message: 'Invalid or missing token' });
            }

            const account = await db.Account.findByPk(req.auth.sub);

            if (!account || (roles.length && !roles.includes(account.role))) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // Assign the full Sequelize model instance so that instance methods
            // like ownsToken() are available on req.user in controllers
            req.user = account;

            next();
        }
    ];
}
