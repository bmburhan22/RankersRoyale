
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import express, { json } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { ROUTES, CLIENT_ROUTES, DISCORD_API } from './utils/routes.js';
import bot from './utils/discordBot.js';
import https from 'https';
import {
    casinoUsers, deleteCasinoUser,
    getByCasinoUserId, getCasinoUser,
    getSettingsNum, setCasinoUser, setSettings,
    // getShopItems, deleteShopItem, setShopItem,shopItemsCache,
    settingsCache, setUser, usersCache,
    withdrawals,
    withdrawalsCache
} from './utils/db.js';
import cron from 'node-cron';
import { casinos, refreshLeaderboardData } from './utils/casinos.js';
import { readFileSync } from 'fs';
dotenv.config();
const { PORT, JWT_SECRET, DISCORD_ADMIN_ROLE_ID, DISCORD_OAUTH2_URL, DISCORD_CLIENT_SECRET } = process.env;



const app = express();
const VITE_PATH = path.join(path.resolve(), 'dist');
app.use(express.static(VITE_PATH, { index: false }));

app.use(cors());
app.use(json());
app.use(cookieParser());

class ErrorCode extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = this.constructor.name;
    }
}

const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies?.['token'];
        if (!token) throw new ErrorCode(401, 'Authorization token needed');

        const user_id = jwt.verify(token, JWT_SECRET, (err, user_id) => {
            if (err) throw new ErrorCode(401, err.toString());
            return user_id;
        });

        const member = bot.verifiedMembers.find(m => m.id == user_id)
        if (!member) throw new ErrorCode(403, 'Not a verified server member');
        member.isAdmin = member.roles.cache.has(DISCORD_ADMIN_ROLE_ID)
        res.locals.member = member;
        await next();

    } catch (err) {
        return res.status(err.code).json({ err: err.toString() });
    }
};

const { redirect_uri, client_id } = Object.fromEntries(new URL(DISCORD_OAUTH2_URL).searchParams);
const REDIRECT = new URL(redirect_uri).pathname;
app.get(REDIRECT, async ({ query: { code } }, res) => {
    try {
        if (!code) throw new ErrorCode(500, 'No auth code found');
        const params = new URLSearchParams({
            client_id, redirect_uri, code, client_secret: DISCORD_CLIENT_SECRET, grant_type: 'authorization_code',
        });
        const { data: { access_token } } = await axios.post(`${DISCORD_API}/oauth2/token`, params,);
        const { data: { id, username, discriminator } } = await axios.get(`${DISCORD_API}/users/@me`, { headers: { 'Authorization': `Bearer ${access_token}`, } });
        await setUser({ id, username, discriminator });
        return res.cookie('token', jwt.sign(id, JWT_SECRET), { maxAge: 30 * 24 * 60 * 60 * 1000 }).redirect(ROUTES.HOME);
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});
const calcRevenue = (total, checkpoint) => Math.max(0, total - (checkpoint ?? total))
const getCasinoLeaderboards = (casinoIds = Object.keys(casinos)) => {
    let leaderboards = { 'casinos': {}, total: {} };
    const userIds = bot.verifiedMembers.map(m => m.id);
    for (let casino_id of casinoIds) {
        leaderboards.casinos[casino_id] = casinos[casino_id].data;
        let casinoMembers = casinos[casino_id].leaderboard;
        for (let c of casinoMembers) {
            c.casino_user = getByCasinoUserId(c.casino_user_id);
            c.revenue = calcRevenue(c.total_revenue, c.casino_user?.curr_revenue_checkpoint)
            c.reward = c.revenue * 0.1;
            c.user_id = c.casino_user?.user_id;
            c.user = userIds.includes(c.user_id) ? usersCache[c.user_id] : null;
            if (casinoIds.length > 1) {
                if (leaderboards.total[c.user_id]) {
                    leaderboards.total[c.user_id].revenue += c.revenue;
                    leaderboards.total[c.user_id].reward += c.reward;
                }
                else if (c.user_id) leaderboards.total[c.user_id] = { ...c }
            }
        }
        leaderboards.casinos[casino_id].leaderboard = casinoMembers.filter(cu => cu.casino_user != null && cu.user != null).toSorted((a, b) => b.revenue - a.revenue)
    }
    return leaderboards;
}
// const calcRevenue = (total, checkpoint) => Math.max(0, total - (checkpoint ?? total))
// const getCasinoLeaderboards = (casinoIds = Object.keys(casinos)) => {
//     let leaderboards = { 'casinos': {}, total: {} };
//     const userIds = bot.verifiedMembers.map(m => m.id);
//     const wagerPerPoint = getSettingsNum('wagerPerPoint');
//     for (let casino_id of casinoIds) {
//         leaderboards.casinos[casino_id] = casinos[casino_id].data;
//         let casinoMembers = casinos[casino_id].leaderboard;
//         for (let c of casinoMembers) {
//             c.casino_user = getByCasinoUserId(c.casino_user_id);
//             // c.wager = calcRevenue(c.total_wager, c.casino_user?.curr_wager_checkpoint)
//             c.revenue = calcRevenue(c.total_revenue, c.casino_user?.curr_revenue_checkpoint)
//             // c.points = c.wager / wagerPerPoint;
//             c.user_id = c.casino_user?.user_id;
//             c.user = userIds.includes(c.user_id) ? usersCache[c.user_id] : null;
//             if (casinoIds.length > 1) {
//                 if (leaderboards.total[c.user_id]) {
//                     leaderboards.total[c.user_id].wager += c.wager;
//                     leaderboards.total[c.user_id].points += c.points;
//                     leaderboards.total[c.user_id].total_wager += c.total_wager;
//                 }
//                 else if (c.user_id) leaderboards.total[c.user_id] = { ...c }
//             }
//         }
//         leaderboards.casinos[casino_id].leaderboard = casinoMembers.filter(cu => cu.casino_user != null && cu.user != null).toSorted((a, b) => b.wager - a.wager)
//     }
//     return leaderboards;
// }
app.get(ROUTES.CASINOS, async ({ query: { casino_id } }, res) => {
    try {
        if (Object.keys(casinos).includes(casino_id))
            return res.json(getCasinoLeaderboards([casino_id]));
        return res.json(getCasinoLeaderboards());
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});


const memberToUser = (member) => {
    const { username, discriminator, globalName } = member.user;
    const { displayAvatarURL, nickname, isAdmin } = member.toJSON();
    return { isAdmin, username, discriminator, globalName, nickname, displayAvatarURL };
}

app.get(ROUTES.ME, authenticate, async (req, res) => {
    try {
        return res.json(memberToUser(res.locals.member));
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

app.post(ROUTES.CASINOS, authenticate, async ({ body: { casino_id, casino_user_id } }, res) => {
    try {
        if (!casinos[casino_id]) return res.json({ 'msg': 'Invalid casino' });
        const user_casino = await setCasinoUser({ user_id: res.locals.member.id, casino_id, casino_user_id });
        return res.json(user_casino);
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});
const round = val => Math.floor(parseFloat(val) * 100) / 100;
const transaction = async ({ user_id, casinoId, amount, balance_type }) => {
    console.log({ amount, rounded: round(amount) });
    amount = round(amount);

    const user = usersCache[user_id];
    if (amount > 100) throw new ErrorCode(400, 'Redeem amount must not be more than 100');
    if (amount < 0.01) throw new ErrorCode(400, 'Redeem amount must be atleast 0.01');
    if (user.total_reward < amount) throw new ErrorCode(400, 'Insufficient funds');
    const { casino_user_id } = getCasinoUser({ user_id, casino_id: casinoId });
    console.log({ casino_user_id, total_reward: user.total_reward });
    const w = withdrawals.create({ casino_id: casinoId, casino_user_id, user_id, amount, balance: user.total_reward - amount,balance_type });
    if (w) {
        user.decrement({total_reward: amount});
        await user.save();
    }
    return w;
}

const handleWithdrawal = async (w, approve) => {
    const amount = parseFloat(w.amount);
    if (approve)
        {
            const {success} = await casinos[w.casino_id].sendBalance(w.casino_user_id, amount, w.balance_type);
            approve=success
        }
    if (!approve) {
        const u = usersCache[w.user_id];
        u.increment({total_reward:amount});
        await u.save();
    }

    w.status = approve == null ? 'pending' : approve ? 'approved' : 'rejected';
    return await w.save();
}
app.get(ROUTES.WITHDRAWALS, authenticate, async (req, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        return res.json(withdrawalsCache);
    } catch (err) {
        return res.json({ code: err.code, err: err.toString() });
    }
});
app.post(ROUTES.WITHDRAWALS, authenticate, async ({ body: { wid, approve } }, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        if (!withdrawalsCache[wid]) throw new ErrorCode(400, 'Transaction not found');
        if (['approved','rejected'].includes(withdrawalsCache[wid]?.status) ) throw new ErrorCode(400, 'Transaction found to be '+withdrawalsCache[wid]?.status);
        if (approve == null) throw new ErrorCode(400, 'Specify approval true/false');
        return res.json(handleWithdrawal(withdrawalsCache[wid], approve));
    } catch (err) {
        return res.json({ code: err.code, err: err.toString() });
    }
});
app.post(ROUTES.CLAIM_REWARD, authenticate, async (req, res) => {
    try {
        // if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        const r = await transaction({ ...req.body, user_id: res.locals.member.id, });
        return res.json(r);
    } catch (err) {
        return res.json({ code: err.code, err: err.toString() });
    }
});
app.get(ROUTES.CLAIM_REWARD, authenticate, async (req, res) => {
    try {
        // if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        return res.json({ total_reward: usersCache[res.locals.member.id].total_reward });
    } catch (err) {
        return res.json({ code: err.code, err: err.toString() });
    }
});
/*
const transaction = async ({ user_id, casinoId, amount, price, balanceType }) => {
    console.log({ amount, price, rounded: round(amount) });
    amount = round(amount);
    price = round(price);

    const user = usersCache[user_id];
    if (amount > 100) throw new ErrorCode(400, 'Redeem amount must not be more than 100');
    if (amount < 0.01) throw new ErrorCode(400, 'Redeem amount must be atleast 0.01');
    if (user.total_points <= price) throw new ErrorCode(400, 'Insufficient points');
    const { casino_user_id } = getCasinoUser({ user_id, casino_id: casinoId });
    console.log({ casino_user_id, total_points: user.total_points });
    const r = await casinos[casinoId].sendBalance(casino_user_id, amount, balanceType);
    console.log(r);
    if (r.success) {
        user.total_points -= price;
        await user.save();
    }
    return r;
}

app.post(ROUTES.REDEEM, authenticate, async (req, res) => {
    try {
        // if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        const price = parseFloat(req.body.amount) * getSettingsNum('pointsPerDollar');
        const r = await transaction({ ...req.body, price, user_id: res.locals.member.id, });
        return res.json(r);
    } catch (err) {
        return res//.status(err.code)
            .json({ code: err.code, err: err.toString() });
    }
});

const random = (min, max) => Math.random() * (max - min) + min;
app.post(ROUTES.BUY, authenticate, async ({ body: { item_id, balanceType, casinoId } }, res) => {
    try {
        const { minAmount, maxAmount, price } = shopItemsCache[item_id];
        if (!(minAmount && maxAmount && price) || minAmount > maxAmount) throw new ErrorCode(403, 'Item not found');
        const amount = random(minAmount, maxAmount);
        console.log({ item_id, price, amount, minAmount, maxAmount });

        const r = await transaction({ balanceType, casinoId, amount, price, user_id: res.locals.member.id, });
        return res.json(r);
    } catch (err) {
        return res.json({ code: err.code, err: err.toString() });
    }
});
*/

app.get(ROUTES.MEMBERS, async (req, res) => {
    try {
        return res.json(casinoUsers().map(cu => ({ ...cu.dataValues, ...usersCache[cu.user_id]?.dataValues })));
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});
app.post(ROUTES.MEMBERS, async ({ body: { user_id, casino_id, casino_user_id, /*total_points,curr_wager_checkpoint, prev_wager_checkpoint*/
    curr_revenue_checkpoint, prev_revenue_checkpoint } }, res) => {
    try {
        const [casinoUser] = await setCasinoUser({
            user_id, casino_user_id, casino_id,/* curr_wager_checkpoint, prev_wager_checkpoint*/
            curr_revenue_checkpoint, prev_revenue_checkpoint,
        });
        const [usersData] = await setUser({ id: user_id, /*total_points*/ total_revenue });
        return res.json({ ...casinoUser.dataValues, ...usersData.dataValues });

    } catch (err) {
        return res.json({ err: err.toString() });
    }
});
app.delete(ROUTES.MEMBERS, async ({ body: { user_id, casino_id } }, res) => {
    try {
        const r = await deleteCasinoUser({ user_id, casino_id });
        return res.json(r);

    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

const refreshRevenue = async () => {
    await refreshLeaderboardData();
    for await (let casinoData of Object.values(getCasinoLeaderboards().casinos)) {
        for await (let { total_revenue, revenue, reward, casino_user: cu, user } of casinoData.leaderboard) {
            cu.prev_revenue_checkpoint = cu.curr_revenue_checkpoint ?? cu.prev_revenue_checkpoint;
            cu.curr_revenue_checkpoint = total_revenue;
            await cu.save();
            console.log({ total_reward: user.total_reward, revenue, reward });
            await user.increment({ total_reward: reward });
        }
    }
    const cronTimeStamp = Date.now();
    console.log({ cronTimeStamp });
    setSettings({ cronTimeStamp });
    return;
}

let task;
const scheduleTask = async () => {
    const { resetMode, cronExpression } = settingsCache;
    const scheduled = resetMode == 'auto';
    console.log({ valid: cron.validate(cronExpression), resetMode, scheduled, cronExpression });
    task?.stop();
    task = (!scheduled || !cron.validate(cronExpression)) ? null : cron.schedule(cronExpression, refreshRevenue, { timezone: 'ist', scheduled });
    task?.start();

}
scheduleTask();

app.post(ROUTES.REFRESH_REVENUE, authenticate, async (req, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        await refreshRevenue();
        return res.json({ message: 'Revenue refreshed' });
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

/*
const resetLeaderboard = async () => {
    await refreshLeaderboardData();
    for await (let casinoData of Object.values(getCasinoLeaderboards().casinos)) {
        for await (let { total_wager, wager, wagerPerPoint, points, casino_user: cu, user } of casinoData.leaderboard) {
            cu.prev_wager_checkpoint = cu.curr_wager_checkpoint ?? cu.prev_wager_checkpoint;
            cu.curr_wager_checkpoint = total_wager;
            await cu.save();
            console.log({ total_points: user.total_points, wager, wagerPerPoint, points });
            await user.increment({ total_points: points });
        }
    }
    const cronTimeStamp = Date.now();
    console.log({ cronTimeStamp });
    setSettings({ cronTimeStamp });
    return;
}

let task;
const scheduleTask = async () => {
    const { resetMode, cronExpression } = settingsCache;
    const scheduled = resetMode == 'auto';
    console.log({ valid: cron.validate(cronExpression), resetMode, scheduled, cronExpression });
    task?.stop();
    task = (!scheduled || !cron.validate(cronExpression)) ? null : cron.schedule(cronExpression, resetLeaderboard, { timezone: 'ist', scheduled });
    task?.start();

}
scheduleTask();


app.post(ROUTES.RESET_LEADERBOARD, authenticate, async (req, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        await resetLeaderboard();
        return res.json({ message: 'Wages reset' });
    } catch (err) {
        return res.status(err.code).json({ err: err.toString() });
    }
});
*/
app.post(ROUTES.SETTINGS, authenticate, async ({ body: settingsObj }, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        const { cronExpression, resetMode } = settingsObj;
        const toRescheduleTask = cronExpression != settingsCache.cronExpression || resetMode != settingsCache.resetMode;
        const settingsList = await setSettings(settingsObj);
        if (toRescheduleTask) await scheduleTask();

        return res.json({ message: 'Settings changed', ...settingsList });
    } catch (err) {
        return res.status(err.code).json({ err: err.toString() });
    }
});
app.get(ROUTES.SETTINGS, authenticate, async (req, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        return res.json(settingsCache);
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});
/*
app.post(ROUTES.SHOP, authenticate, async (req, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        const [item] = await setShopItem(req.body);
        return res.json({ message: 'Added shop items', item });

    } catch (err) {
        return res.json({ err: err.toString() });
    }
});
app.delete(ROUTES.SHOP, authenticate, async (req, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        console.log(req.body);

        const item = await deleteShopItem(req.body.item_id);
        return res.json({ message: 'Deleted shop item', item });

    } catch (err) {
        return res.json({ err: err.toString() });
    }
});
app.get(ROUTES.SHOP, async (req, res) => {
    try {
        const items = getShopItems();
        return res.json({
            message: 'fetched shop items', items: items.map(i => i.dataValues),
            casinoWallets: Object.keys(casinos).filter(casinoId => casinos[casinoId].sendBalance != null
                && casinos[casinoId].leaderboard.some(({ casino_user_id }) => getByCasinoUserId(casino_user_id) != null) // dont show wallet for user's not using ref code
            )
        });

    } catch (err) {
        return res.json({ err: err.toString() });
    }
});
*/
app.get(ROUTES.LOGIN, async (req, res) => res.redirect(DISCORD_OAUTH2_URL));
app.get(CLIENT_ROUTES, async (req, res) => {
    return res.sendFile(path.join(VITE_PATH, 'index.html'));
});
app.get('*', (req, res) => res.redirect(ROUTES.HOME));

const server = https.createServer({ key: readFileSync('./certs/key.pem'), cert: readFileSync('./certs/cert.pem') }, app)
server.listen(PORT);