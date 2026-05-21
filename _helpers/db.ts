import fs from 'fs';
import path from 'path';

import {Sequelize} from 'sequelize';
import mysql from 'mysql2/promise';

import accountModel from '../accounts/account.model';
import refreshTokenModel from '../accounts/refresh-token.model';

type FileConfig = {
    database?: {
        host?: string;
        port?: number;
        user?: string;
        password?: string;
        database?: string;
    };
};

type DatabaseConfig = {
    host: string;
    port: number;
    user: string;
    password?: string;
    database: string;
    ssl: boolean;
};


function loadFileConfig(): FileConfig {

    try {

        const configPath =
            path.join(__dirname, '../config.json');

        const raw =
            fs.readFileSync(configPath, 'utf8');

        return JSON.parse(raw);

    } catch {

        return {};
    }
}

const fileConfig: FileConfig =
    process.env.NODE_ENV === 'production'
        ? {}
        : loadFileConfig();

const databaseConfig =
    fileConfig.database || {};

function getDatabaseConfig(): DatabaseConfig {

    const host =
        process.env.DB_HOST ||
        databaseConfig.host;

    const port =
        process.env.DB_PORT
            ? parseInt(process.env.DB_PORT, 10)
            : (databaseConfig.port || 3306);

    const user =
        process.env.DB_USER ||
        databaseConfig.user;

    const password =
        process.env.DB_PASSWORD ||
        databaseConfig.password;

    const database =
        process.env.DB_NAME ||
        databaseConfig.database;

    const ssl =
        process.env.DB_SSL === 'true';

    if (!host || !user || !database) {
        throw new Error(
            'Database configuration is incomplete'
        );
    }

    return {
        host,
        port,
        user,
        password,
        database,
        ssl
    };
}

const db: any = {};
export default db;

initialize();

async function initialize() {
    const { host, port, user, password, database, ssl } = getDatabaseConfig();

    if (!host || !user || !database) {
        throw new Error(
            'Database configuration is incomplete'
        );
    }

    const connection = await mysql.createConnection({
        host,
        port,
        user,
        password
    });

    if (
        process.env.NODE_ENV !== 'production' &&
        host === 'localhost'
    ) {
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${database}\`;`
        );
    }

    const sequelize = new Sequelize(
        database,
        user,
        password,
        {
            host,
            port,
            dialect: 'mysql',
            logging: false,

            dialectOptions: ssl
                ? {
                    ssl: {
                        rejectUnauthorized: false
                    }
                }
                : undefined
        }
    );

    db.Account = accountModel(sequelize);
    db.RefreshToken = refreshTokenModel(sequelize);

    db.Account.hasMany(db.RefreshToken, {onDelete: 'CASCADE'});
    db.RefreshToken.belongsTo(db.Account);

    await sequelize.sync();
}

/*
    summary:
    1. Connects to MySQL Server
    2. Create database if needed
    3. Connects using Sequelize
    4. Loads your models(tables)
    5. Create tables & relationships automatically
*/