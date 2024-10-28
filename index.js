
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
    casinoUsers, createWithdrawal, deleteCasinoUser,
    getByCasinoUserId, getCasinoUser,
    getWithdrawals,
    setCasinoUser, setSettings,
    settingsCache, setUser, updateWithdrawal, usersCache, withdrawalsCache
} from './utils/db.js';
import cron from 'node-cron';
import { balances, casinos, refreshLeaderboardData } from './utils/casinos.js';
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
const errorHandlerBuilder = fn => async (req, res, next) => {
    try { return await fn(req, res, next) }
    catch (err) { return res.json({ err: err.toString() }); }
}

const authenticateAdmin = errorHandlerBuilder(async (req, res, next) => {
    if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
    next();
})

const authenticate = errorHandlerBuilder(async (req, res, next) => {
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
});

const { redirect_uri, client_id } = Object.fromEntries(new URL(DISCORD_OAUTH2_URL).searchParams);
const REDIRECT = new URL(redirect_uri).pathname;
app.get(REDIRECT, errorHandlerBuilder(async ({ query: { code } }, res) => {

    if (!code) throw new ErrorCode(500, 'No auth code found');
    const params = new URLSearchParams({
        client_id, redirect_uri, code, client_secret: DISCORD_CLIENT_SECRET, grant_type: 'authorization_code',
    });
    const { data: { access_token } } = await axios.post(`${DISCORD_API}/oauth2/token`, params,);
    const { data: { id, username, discriminator } } = await axios.get(`${DISCORD_API}/users/@me`, { headers: { 'Authorization': `Bearer ${access_token}`, } });
    await setUser({ id, username, discriminator });
    return res.cookie('token', jwt.sign(id, JWT_SECRET), { maxAge: 30 * 24 * 60 * 60 * 1000 }).redirect(ROUTES.HOME);

}));
const memberToUser = (member) => {
    const { username, discriminator, globalName, id: userId } = member.user;
    const { displayAvatarURL, nickname, isAdmin } = member.toJSON();

    return { isAdmin, username, discriminator, globalName, nickname, displayAvatarURL, userId, casinoUserIds:
        Object.keys(casinos).reduce((obj, casino_id)=>{obj[casino_id]=getCasinoUser({user_id:userId,casino_id}) ; return obj;},{})
     };
}
app.get(ROUTES.ME, authenticate, errorHandlerBuilder(async (req, res) => res.json(memberToUser(res.locals.member))));

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
            c.reward = round(c.revenue * parseFloat(settingsCache.revenueSharePercent));

            c.user_id = c.casino_user?.user_id;


            c.user = userIds.includes(c.user_id) ? usersCache[c.user_id] : null;
            if (casinoIds.length > 1) {
                if (leaderboards.total[c.user_id]) {
                    leaderboards.total[c.user_id].revenue += c.revenue;
                    leaderboards.total[c.user_id].reward += c.reward;
                }
                else if (c.user_id) {
                    const { revenue, reward, user, user_id } = c;
                    leaderboards.total[c.user_id] = { revenue, reward, user, user_id }

                }
            }
        }
        leaderboards.casinos[casino_id].leaderboard = casinoMembers.filter(cu => cu.casino_user != null && cu.user != null).toSorted((a, b) => b.revenue - a.revenue)
    }
    return leaderboards;
}
app.get(ROUTES.CASINOS, errorHandlerBuilder(async ({ query: { casino_id } }, res) => {
    if (Object.keys(casinos).includes(casino_id))
        return res.json(getCasinoLeaderboards([casino_id]).casinos[casino_id]);
    return res.json({
        leaderboard: Object.values(getCasinoLeaderboards().total)
            .toSorted((a, b) => b.revenue - a.revenue)
    });
}));


app.post(ROUTES.CASINOS, authenticate, errorHandlerBuilder(async ({ body: { casino_id, casino_user_id } }, res) => {
    if (!casinos[casino_id]) throw new ErrorCode(403, 'Invalid casino');
    if (getByCasinoUserId(casino_user_id)) throw new ErrorCode(403, 'Casino ID already linked');
    const user_casino = await setCasinoUser({ user_id: res.locals.member.id, casino_id, casino_user_id });

    return res.json({user_casino,
            leaderboard:getCasinoLeaderboards([casino_id]).casinos[casino_id]
        });
}));
const round = val => Math.floor(parseFloat(val) * 100) / 100;
const transaction = async ({ user_id, casinoId, amount, balanceType }) => {
    amount = round(amount);
    if (amount > 100) throw new ErrorCode(400, 'Redeem amount must not be more than 100');
    if (amount < 0.01) throw new ErrorCode(400, 'Redeem amount must be atleast 0.01');
    const { casino_id, total_reward, casino_user_id } = getCasinoUser({ user_id, casino_id: casinoId });

    if (total_reward < amount) throw new ErrorCode(400, 'Insufficient funds');
    
    const w = await createWithdrawal({ casino_id: casinoId, casino_user_id, user_id, amount, balance: total_reward - amount, balance_type: balanceType });
    
    if (w) {
        await setCasinoUser({ casino_id, user_id, total_reward: total_reward - amount });
     }
     
    return w;
}

const handleWithdrawal = async ({ id, user_id, casino_id, casino_user_id, balance_type, amount }, approve) => {
    amount = parseFloat(amount);
    approve = approve && casinos[casino_id].data.allowWithdraw;
    if (approve) {
        const { success } = await casinos[casino_id].sendBalance(casino_user_id, amount, balance_type);
        approve = success
    }
    if (!approve) {
        const { total_reward } = getCasinoUser({ casino_id, user_id });
        await setCasinoUser({ casino_id, user_id, total_reward: total_reward + amount });
      }
    return await updateWithdrawal({
        id,
        status: approve == null ? 'pending' : approve ? 'approved' : 'rejected'
    })
   

}
const approveWithdrawals = async () => {
    for await (let w of Object.values(withdrawalsCache)) {
        if (w.status == 'pending') await handleWithdrawal(w,
            false // TODO: make approve=true  
        );
    }
}
app.get(ROUTES.WITHDRAWALS, [authenticate, authenticateAdmin], errorHandlerBuilder(async (req, res) => res.json(
    {transactions: getWithdrawals(), balances:balances()}
)));
app.post(ROUTES.WITHDRAWALS, [authenticate, authenticateAdmin], errorHandlerBuilder(async ({ body: { wid, approve } }, res) => {
    if (!withdrawalsCache[wid]) throw new ErrorCode(400, 'Transaction not found');
    if (['approved', 'rejected'].includes(withdrawalsCache[wid]?.status)) throw new ErrorCode(400, 'Transaction found to be ' + withdrawalsCache[wid]?.status);
    if (approve == null) throw new ErrorCode(400, 'Specify approval true/false');
    await handleWithdrawal(withdrawalsCache[wid], approve);
    return res.json(
        {transactions: getWithdrawals(), balances:balances()});
}));

app.post(ROUTES.CLAIM_REWARD, authenticate, errorHandlerBuilder(async (req, res) => res.json(await transaction({ ...req.body, user_id: res.locals.member.id, }))));

let withdrawTask;
const scheduleWithdrawTask = async () => {
    const { withdrawApprovalMode, withdrawCronExpression } = settingsCache;
    const scheduled = withdrawApprovalMode == 'auto';
    console.log({ valid: cron.validate(withdrawCronExpression), withdrawApprovalMode, scheduled, withdrawCronExpression });
    withdrawTask?.stop();
    withdrawTask = (!scheduled || !cron.validate(withdrawCronExpression)) ? null : cron.schedule(withdrawCronExpression, approveWithdrawals, { timezone: 'ist', scheduled });
    withdrawTask?.start();
}
scheduleWithdrawTask();


app.get(ROUTES.MEMBERS, [authenticate, authenticateAdmin], errorHandlerBuilder((req, res) => res.json(casinoUsers())));
app.post(ROUTES.MEMBERS, [authenticate, authenticateAdmin], errorHandlerBuilder(async ({ body: { user_id, casino_id, casino_user_id,
    curr_revenue_checkpoint, prev_revenue_checkpoint, total_reward } }, res) => {
    const casinoUser = await setCasinoUser({
        user_id, casino_user_id, casino_id,
        curr_revenue_checkpoint, prev_revenue_checkpoint, total_reward
    });
    return res.json(casinoUsers());
}));
app.delete(ROUTES.MEMBERS, [authenticate, authenticateAdmin], errorHandlerBuilder(
    async ({ body: { user_id, casino_id } }, res) => res.json(
        await deleteCasinoUser({ user_id, casino_id }).then(()=>casinoUsers())
    )

));

const refreshRevenue = async () => {
    await refreshLeaderboardData();
    for await (let casinoData of Object.values(getCasinoLeaderboards().casinos)) {
        for await (let { total_revenue,  reward, casino_user: { casino_id, total_reward, user_id, curr_revenue_checkpoint, prev_revenue_checkpoint } } of casinoData.leaderboard) {
            await setCasinoUser({
                casino_id, user_id,
                prev_revenue_checkpoint: curr_revenue_checkpoint ?? prev_revenue_checkpoint,
                curr_revenue_checkpoint: total_revenue,
                total_reward: total_reward + reward
            })
        }
    }
    const cronTimeStamp = Date.now();
    setSettings({ cronTimeStamp });
    return casinoUsers();
}


app.post(ROUTES.REFRESH_REVENUE, [authenticate, authenticateAdmin], errorHandlerBuilder(async (req, res) =>res.json(await refreshRevenue().then(()=>casinoUsers()) )));

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

app.post(ROUTES.SETTINGS, [authenticate, authenticateAdmin], errorHandlerBuilder(async ({ body: settingsObj }, res) => {
    const { cronExpression, resetMode, withdrawApprovalMode, withdrawCronExpression } = settingsObj;
    const toRescheduleTask = cronExpression != settingsCache.cronExpression || resetMode != settingsCache.resetMode;
    const toRescheduleWithdrawTask = withdrawCronExpression != settingsCache.withdrawCronExpression || withdrawApprovalMode != settingsCache.withdrawApprovalMode;
    const settingsList = await setSettings(settingsObj);
    if (toRescheduleTask) await scheduleTask();
    if (toRescheduleWithdrawTask) await scheduleWithdrawTask();
    return res.json(settingsCache);
}));
app.get(ROUTES.SETTINGS, [authenticate, authenticateAdmin], errorHandlerBuilder(async (req, res) => res.json(settingsCache)));

app.get(ROUTES.LOGIN, errorHandlerBuilder(async (req, res) => res.redirect(DISCORD_OAUTH2_URL)));
app.get(CLIENT_ROUTES, errorHandlerBuilder(async (req, res) => res.sendFile(path.join(VITE_PATH, 'index.html'))));
app.get('*', errorHandlerBuilder((req, res) => res.redirect(ROUTES.HOME)));

const server = https.createServer({ key: readFileSync('./certs/key.pem'), cert: readFileSync('./certs/cert.pem') }, app)
server.listen(PORT);