
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { INTEGER, Op, Sequelize, STRING, where } from 'sequelize';
import axios from 'axios';
import express, { json } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import ROUTES from './utils/routes.js';
import bot from './utils/discordBot.js';
import { casinos, getCasinosByUserIds, getUserById, getUsersCasino, users, users_casinos } from './utils/db.js';
dotenv.config();
const { PORT, DB_URL, TOKEN, JWT_SECRET, API_KEY_500,
    DISCORD_ROLE_ID, DISCORD_OAUTH2_URL, DISCORD_CLIENT_SECRET, DISCORD_GUILD_ID } = process.env;


const DISCORD_API = 'https://discord.com/api';
const _500_API_URL = "https://500.casino/api/rewards/affiliate-users";
const _500_SEND_BALANCE = 'https://tradingapi.500.casino/api/v1/user/balance/send'
const CLIENT_ROUTES = [
    ROUTES.HOME,
    ROUTES.CASINOS_PAGE,
];

const app = express();
const frontend_path = path.join(path.resolve(), 'dist');
app.use(express.static(frontend_path));

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

        const member = (await bot.fetchVerifiedMembers()).find(m => m.id == user_id)
        if (!member) throw new ErrorCode(403, 'Not a verified server member');

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
        await users.upsert({ id, username, discriminator });
        return res.cookie('token', jwt.sign(id, JWT_SECRET), { maxAge: 30 * 24 * 60 * 60 * 1000 }).redirect(ROUTES.HOME);
    } catch (err) {
        return res.json({ err: err.toString() });
    }
}

);
const getCasinoApiData = async () => {
    const r = await fetchLeaderboard500Casinos();
    return r.data.results.map(u => ({ casino_user_id: u._id, total_wager: u.totalPlayed }));
};

const getCasinoUsers = async () => {
    let casinoUsers = await getCasinoApiData(); // add discord verification
    for await (let c of casinoUsers) {
        c.casino_user = await users_casinos.findOne({ where: { casino_user_id: c.casino_user_id } });
        c.waged = c.total_wager - (c.casino_user?.curr_wager_checkpoint ?? c.total_wager);
        c.user = await getUserById(c.casino_user?.user_id ?? null);
    }
    return casinoUsers.filter(cu => cu.casino_user != null && cu.user != null);
}
app.get(ROUTES.CASINOS, async (req, res) => {
    try {
        // const user_casino = await getCasinosByUserIds([res.locals.member.id]);//get
        const casinoUsers = await getCasinoUsers();
        return res.json({ casinoUsers });
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

app.get(ROUTES.API, authenticate, async (req, res) => res.json({ active: true }));
const memberToUser = (member) => {
    const { username, discriminator, globalName } = member.user;
    const { displayAvatarURL, nickname } = member.toJSON();
    return { username, discriminator, globalName, nickname, displayAvatarURL };
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
        const casino = await casinos.findOne({ where: { id: casino_id } });
        if (!casino) return res.json({ 'msg': 'Invalid casino' });
        const user_casino = await users_casinos.upsert({ user_id: res.locals.member.id, casino_id, casino_user_id });
        return res.json(user_casino);
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

const sendBalance = async (destinationUserId, value, balanceType) => await axios.post(_500_SEND_BALANCE, {
    destinationUserId, value, balanceType
}, {
    headers: { 'x-500-auth': API_KEY_500 },
}).catch(err => err.response);

app.get(ROUTES.REDEEM, authenticate, async (req, res) => {
    try {
        const user = await getUserById(res.locals.member.id);

        if (user.points <= 0) throw new ErrorCode(403, 'Insufficient points');
        const { casino_user_id } = await users_casinos.findOne({ where: { user_id: res.locals.member.id, casino_id: '500casino' } });
        console.log({ casino_user_id, points: user.points });
        const r = await sendBalance(casino_user_id, Math.min(100, user.points || 1), 'usdt');
        if (r.data.success) {
            user.points = 0
            await user.save();
        }
        return res.json(r.data);
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

app.get(ROUTES.MEMBERS, async (req, res) => {
    try {
        const userIds = (await bot.fetchVerifiedMembers()).map(m => m.id);
        const casino_user_ids = await getCasinosByUserIds(userIds); //get
        return res.json({ casino_user_ids });
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

const getUsersCasinoVerified = async (casino_id, casino_user_ids) => {
    try {
        const userIds = (await bot.fetchVerifiedMembers()).map(m => m.id);
        return await getUsersCasino(
            // users_casinos.findAll(
            // { where: { 
            casino_id,
            // , user_id: { [Op.in]: 
            userIds,
            casino_user_ids,
            //  }, casino_username: { [Op.in]: 
            //  } } }

        );
    } catch (err) {
        console.log({ err: err.toString() });

        return [];
    }
}

const fetchLeaderboard500Casinos = async () => await axios.post(_500_API_URL,
    { sorting: { totalPlayed: -1 } }, { headers: { 'x-500-auth': API_KEY_500 } }
);

app.get(ROUTES._500CASINOS, async (req, res) => {
    try {
        const r = await fetchLeaderboard500Casinos();

        let { results } = r.data;
        const casino_user_ids = results.map(r => r._id);
        const filtered = await getUsersCasinoVerified('500casino', casino_user_ids);

        results = results.map(r => {
            const { user_id, curr_wager_checkpoint, prev_wager_checkpoint } = filtered.find(f => f.casino_user_id == r._id);
            return {
                waged: r.totalPlayed - (curr_wager_checkpoint ?? r.totalPlayed),
                ...r, user_id, prev_wager_checkpoint, curr_wager_checkpoint,
            };
        }).toSorted((a, b) => b.waged - a.waged);
        return res.json({ results });
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

app.get(ROUTES.RESET_LEADERBOARD, async (req, res) => {
    try {

        const casinoUsers = await getCasinoUsers();
        for await (let { total_wager, casino_user: cu, user } of casinoUsers) {
            cu.prev_wager_checkpoint = cu.curr_wager_checkpoint??cu.prev_wager_checkpoint;
            cu.curr_wager_checkpoint = total_wager;
            await cu.save();
            await user.increment({ points: Math.max(0, cu.curr_wager_checkpoint - (cu.prev_wager_checkpoint ?? cu.curr_wager_checkpoint)) });
        }

        return res.json({ message: 'Wages reset' });
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

app.get(ROUTES.LOGIN, async (req, res) => res.redirect(DISCORD_OAUTH2_URL));
app.get(CLIENT_ROUTES, (req, res) => res.sendFile(path.join(frontend_path, 'index.html')));
app.get('*', (req, res) => res.redirect(ROUTES.HOME));

const { port } = app.listen(PORT).address();
console.info(`\n\nRunning on\nhttp://localhost:${port}`);