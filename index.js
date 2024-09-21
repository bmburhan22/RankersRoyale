
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import express, { json } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import {ROUTES, CLIENT_ROUTES, DISCORD_API} from './utils/routes.js';
import bot from './utils/discordBot.js';
import {  casinoUsers, deleteCasinoUser, deleteShopItem, getByCasinoUserId, getCasinoUser,  
    getSettingsNum, getShopItems, setCasinoUser, setSettings, setShopItem, settingsCache, setUser,  shopItemsCache,  usersCache} from './utils/db.js';
import { Op } from 'sequelize';
import cron from 'node-cron';
import casinos from './utils/casinos.js';
import * as cheerio from 'cheerio';
import fs from 'fs'
dotenv.config();
const { PORT, JWT_SECRET,  DISCORD_ADMIN_ROLE_ID, DISCORD_OAUTH2_URL, DISCORD_CLIENT_SECRET } = process.env;



const app = express();
const VITE_PATH = path.join(path.resolve(), 'dist');
app.use(express.static(VITE_PATH, {index:false}));

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
        console.log({ err });
        return res.status(err.code).json({ err: err.toString() });
    }
};

const { redirect_uri, client_id } = Object.fromEntries(new URL(DISCORD_OAUTH2_URL).searchParams);
const REDIRECT = new URL(redirect_uri).pathname;
app.get(REDIRECT, async ({ query: { code } }, res) => {
    try {
        if (!code) throw ErrorCode(500, 'No auth code found');
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
const calcWager = (total_wager, wager_checkpoint)=>Math.max(0, total_wager - (wager_checkpoint ?? total_wager))
let casinoLeaderboards = {'casinos':{},total:{}};
const getCasinoLeaderboards = async () => {
    console.log('updating leaderboard')
    let leaderboards = { ts: new Date(Date.now()).toLocaleString(),'casinos': {}, total: {} };
    const userIds = bot.verifiedMembers.map(m => m.id); 

    const wagerPerPoint=getSettingsNum('wagerPerPoint');
    for await (let casino_id of Object.keys(casinos)) {
        leaderboards.casinos[casino_id] = casinos[casino_id].initData;
        let casinoMembers = await casinos[casino_id].getLeaderboard(); 
        
        // const users_casinos_records = await users_casinos.findAll({
        //     where: {
        //         casino_id,
        //         casino_user_id: {[Op.in]:casinoUsers.map(cu=>cu.casino_user_id)},
        //         user_id: { [Op.in]: userIds } // filter by user_id in discord verified userIds 
        //     }
        // });
        for await (let c of casinoMembers) {
            c.casino_user =getByCasinoUserId(c.casino_user_id);//users_casinos_records.find(uc=>uc.casino_user_id==c.casino_user_id)
            c.wager = calcWager(c.total_wager,c.casino_user?.curr_wager_checkpoint)
            c.points = c.wager/wagerPerPoint;
            c.user_id = c.casino_user?.user_id;
            c.user = userIds.includes(c.user_id) ? usersCache[c.user_id]:null;

            if (leaderboards.total[c.user_id]) {
                leaderboards.total[c.user_id].wager += c.wager;
                leaderboards.total[c.user_id].points += c.points;
                leaderboards.total[c.user_id].total_wager += c.total_wager;
            }
            else if (c.user_id) leaderboards.total[c.user_id] = { ...c }
        }
        leaderboards.casinos[casino_id].leaderboard = casinoMembers.filter(cu => cu.casino_user != null && cu.user != null).toSorted((a, b) => b.wager - a.wager)
    }
    casinoLeaderboards = leaderboards;
}
getCasinoLeaderboards();
cron.schedule('*/10 * * * * *', getCasinoLeaderboards);

// const getCasinoUsers = async (casinoIds = Object.keys(casinos)) => {
//     let casinoData = { 'casinos': {}, total: {} };
//     const userIds = bot.verifiedMembers.map(m => m.id); // discord verified userIds 

//     for await (let casinoId of casinoIds) {
//         casinoData['casinos'][casinoId] = casinos[casinoId].initData;
//         let casinoUsers = await casinos[casinoId].getLeaderboard(); // add discord verification
//         console.log({ casinoUsers });

//         for await (let c of casinoUsers) {
//             c.casino_user = await users_casinos.findOne({
//                 where: {
//                     casino_user_id: c.casino_user_id,
//                     user_id: { [Op.in]: userIds } // filter by user_id in discord verified userIds 
//                 }
//             });

//             c.wager = Math.max(0, c.total_wager - (c.casino_user?.curr_wager_checkpoint ?? c.total_wager));
//             c.wagerPerPoint = await getSettingsNum('wagerPerPoint');
//             c.points = c.wager / c.wagerPerPoint;
//             c.user_id = c.casino_user?.user_id;
//             c.user = await getUserById(c.casino_user?.user_id ?? null);

//             if (casinoData.total[c.user_id]) {
//                 casinoData.total[c.user_id].wager += c.wager;
//                 casinoData.total[c.user_id].points += c.points;
//                 casinoData.total[c.user_id].total_wager += c.total_wager;
//             }
//             else if (c.user_id) casinoData.total[c.user_id] = { ...c }
//         }
//         casinoData['casinos'][casinoId].leaderboard = casinoUsers.filter(cu => cu.casino_user != null && cu.user != null).toSorted((a, b) => b.wager - a.wager)
//     }
//     return casinoData;
// }
app.get(ROUTES.CASINOS, async (req, res) => {
    try {
        return res.json(casinoLeaderboards);
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
        // const casino = await casinos.findOne({ where: { id: casino_id } });
        if (!casinos[casino_id]) return res.json({ 'msg': 'Invalid casino' });
        const user_casino = await setCasinoUser({ user_id: res.locals.member.id, casino_id, casino_user_id });
        return res.json(user_casino);
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});
const round = val => Math.floor(parseFloat(val) * 100) / 100;
const transaction = async ({ user_id, casinoId, amount, price, balanceType }) => {
    console.log({ amount, price, rounded: round(amount) });
    amount = round(amount);
    price = round(price);

    const user = usersCache[user_id];
    if (amount > 100) throw new ErrorCode(400, 'Redeem amount must not be more than 100');
    if (amount < 0.01) throw new ErrorCode(400, 'Redeem amount must be atleast 0.01');
    // const points = amount* await getSettingsNum('pointsPerDollar');
    if (user.total_points <= price) throw new ErrorCode(400, 'Insufficient points');
    const { casino_user_id } = getCasinoUser({ user_id, casino_id: casinoId } );
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
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        const price = parseFloat(req.body.amount) * await getSettingsNum('pointsPerDollar');
        const r = await transaction({  ...req.body , price, user_id: res.locals.member.id, });
        return res.json(r);
    } catch (err) {
        return res//.status(err.code)
            .json({ code: err.code, err: err.toString() });
    }
});
const random = (min, max) => Math.random() * (max - min) + min;

app.post(ROUTES.BUY, authenticate, async ({ body: { item_id, balanceType, casinoId } }, res) => {
    try {
        // if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        const { minAmount, maxAmount, price } =  shopItemsCache[item_id];
        if (!(minAmount && maxAmount && price)) throw new ErrorCode(403, 'Item not found');
        const amount = random(minAmount, maxAmount);
        console.log({ item_id, price, amount, minAmount, maxAmount });

        const r = await transaction({ balanceType, casinoId, amount, price, user_id: res.locals.member.id, });
        return res.json(r);
    } catch (err) {
        return res.json({ code: err.code, err: err.toString() });
    }
});

app.get(ROUTES.MEMBERS, async (req, res) => {
    try {
        // const casinoUsers = await users_casinos.findAll();
        return res.json(casinoUsers().map(cu => ({ ...cu.dataValues, ...usersCache[cu.user_id]?.dataValues })));
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});
app.post(ROUTES.MEMBERS, async ({ body: { user_id, total_points, casino_id, casino_user_id, curr_wager_checkpoint, prev_wager_checkpoint } }, res) => {
    try {
        const [casinoUser] = await setCasinoUser({ user_id, casino_user_id, casino_id, curr_wager_checkpoint, prev_wager_checkpoint });
        const [usersData] = await setUser({id:  user_id, total_points });
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

const resetLeaderboard = async () => {
    await getCasinoLeaderboards();
    for await (let casinoData of Object.values(casinoLeaderboards.casinos)) {
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
    await getCasinoLeaderboards();
    return;
}

app.post(ROUTES.RESET_LEADERBOARD, authenticate, async (req, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        await resetLeaderboard();
        return res.json({ message: 'Wages reset' });
    } catch (err) {
        return res.status(err.code).json({ err: err.toString() });
    }
});
app.post(ROUTES.SETTINGS, authenticate, async ({ body: { resetMode, cronExpression, ...settingsObj } }, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        const settingsList = await setSettings(settingsObj);
        return res.json({ message: 'Settings changed', ...settingsList });
    } catch (err) {
        return res.status(err.code).json({ err: err.toString() });
    }
});
app.post(ROUTES.CRON, authenticate, async ({ body: { cronExpression, resetMode } }, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        const settingsList = await setSettings({ cronExpression, resetMode });
        await scheduleTask();
        return res.json({ message: 'Settings changed', ...settingsList });
    } catch (err) {
        return res.status(err.code).json({ err: err.toString() });
    }
});
app.get(ROUTES.SETTINGS, authenticate, async (req, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        return res.json(
            await getSettings()
        );
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

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
app.get(ROUTES.SHOP,  async (req, res) => {
    try {
        const items = getShopItems();
        return res.json({ message: 'fetched shop items', items:items.map(i=>i.dataValues), casinoWallets: Object.keys(casinos).filter(casinoId => casinos[casinoId].sendBalance != null) });

    } catch (err) {
        return res.json({ err: err.toString() });
    }
});
app.get(ROUTES.LOGIN, async (req, res) => res.redirect(DISCORD_OAUTH2_URL));

const getHTML = async (req,res) => {
return     res.sendFile(path.join(VITE_PATH, 'index.html'));
}

app.get(CLIENT_ROUTES, getHTML);
app.get('*', (req, res) => res.redirect(ROUTES.HOME));

const { port } = app.listen(PORT).address();
console.info(`\n\nRunning on\nhttp://localhost:${port}`);
