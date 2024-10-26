import 'pg';
import { Sequelize, STRING, INTEGER, DECIMAL  } from "sequelize";
import dotenv from 'dotenv';
dotenv.config();
const { DB_URL } = process.env;
const sq = new Sequelize(DB_URL, { define: { freezeTableName: true, timestamps: false } });

// const shop_items = sq.define('shop_items',
//     { item_id: { primaryKey: true, type: INTEGER, unique: true }, price: { type: DECIMAL(1000, 2) }, minAmount: { type: DECIMAL(1000, 2) }, maxAmount: { type: DECIMAL(1000, 2) }, desc: { type: STRING }, }
// );
// ==============USERSCASINOS================
const users_casinos = sq.define('users_casinos',
    {
        user_id: { primaryKey: true, type: STRING, allowNull: false }, casino_id: { type: STRING, primaryKey: true, allowNull: false }, casino_user_id: { type: STRING },
        // prev_wager_checkpoint: { type: DECIMAL(1000, 2) }, curr_wager_checkpoint: { type: DECIMAL(1000, 2) }
        prev_revenue_checkpoint: { type: DECIMAL(1000, 2), defaultValue: null, allowNull: true }, curr_revenue_checkpoint: { type: DECIMAL(1000, 2), defaultValue: null, allowNull: true },
        total_reward: { type: DECIMAL(1000, 2), defaultValue: 0, allowNull: true },
    }
);
const usersCasinosCache = {};
const usersCasinosKey = ({ casino_id, user_id }) => `${casino_id}-${user_id}`;
export const getByCasinoUserId = (casino_user_id) => Object.values(usersCasinosCache).find(uc => uc.casino_user_id == casino_user_id);
export const setCasinoUser = async ({curr_revenue_checkpoint,prev_revenue_checkpoint,total_reward,...cu}) => {
    curr_revenue_checkpoint = isNaN(parseFloat(curr_revenue_checkpoint)) ? null : parseFloat(curr_revenue_checkpoint);
    prev_revenue_checkpoint = isNaN(parseFloat(prev_revenue_checkpoint)) ? null : parseFloat(prev_revenue_checkpoint);
    total_reward = Number(total_reward);

    return await users_casinos.upsert({...cu,curr_revenue_checkpoint,prev_revenue_checkpoint,total_reward}, {
        updateOnDuplicate: ['casino_user_id',
            // 'prev_wager_checkpoint', 'curr_wager_checkpoint',
            'prev_revenue_checkpoint', 'curr_revenue_checkpoint', 'total_reward'
        ], returning: true   
    });
}
export const casinoUsers = () => Object.values(usersCasinosCache).map(cu => ({ ...cu, ...usersCache[cu.user_id] }));
export const getCasinoUser = (rec) => usersCasinosCache[usersCasinosKey(rec)]
const setUsersCasinosCache = ({ dataValues: { total_reward, ...uc } }) => {
    usersCasinosCache[usersCasinosKey(uc)] = { ...uc, total_reward: parseFloat(total_reward) || 0 };//TODO: total_reward parseFloat
    console.log({ ...usersCasinosCache }, 'updated user casino',);
};
const bulkSetUsersCasinosCache = (records) => records.forEach(setUsersCasinosCache)
export const deleteCasinoUser = async ({ user_id, casino_id }) => {
    return await users_casinos.destroy({ where: { user_id, casino_id }, individualHooks: true });
}
users_casinos.addHook('afterUpsert', ([uc]) => setUsersCasinosCache(uc));
users_casinos.addHook('afterDestroy', (rec) => {
    console.log('deleting');
    delete usersCasinosCache[usersCasinosKey(rec)]
})
// =============USERS=================
const users = sq.define('users',
    { id: { primaryKey: true, type: STRING }, username: { type: STRING }, discriminator: { type: STRING }, /*total_points*/ }
);
export const usersCache = {};
// export const setUser =async ({ id, total_points, username, discriminator }) =>await users.upsert({ id, total_points, username, discriminator  }, { updateOnDuplicate: ['total_points', 'username', 'discriminator'],returning:true });
export const setUser = async ({ id, username, discriminator }) => await users.upsert({ id, username, discriminator }, { updateOnDuplicate: ['username', 'discriminator'], returning: true });
const setUsersCache = (user) => { usersCache[user.id] = user.dataValues; console.log('updated user'); };
const bulkSetUsersCache = (records) => records.forEach(setUsersCache)
users.addHook('afterUpsert', ([user]) => setUsersCache(user));

// =======SETTINGS=========
const allowedSettings = [
    // 'wagerPerPoint','pointsPerDollar', 
    'resetMode', 'cronExpression', 'cronTimeStamp', 'withdrawApprovalMode', 'revenueSharePercent', 'withdrawCronExpression'
];
const settings = sq.define('settings', { key: { primaryKey: true, type: STRING }, value: { type: STRING } });

export const settingsCache = {};
export const setSettings = async (settingsObj) => {
    return await settings.bulkCreate(
        Object.entries(settingsObj)
            .filter(o => allowedSettings.includes(o[0]))
            .map(([key, value]) => ({ key, value })),
        { updateOnDuplicate: ['value'] }
    );
}

const setSettingsCache = (s) => { settingsCache[s.key] = s.value; console.log('updated setting'); };
const bulkSetSettingsCache = (records) => records.forEach(setSettingsCache)
settings.addHook('afterBulkCreate', bulkSetSettingsCache);
export const getSettingsNum = (key) => parseFloat(settingsCache[key]);

// ============== Withdrawals ===========
const withdrawals = sq.define('withdrawals', {
    id: { primaryKey: true, type: INTEGER, unique: true, autoIncrement: true, autoIncrementIdentity: true, },
    amount: { type: DECIMAL(1000, 2) }, balance: { type: DECIMAL(1000, 2) }, balance_type: { type: STRING },
    status: { type: STRING, allowNull: false, defaultValue: 'pending' },
    user_id: { type: STRING, allowNull: false }, casino_id: { type: STRING, allowNull: false }, casino_user_id: { type: STRING, allowNull: false },
}, { timestamps: true }
);
export const withdrawalsCache = {};
const setWithdrawalsCache = w => withdrawalsCache[w.id] = w;

export const createWithdrawal = async w => await withdrawals.upsert(w);
export const updateWithdrawal = async ({ id, status }) => await withdrawals.update({ status }, { where: { id }, individualHooks: true });
const bulkSetWithdrawalsCache = records => records.forEach(setWithdrawalsCache);
withdrawals.addHook('afterUpsert', ([w]) => setWithdrawalsCache(w));
withdrawals.addHook('afterUpdate', setWithdrawalsCache);
withdrawals.addHook('afterSave', setWithdrawalsCache);

/*
// ===========SHOPITEMS===============
const parse = ({ minAmount, maxAmount, price, ...record }) => ({ ...record, minAmount: parseFloat(minAmount), maxAmount: parseFloat(maxAmount), price: parseFloat(price) })

export const shopItemsCache = {};
export const setShopItem = async (item) => {    return await shop_items.upsert(item);}
export const deleteShopItem = async (item_id) => {    return await shop_items.destroy({ where: { item_id } ,individualHooks:true});}
const setShopItemsCache = (item) => { shopItemsCache[item.item_id] = parse(item);
    console.log('updated shop item');  };
const bulkSetShopItemsCache = (records) => records.forEach(setShopItemsCache)
shop_items.addHook('afterUpsert',([item])=> setShopItemsCache(item));

shop_items.addHook('afterDestroy', ({item_id}) => delete shopItemsCache[item_id]);
export const getShopItems =()=> Object.values(shopItemsCache)
*/


// =============SYNC=================
sq.sync({ alter: true }).then(async () => {
    settings.findAll().then(bulkSetSettingsCache);
    users_casinos.findAll().then(bulkSetUsersCasinosCache)
    users.findAll().then(bulkSetUsersCache)
    withdrawals.findAll().then(bulkSetWithdrawalsCache)
    // shop_items.findAll().then(bulkSetShopItemsCache)
    // setSettings({ wagerPerPoint: 5, pointsPerDollar: 100 });
}).catch((err) => { console.error(err); });
