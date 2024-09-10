import { Sequelize, STRING, INTEGER } from "sequelize";
import dotenv from 'dotenv';
dotenv.config();
const { DB_URL } = process.env;
const sq = new Sequelize(DB_URL);

export const users = sq.define('users',
    {id: { primaryKey: true, type: STRING }
        , username: { type: STRING }, discriminator: { type: STRING }, points: { type: INTEGER, defaultValue: 0 }}
    , { freezeTableName: true, timestamps: false });
export const casinos = sq.define('casinos',
    { id: { primaryKey: true, type: STRING }, name: { type: STRING }, link: { type: STRING }, }
    , { freezeTableName: true, timestamps: false });
export const users_casinos = sq.define('users_casinos',
    {user_id: { primaryKey: true, type: STRING }, casino_id: { type: STRING, primaryKey: true }, casino_username: { type: STRING },
        prev_wager_checkpoint: { type: INTEGER }, curr_wager_checkpoint: { type: INTEGER }}
    , { freezeTableName: true, timestamps: false });

sq.sync({ alter: true }).then(async () => {
    // static casino data
    await casinos.bulkCreate(
        [
            { id: '500casino', name: '500casino', link: 'https://500.casino' },
            { id: 'bet1', name: 'bet1', link: 'https://bet1.com' },
        ],
        { updateOnDuplicate: ['name', 'link'] });
}).catch((err) => { console.error(err); });
