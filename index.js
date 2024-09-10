
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
import { casinos, users, users_casinos } from './utils/db.js';
dotenv.config();
const { PORT, DB_URL, TOKEN, JWT_SECRET, API_KEY_500,
    DISCORD_ROLE_ID, DISCORD_OAUTH2_URL, DISCORD_CLIENT_SECRET, DISCORD_GUILD_ID } = process.env;

const app = express();


const DISCORD_API = 'https://discord.com/api';
const _500_API_URL = "https://500.casino/api/rewards/affiliate-users";
const _500_SEND_BALANCE = 'https://tradingapi.500.casino/api/v1/user/balance/send'
const CLIENT_ROUTES = [
    ROUTES.HOME,
    ROUTES.CASINOS_PAGE,
];

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

app.get(ROUTES.CASINOS, authenticate, async (req, res) => {

    try {
        const user_casino = await users_casinos.findAll({ where: { user_id: res.locals.member.id } });
        return res.json({ user_casino });
    } catch (err) {
        return res.json({ err });
    }
}

);

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

app.post(ROUTES.CASINOS, authenticate, async ({ body: { casino_id, casino_username } }, res) => {


    try {

        const casino = await casinos.findOne({ where: { id: casino_id } });
        if (!casino) return res.json({ 'msg': 'Invalid casino' });


        const [user_casino] = await users_casinos.upsert({ user_id: res.locals.member.id, casino_id, casino_username });

        return res.json({ user_casino });
    } catch (err) {
        return res.json({ err });
    }
});

const sendBalance = async (destinationUserId, value, balanceType) => await axios.post(_500_SEND_BALANCE, {
    destinationUserId, value, balanceType
}, {
    headers: { 'x-500-auth': API_KEY_500 },
}).catch(err => err.response);


app.get(ROUTES.REDEEM, authenticate, async (req, res) => {
    try {
        const user = await users.findOne({ where: { id: res.locals.member.id } });
        if (user.points <= 0) throw new ErrorCode(403, 'Insufficient points');
        const { casino_username } = await users_casinos.findOne({ where: { user_id: res.locals.member.id, casino_id: '500casino' } });
        console.log({ casino_username, points: user.points });
        const r = await tip(casino_username, Math.min(100, user.points || 1), 'usdt');
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
        const members = (await bot.fetchVerifiedMembers()).map(m => m.id);
        const casino_usernames = await users_casinos.findAll({ where: { user_id: { [Op.in]: members } } });
        return res.json({ casino_usernames });
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});



const casinoUsernameFiltered = async (casino_id, casino_user_ids) => {
    try {
        const members = (await bot.fetchVerifiedMembers()).map(m => m.id);
        return (await users_casinos.findAll(
            { where: { casino_id, user_id: { [Op.in]: members }, casino_username: { [Op.in]: casino_user_ids } } }
        )
        );
    } catch (err) {
        console.log({ err: err.toString() });

        return [];
    }
}


const fetchLeaderboard500Casinos = async () => await axios.post(_500_API_URL,
    { sorting: { totalPlayed: -1 } },
    { headers: { 'x-500-auth': API_KEY_500 } });

app.get(ROUTES._500CASINOS, async (req, res) => {
    try {
        const r = await fetchLeaderboard500Casinos();

        let { results } = r.data;
        const casino_user_ids = results.map(r => r._id);
        const filtered = await casinoUsernameFiltered('500casino', casino_user_ids);

        results = results.map(r => {
            const { user_id, curr_wager_checkpoint, prev_wager_checkpoint } = filtered.find(f => f.casino_username == r._id);
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
        const r = await leaderboard500CasinosApi();
        await r.data.results.forEach(async r => {
            await users_casinos.findOne({ where: { casino_username: r._id }, })
                .then(async uc => {
                    uc.prev_wager_checkpoint = uc.curr_wager_checkpoint;
                    uc.curr_wager_checkpoint = r.totalPlayed;

                    await uc.save();
                    await users.increment({ points: Math.max(0, uc.curr_wager_checkpoint - (uc.prev_wager_checkpoint ?? uc.curr_wager_checkpoint)) }, { where: { id: uc.user_id } });


                })
        }
        )
        return res.json({ message: 'updated wage' });
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

app.get(ROUTES.LOGIN, async (req, res) => res.redirect(DISCORD_OAUTH2_URL));
app.get(CLIENT_ROUTES, (req, res) => res.sendFile(path.join(frontend_path, 'index.html')));
app.get('*', (req, res) => res.redirect(ROUTES.HOME));


const { port } = app.listen(PORT).address();
console.info(`\n\nRunning on\nhttp://localhost:${port}`);
