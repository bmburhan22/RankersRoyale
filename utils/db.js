import 'pg';
import { Sequelize, STRING, INTEGER, DECIMAL } from "sequelize";
import dotenv from 'dotenv';
dotenv.config();
const { DB_URL } = process.env;
const sq = new Sequelize(DB_URL, { define: { freezeTableName: true, timestamps: false } });


// ==============USERSCASINOS================
const users_casinos = sq.define('users_casinos',
    {
        user_id: { primaryKey: true, type: STRING, allowNull: false }, casino_id: { type: STRING, primaryKey: true, allowNull: false }, casino_user_id: { type: STRING },
        prev_revenue_checkpoint: { type: DECIMAL(1000, 2), defaultValue: null, allowNull: true }, curr_revenue_checkpoint: { type: DECIMAL(1000, 2), defaultValue: null, allowNull: true },
        total_reward: { type: DECIMAL(1000, 2), defaultValue: 0, allowNull: true },
    }
);
const usersCasinosCache = {};
const usersCasinosKey = ({ casino_id, user_id }) => `${casino_id}-${user_id}`;
export const getByCasinoUserId = casino_user_id => Object.values(usersCasinosCache).find(uc => uc.casino_user_id == casino_user_id);
export const setCasinoUser = async ({ curr_revenue_checkpoint, prev_revenue_checkpoint, total_reward, ...cu }) => {
    if (curr_revenue_checkpoint !== undefined) curr_revenue_checkpoint = isNaN(parseFloat(curr_revenue_checkpoint)) ? null : parseFloat(curr_revenue_checkpoint);
    if (prev_revenue_checkpoint !== undefined) prev_revenue_checkpoint = isNaN(parseFloat(prev_revenue_checkpoint)) ? null : parseFloat(prev_revenue_checkpoint);
    if (total_reward !== undefined) total_reward = Number(total_reward);
    await users_casinos.upsert({ ...cu, curr_revenue_checkpoint, prev_revenue_checkpoint, total_reward }, {
        updateOnDuplicate: ['casino_user_id', 'prev_revenue_checkpoint', 'curr_revenue_checkpoint', 'total_reward'
        ], returning: true
    });
    return getCasinoUser(cu);
}
export const casinoUsers = () => Object.values(usersCasinosCache).map(cu => ({ ...cu, ...usersCache[cu.user_id] }));
export const getCasinoUser = rec => usersCasinosCache[usersCasinosKey(rec)]
const setUsersCasinosCache = ({ dataValues: { total_reward, ...uc } }) => usersCasinosCache[usersCasinosKey(uc)] = { ...uc, total_reward: parseFloat(total_reward) || 0 };

const bulkSetUsersCasinosCache = records => records.forEach(setUsersCasinosCache)
export const deleteCasinoUser = async ({ user_id, casino_id }) =>  user_id===undefined||casino_id===undefined?false:(await users_casinos.destroy({ where: { user_id, casino_id }, individualHooks: true }))>0;
users_casinos.addHook('afterUpsert', ([uc]) => setUsersCasinosCache(uc));
users_casinos.addHook('afterDestroy', rec => delete usersCasinosCache[usersCasinosKey(rec)]);
// =============USERS=================
const users = sq.define('users',
    { id: { primaryKey: true, type: STRING }, username: { type: STRING }, discriminator: { type: STRING }, }
);
export const usersCache = {};
export const setUser = async ({ id, username, discriminator }) => await users.upsert({ id, username, discriminator }, { updateOnDuplicate: ['username', 'discriminator'], returning: true });
const setUsersCache = user => usersCache[user.id] = user.dataValues; 
const bulkSetUsersCache = records => records.forEach(setUsersCache)
users.addHook('afterUpsert', ([user]) => setUsersCache(user));

// =======SETTINGS=========
const allowedSettings = [
    'resetMode', 'cronExpression', 'cronTimeStamp', 'withdrawApprovalMode', 'revenueSharePercent', 'withdrawCronExpression'
];
const settings = sq.define('settings', { key: { primaryKey: true, type: STRING }, value: { type: STRING } });

export const settingsCache = {};
export const setSettings = async (settingsObj) => {await settings.bulkCreate(
    Object.entries(settingsObj)
        .filter(o => allowedSettings.includes(o[0]))
        .map(([key, value]) => ({ key, value })),
    { updateOnDuplicate: ['value'] }
);
return settingsCache;
}
const setSettingsCache = s => settingsCache[s.key] = s.value;
const bulkSetSettingsCache = records => records.forEach(setSettingsCache)
settings.addHook('afterBulkCreate', bulkSetSettingsCache);
export const getSettingsNum = key => parseFloat(settingsCache[key]);

// ============== Withdrawals ===========
const withdrawals = sq.define('withdrawals', {
    id: { primaryKey: true, type: INTEGER, unique: true, autoIncrement: true, autoIncrementIdentity: true, },
    amount: { type: DECIMAL(1000, 2) }, balance: { type: DECIMAL(1000, 2) }, balance_type: { type: STRING },
    status: { type: STRING, allowNull: false, defaultValue: 'pending' },
    user_id: { type: STRING, allowNull: false }, casino_id: { type: STRING, allowNull: false }, casino_user_id: { type: STRING, allowNull: false },
}, { timestamps: true }
);
export const getWithdrawals = ()=>Object.values(withdrawalsCache).map(w=>
    ({...usersCache?.[w.user_id],...w})
)
export const withdrawalsCache = {};
const setWithdrawalsCache = ({ dataValues: { createdAt, updatedAt, ...w } }) => withdrawalsCache[w.id] = { ...w, createdAt: createdAt.getTime(), updatedAt: updatedAt.getTime() };
export const createWithdrawal = async w => await withdrawals.create(w).then(({id})=>withdrawalsCache?.[id]);
export const updateWithdrawal = async ({ id, status }) => await withdrawals.update({ status }, { where: { id }, individualHooks: true }).then(({id})=>withdrawalsCache?.[id]);
const bulkSetWithdrawalsCache = records => records.forEach(setWithdrawalsCache);
withdrawals.addHook('afterCreate',setWithdrawalsCache);
withdrawals.addHook('afterUpdate', setWithdrawalsCache);

// =============SYNC=================
sq.sync({ alter: true }).then(async () => {
    settings.findAll().then(bulkSetSettingsCache);
    users_casinos.findAll().then(bulkSetUsersCasinosCache)
    users.findAll().then(bulkSetUsersCache)
    withdrawals.findAll().then(bulkSetWithdrawalsCache)
}).catch((err) => { console.error(err); });
