
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
    createWithdrawal, deleteCasinoUser,
    getByCasinoUserId, getCasinoUser,
    getWithdrawals,
    setCasinoUser, 
    setSettings, settingsCache,
    // setUser, usersCache,
    updateWithdrawal, 
    usersCasinosCache, 
    withdrawalsCache,
} from './utils/db.js';
import cron from 'node-cron';
import { getWithdrawableBalances, casinos, refreshLeaderboardData, initCasinos, validCasinoIds } from './utils/casinos.js';
import { PORT, JWT_SECRET, REDIRECT, REDIRECT_URI, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_OAUTH2_URL, timezone } from './config.js';

import { readFileSync } from 'fs';

// Init casinos data
await initCasinos();
await refreshLeaderboardData();
cron.schedule('* * * * *', refreshLeaderboardData);

const app = express();
const VITE_PATH = path.join(path.resolve(), 'dist');
app.use(express.static(VITE_PATH, { index: false }));

app.use(cors({
    credentials: true,
    origin: true,
}));
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
    catch (err) { return res.json({ err: err.message || err.toString() }); }
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

    const member = bot.verifiedMembers[user_id]
    if (!member) throw new ErrorCode(403, 'Not a verified server member');
    res.locals.member = member;
    await next();
});

const casinoUsers = () => Object.values(usersCasinosCache)
    .map(cu => ({ ...cu, ...bot.verifiedMembers[cu.user_id] })
);

app.get(REDIRECT, errorHandlerBuilder(async ({ query: { code } }, res) => {

    if (!code) throw new ErrorCode(500, 'No auth code found');
    const params = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID, redirect_uri: REDIRECT_URI, code, client_secret: DISCORD_CLIENT_SECRET, grant_type: 'authorization_code',
    });
    const { data: { access_token } } = await axios.post(`${DISCORD_API}/oauth2/token`, params,);
    const { data: { id: user_id, username, discriminator } } = await axios.get(`${DISCORD_API}/users/@me`, { headers: { 'Authorization': `Bearer ${access_token}`, } });
    // await setUser({ user_id, username, discriminator });
    return res.cookie('token', jwt.sign(user_id, JWT_SECRET), { maxAge: 30 * 24 * 60 * 60 * 1000 }).redirect(ROUTES.HOME);

}));

app.get(ROUTES.ME, authenticate, errorHandlerBuilder(async (req, res) => res.json(
    {
        ...res.locals.member,
        casinoUserIds:
            validCasinoIds.reduce((obj, casino_id) => { 
                obj[casino_id] = getCasinoUser({ user_id: res.locals.member.userId, casino_id }); 
            return obj; 
        }, {})
    }
)));

const calcRevenue = (total, checkpoint) => Math.max(0, total - (checkpoint ?? total))
const getCasinoLeaderboards = (casinoIds = validCasinoIds) => {
    let leaderboards = { 'casinos': {}, total: {} };
    const userIds = Object.keys(bot.verifiedMembers);
    for (const casino_id of casinoIds) {
        const casinoObject = JSON.parse(JSON.stringify(casinos[casino_id]));
        leaderboards.casinos[casino_id] = casinoObject.data;
        let casinoMembers = casinoObject.leaderboard;
        for (let c = 0; c < casinoMembers.length; c++) {
            casinoMembers[c] = { ...casinoMembers[c], ...getByCasinoUserId(casinoMembers[c].casino_user_id) };

            if (userIds.includes(casinoMembers[c].user_id)) 
                casinoMembers[c] = {...casinoMembers[c], ...bot.verifiedMembers[casinoMembers[c].user_id]};

            let cu = casinoMembers[c];
            cu.revenue = calcRevenue(cu.total_revenue, cu?.curr_revenue_checkpoint)
            cu.wager = calcRevenue(cu.total_wager, cu?.curr_wager_checkpoint)
            cu.reward = round(cu.revenue * parseFloat(settingsCache.revenueSharePercent));


            if (casinoIds.length > 1) {
                if (leaderboards.total[cu.user_id]) {
                    leaderboards.total[cu.user_id].revenue += cu.revenue;
                    leaderboards.total[cu.user_id].wager += cu.wager;
                    leaderboards.total[cu.user_id].reward += cu.reward;
                }
                else if (cu.user_id) {
                    const { revenue, wager, reward, user_id, username, discriminator, displayAvatarURL } = cu;

                    leaderboards.total[cu.user_id] = { revenue, wager, reward, user_id, username, discriminator, displayAvatarURL }

                }
            }
        }
        leaderboards.casinos[casino_id].leaderboard = casinoMembers.filter(cu => userIds.includes(cu.user_id)).toSorted((a, b) => b.wager - a.wager) 
        // why filter? because casino referred users are not in bot.verifiedMembers
        leaderboards.casinos[casino_id].leaderboard.forEach((cu, i) => cu.rank = i + 1);
    }
    leaderboards.total = {leaderboard:Object.values(leaderboards.total).toSorted((a, b) => b.wager - a.wager)}
    leaderboards.total.leaderboard.forEach((cu, i) => cu.rank = i + 1);
    return leaderboards;
}
app.get(ROUTES.CASINOS, errorHandlerBuilder(async ({ query: { casino_id } }, res) => {
    if (validCasinoIds.includes(casino_id))
        return res.json(getCasinoLeaderboards([casino_id]));
    return res.json(getCasinoLeaderboards());
}));


app.post(ROUTES.CASINOS, authenticate, errorHandlerBuilder(async ({ body: { casino_id, casino_user_id } }, res) => {
    if (!casinos[casino_id]) throw new ErrorCode(403, `Invalid casino ${casino_id}`);
    if (getByCasinoUserId(casino_user_id)) throw new ErrorCode(403, 'Casino ID already linked');
    const user_casino = await setCasinoUser({ user_id: res.locals.member.userId, casino_id, casino_user_id });

    return res.json({
        user_casino,
        leaderboard: getCasinoLeaderboards([casino_id]).casinos[casino_id]
    });
}));
const round = val => Math.floor(parseFloat(val) * 100) / 100;
const transaction = async ({ user_id, casino_id, amount }) => {
    amount = round(amount);
    if (isNaN(amount)) throw new ErrorCode(400, 'Redeem amount invalid');
    if (amount > 100) throw new ErrorCode(400, 'Redeem amount must not be more than 100');
    if (amount < 0.01) throw new ErrorCode(400, 'Redeem amount must be atleast 0.01');
    const { total_reward, casino_user_id } = getCasinoUser({ user_id, casino_id });

    if (total_reward < amount) throw new ErrorCode(400, 'Insufficient funds');

    const w = await createWithdrawal({ casino_id, casino_user_id, user_id, amount, balance: total_reward - amount, });

    if (w) {
        await setCasinoUser({ casino_id, user_id, total_reward: total_reward - amount });
    }

    return w;
}

const handleWithdrawal = async ({ wid, user_id, casino_id, casino_user_id, amount }, approve) => {
    amount = parseFloat(amount);
    approve = approve && casinos[casino_id].data.allowWithdraw;
    if (approve) {
        const { success } = await casinos[casino_id].sendBalance(casino_user_id, amount);
        approve = success
    }
    if (!approve) {
        const { total_reward } = getCasinoUser({ casino_id, user_id });
        await setCasinoUser({ casino_id, user_id, total_reward: total_reward + amount });
    }
    return await updateWithdrawal({
        wid,
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
    { transactions: getWithdrawals(), balances: getWithdrawableBalances() }
)));
app.post(ROUTES.WITHDRAWALS, [authenticate, authenticateAdmin], errorHandlerBuilder(async ({ body: { wid, approve } }, res) => {
    if (!withdrawalsCache[wid]) throw new ErrorCode(400, 'Transaction not found');
    if (['approved', 'rejected'].includes(withdrawalsCache[wid]?.status)) throw new ErrorCode(400, 'Transaction found to be ' + withdrawalsCache[wid]?.status);
    if (approve == null) throw new ErrorCode(400, 'Specify approval true/false');
    await handleWithdrawal(withdrawalsCache[wid], approve);
    return res.json(
        { transactions: getWithdrawals(), balances: getWithdrawableBalances() });
}));

app.post(ROUTES.CLAIM_REWARD, authenticate, errorHandlerBuilder(async (req, res) => res.json(await transaction({ ...req.body, user_id: res.locals.member.userId, }))));

let withdrawTask;
const scheduleWithdrawTask = async () => {
    const { withdrawApprovalMode, withdrawCronExpression } = settingsCache;
    const scheduled = withdrawApprovalMode == 'auto';
    console.log({ valid: cron.validate(withdrawCronExpression), withdrawApprovalMode, scheduled, withdrawCronExpression });
    withdrawTask?.stop();
    withdrawTask = (!scheduled || !cron.validate(withdrawCronExpression)) ? null : cron.schedule(withdrawCronExpression, approveWithdrawals, { timezone, scheduled });
    withdrawTask?.start();
}
scheduleWithdrawTask();


app.get(ROUTES.MEMBERS, [authenticate, authenticateAdmin], errorHandlerBuilder((req, res) => res.json(casinoUsers())));
app.post(ROUTES.MEMBERS, [authenticate, authenticateAdmin], errorHandlerBuilder(async ({ body: cu }, res) => {
    const casinoUser = await setCasinoUser(cu);
    return res.json(casinoUsers());
}));
app.delete(ROUTES.MEMBERS, [authenticate, authenticateAdmin], errorHandlerBuilder(
    async ({ body: { user_id, casino_id } }, res) => res.json(
        await deleteCasinoUser({ user_id, casino_id }).then(() => casinoUsers())
    )

));

const refreshRevenue = async () => {
    await refreshLeaderboardData();
    for await (let casinoData of Object.values(getCasinoLeaderboards().casinos)) {
        for await (let { total_revenue, total_wager, reward, casino_id, total_reward, user_id, curr_revenue_checkpoint, prev_revenue_checkpoint, curr_wager_checkpoint, prev_wager_checkpoint } of casinoData.leaderboard) {
            await setCasinoUser({
                casino_id, user_id,
                prev_revenue_checkpoint: curr_revenue_checkpoint ?? prev_revenue_checkpoint,
                curr_revenue_checkpoint: total_revenue,

                prev_wager_checkpoint: curr_wager_checkpoint ?? prev_wager_checkpoint,
                curr_wager_checkpoint: total_wager,

                total_reward: total_reward + reward
            })
        }
    }
    const cronTimeStamp = Date.now();
    setSettings({ cronTimeStamp });
}


app.post(ROUTES.REFRESH_REVENUE, [authenticate, authenticateAdmin], errorHandlerBuilder(async (req, res) => res.json(await refreshRevenue().then(casinoUsers)))); 

let task;
const scheduleTask = async () => {
    const { resetMode, cronExpression } = settingsCache;
    const scheduled = resetMode == 'auto';
    console.log({ valid: cron.validate(cronExpression), resetMode, scheduled, cronExpression });
    task?.stop();
    task = (!scheduled || !cron.validate(cronExpression)) ? null : cron.schedule(cronExpression, refreshRevenue, { timezone, scheduled });
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
console.log(server.listen(PORT).address());