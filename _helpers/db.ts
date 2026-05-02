import config from '../config.json';
import {Sequelize} from 'sequelize';
import mysql from 'mysql2/promise';
import accountModel from '../accounts/account.model';
import refreshTokenModel from '../accounts/refresh-token.model';

const db: any = {};
export default db;

initialize();

async function initialize() {
    const {host, port, user, password, database} = config.database;
    const connection = await mysql.createConnection({host, port, user, password});

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    const sequelize = new Sequelize(database, user, password, {dialect: 'mysql'});

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