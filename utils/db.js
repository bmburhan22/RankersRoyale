import { Sequelize,Op, STRING, INTEGER } from "sequelize";
import dotenv from 'dotenv';
dotenv.config();
const { DB_URL } = process.env;
const sq = new Sequelize(DB_URL);

const settings = sq.define('settings', 
    {key:{primaryKey:true, type:STRING}, value:{ type:STRING}}
    , { freezeTableName: true, timestamps: false }
);
const shop_items = sq.define('shop_items', 
    {item_id:{primaryKey:true, type:INTEGER}, price:{type:INTEGER}, contents:{ type:STRING},desc:{ type:STRING},}
    , { freezeTableName: true, timestamps: false }
);
export const users = sq.define('users',
    {id: { primaryKey: true, type: STRING }
        , username: { type: STRING }, discriminator: { type: STRING }, total_points: { type: INTEGER, defaultValue: 0 }}
    , { freezeTableName: true, timestamps: false });
export const casinos = sq.define('casinos',
    { id: { primaryKey: true, type: STRING }, name: { type: STRING }, link: { type: STRING }, }
    , { freezeTableName: true, timestamps: false });
export const users_casinos = sq.define('users_casinos',
    {user_id: { primaryKey: true, type: STRING }, casino_id: { type: STRING, primaryKey: true }, casino_user_id: { type: STRING },
        prev_wager_checkpoint: { type: INTEGER }, curr_wager_checkpoint: { type: INTEGER }}
    , { freezeTableName: true, timestamps: false });
export const getUserById =async(id)=> await users.findOne({ where: { id } });
export const getCasinosByUserIds = async (userIds)=>await users_casinos.findAll({ where: {  user_id: { [Op.in]: userIds } } });
export const getSettings = async (key)=>await settings.findOne({ where: { key }}).then(d=>d.value);
export const getSettingsNum = async (key)=>await getSettings(key).then(parseFloat);
export const setSettings = async (key,value)=>await settings.upsert( {  key,value });
// export const getUsersCasino = async (casino_id,userIds,casinoUserIds)=>await users_casinos.findAll({where:{
//         casino_id,user_id:{[Op.in]:userIds} ,casino_user_id:{[Op.in]:casinoUserIds}, 
    // },}); 

sq.sync({ alter: true }).then(async () => {
    // static casino data
    await setSettings('wagerPerPoint', '12');
    await casinos.bulkCreate(
        [
            { id: '500casino', name: '500casino', link: 'https://500.casino' },
            { id: 'bet1', name: 'bet1', link: 'https://bet1.com' },
        ],
        { updateOnDuplicate: ['name', 'link'] });
}).catch((err) => { console.error(err); });
