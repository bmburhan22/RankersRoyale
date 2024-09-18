import { Sequelize, Op, STRING, INTEGER, DECIMAL } from "sequelize";
import dotenv from 'dotenv';
dotenv.config();
const { DB_URL } = process.env;
const sq = new Sequelize(DB_URL);
const allowedSettings=[ 'wagerPerPoint', 'resetMode','pointsPerDollar', 'cronExpression','cronTimeStamp'];
const settings = sq.define('settings',
    { key: { primaryKey: true, type: STRING }, value: { type: STRING } }
    , { freezeTableName: true, timestamps: false }
);
const shop_items = sq.define('shop_items',
    { item_id: { primaryKey: true, type: INTEGER, unique:true }, price: { type: DECIMAL(1000, 2) }, minAmount: { type: DECIMAL(1000,2) },maxAmount: { type: DECIMAL(1000,2) }, desc: { type: STRING }, }
    , { freezeTableName: true, timestamps: false }
);
export const users = sq.define('users',
    {
        id: { primaryKey: true, type: STRING }
        , username: { type: STRING }, discriminator: { type: STRING }, total_points: { type: DECIMAL(1000, 2), defaultValue: 0 }
    }
    , { freezeTableName: true, timestamps: false });
export const casinos = sq.define('casinos',
    { id: { primaryKey: true, type: STRING }, name: { type: STRING }, link: { type: STRING }, }
    , { freezeTableName: true, timestamps: false });
export const users_casinos = sq.define('users_casinos',
    {
        user_id: { primaryKey: true, type: STRING , allowNull:false}, casino_id: { type: STRING, primaryKey: true,allowNull:false }, casino_user_id: { type: STRING },
        prev_wager_checkpoint: { type: DECIMAL(1000, 2) }, curr_wager_checkpoint: { type: DECIMAL(1000, 2) }
    }
    , { freezeTableName: true, timestamps: false });
export const getUserById = async (id) => await users.findOne({ where: { id } });
export const getCasinosByUserIds = async (userIds) => await users_casinos.findAll({ where: { user_id: { [Op.in]: userIds } } });
export const getSettings = async () => await settings.findAll().then(settingsList=>settingsList.reduce(
(acc,{key,value})=>{
    acc[key]=value;
    return acc;
}
    ,{}
));

export const getSettingsNum = async (key) => await getSettings().then(s=>parseFloat(s[key]));
export const setSettings = async (settingsObj) => {
    return await settings.bulkCreate(
        Object.entries(settingsObj)
        .filter(o=>allowedSettings.includes(o[0]))
        .map(([key, value]) =>( { key, value })),
        { updateOnDuplicate: ['value'] }
    );
}
export const setShopItem = async (item) => {
    return await shop_items.upsert(item,);
}
export const deleteShopItem = async (item_id) => {
    return await shop_items.destroy({where: {item_id}});
}
export const getShopItems = async () => {
    return (await shop_items.findAll({raw:true}  )).map(record=>parse(record));
}
const parse = ({minAmount,maxAmount,price,...record})=>({...record,minAmount:parseFloat(minAmount), maxAmount:parseFloat(maxAmount), price:parseFloat(price)})
export const getShopItem = async (item_id) =>  parse(await shop_items.findOne({where:{item_id}}  ));
export const deleteCasinoUser = async ({user_id,casino_user_id}) => {
    return await users_casinos.destroy({where: {user_id, casino_user_id}});
}
// export const getUsersCasino = async (casino_id,userIds,casinoUserIds)=>await users_casinos.findAll({where:{
//         casino_id,user_id:{[Op.in]:userIds} ,casino_user_id:{[Op.in]:casinoUserIds}, 
// },}); 

sq.sync({ alter: true }).then(async () => {
    // static casino data
    await setSettings({ wagerPerPoint: 5, pointsPerDollar:100  });
    await casinos.bulkCreate(
        [
            { id: '500casino', name: '500casino', link: 'https://500.casino' },
            { id: 'razed', name: 'razed', link: 'https://www.razed.com/' },
        ],
        { updateOnDuplicate: ['name', 'link'] });
}).catch((err) => { console.error(err); });
