
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import express, { json } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import ROUTES from './utils/routes.js';
import bot from './utils/discordBot.js';
import { casinos, getCasinosByUserIds, getSettings, getSettingsNum, getUserById, setSettings, users, users_casinos } from './utils/db.js';
import { Op } from 'sequelize';
dotenv.config();
const { PORT, JWT_SECRET, API_KEY_500,DISCORD_ADMIN_ROLE_ID, DISCORD_OAUTH2_URL, DISCORD_CLIENT_SECRET } = process.env;

const DISCORD_API = 'https://discord.com/api';
const CLIENT_ROUTES = [
    ROUTES.HOME,
    ROUTES.CASINOS_PAGE,
    ROUTES.ADMIN_HOME,
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

const CASINO_OPS = {
    '500casino': await (new class _500casino {
        init = async () => await axios.get('https://500.casino/api/boot', { headers: { 'x-500-auth': API_KEY_500 } }).then(({ data: { userData: { referralCode }, siteSettings } }) => {
            const { rate, inverseRate } = siteSettings.currencyRates.bux.usd;
            const referralLink = "https://500.casino/r/" + referralCode
            this.initData = { rate, inverseRate, referralCode, referralLink }
            return this;
        });
        getLeaderboard = async () => {
            const r = await axios.post("https://500.casino/api/rewards/affiliate-users",
                { sorting: { totalPlayed: -1 } }, { headers: { 'x-500-auth': API_KEY_500 } }
            );
            return r.data.results.map(u => ({ casino_user_id: u._id, total_wager: this.initData.rate * u.totalPlayed }));
        };
        sendBalance = async (destinationUserId, value, balanceType) => {
            console.log({ value, converted: value * this.initData.inverseRate });

            return await axios.post('https://tradingapi.500.casino/api/v1/user/balance/send',
                { destinationUserId, value: value * this.initData.inverseRate, balanceType }, { headers: { 'x-500-auth': API_KEY_500 }, })
                .catch(err => ({ ...err.response, success: false }))
                ;
        }
    }().init())
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
        member.isAdmin=member.roles.cache.has(DISCORD_ADMIN_ROLE_ID)
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
});

const getCasinoUsers = async (casinoIds = Object.keys(CASINO_OPS)) => {
    let casinoData = {  'casinos': {},total:{} };
    const userIds = (await bot.fetchVerifiedMembers()).map(m => m.id); // discord verified userIds 

    for await (let casinoId of casinoIds) {
        casinoData['casinos'][casinoId] = CASINO_OPS[casinoId].initData;
        let casinoUsers = await CASINO_OPS[casinoId].getLeaderboard(); // add discord verification
        for await (let c of casinoUsers) {
            c.casino_user = await users_casinos.findOne({
                where: {
                    casino_user_id: c.casino_user_id,
                    user_id: { [Op.in]: userIds } // filter by user_id in discord verified userIds 
                }
            });

            c.wager = Math.max(0, c.total_wager - (c.casino_user?.curr_wager_checkpoint ?? c.total_wager));
            c.wagerPerPoint = await getSettingsNum('wagerPerPoint');
            c.points = c.wager / c.wagerPerPoint;
            c.user_id = c.casino_user?.user_id;
            c.user = await getUserById(c.casino_user?.user_id ?? null);

            if (casinoData.total[c.user_id]) {
                casinoData.total[c.user_id].wager += c.wager;
                casinoData.total[c.user_id].points += c.points;
                casinoData.total[c.user_id].total_wager += c.total_wager;
            }
            else casinoData.total[c.user_id] = { ...c }
        }
        casinoData['casinos'][casinoId].leaderboard = casinoUsers.filter(cu => cu.casino_user != null && cu.user != null).toSorted((a, b) => b.wager - a.wager)
    }
    return casinoData;
}
app.get(ROUTES.CASINOS, async (req, res) => {
    try {
        const casinoUsers = await getCasinoUsers();
        console.log(casinoUsers);
        return res.json(casinoUsers );
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});


const memberToUser = (member) => {
    const { username, discriminator, globalName } = member.user;
    const { displayAvatarURL, nickname, isAdmin } = member.toJSON();
    return {isAdmin, username, discriminator, globalName, nickname, displayAvatarURL };
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

app.post(ROUTES.REDEEM, authenticate, async ({ body: { casinoId, amount, balanceType } }, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');

        amount = Math.floor(amount * 100) / 100;
        console.log({ amount });

        const user = await getUserById(res.locals.member.id);
        if (amount > 100) throw new ErrorCode(400, 'Redeem amount must not be more than 100');
        if (amount < 0.01) throw new ErrorCode(400, 'Redeem amount must be atleast 0.01');
        if (user.total_points <= amount) throw new ErrorCode(400, 'Insufficient points');
        const { casino_user_id } = await users_casinos.findOne({ where: { user_id: user.id, casino_id: casinoId } });
        console.log({ casino_user_id, total_points: user.total_points });
        const r = await CASINO_OPS[casinoId].sendBalance(casino_user_id, amount, balanceType);
        console.log({ success: r.data });
        if (r.data.success) {

            user.total_points -= amount;
            await user.save();
        }
        return res.json(r.data);
    } catch (err) {
        return res.status(err.code).json({ code: err.code, err: err.toString() });
    }
});

app.get(ROUTES.MEMBERS, async (req, res) => {
    try {
        // const userIds = (await bot.fetchVerifiedMembers()).map(m => m.id);
        // const casino_user_ids = await getCasinosByUserIds(userIds); //get
        const usersData = await users.findAll();
        const casinoUsers = await users_casinos.findAll();
        return res.json(casinoUsers.map(cu=>({ ...cu.dataValues, ...usersData.find(u=>u.id==cu.user_id )?.dataValues })));
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});
app.post(ROUTES.MEMBERS, async ({body:{user_id, total_points, casino_id, casino_user_id}}, res) => {
    try {
        const [casinoUser] = await users_casinos.upsert( {user_id, casino_user_id, casino_id}, {updateOnDuplicate:['user_id','casino_id']});
        const [usersData] = await users.upsert( {id:user_id,total_points}, {updateOnDuplicate:['id']});
        return res.json({...casinoUser.dataValues, ...usersData.dataValues});

    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

app.get('/api/setwager', authenticate, async ({ query: { casino_id, curr, prev } }, res) => {
    try {

        const cu = await users_casinos.findOne({ where: { casino_id, user_id: res.locals.member.id } })
        cu.prev_wager_checkpoint = prev;
        cu.curr_wager_checkpoint = curr;
        await cu.save();
        return res.json({ message: 'Wages set' });
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

app.get(ROUTES.RESET_LEADERBOARD,authenticate, async (req, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        const casinoData = await getCasinoUsers();
        
        for await (let casinoUsers of Object.values(casinoData.casinos)) {
            for await (let { total_wager, wager, wagerPerPoint, points, casino_user: cu, user } of casinoUsers.leaderboard) {
                cu.prev_wager_checkpoint = cu.curr_wager_checkpoint ?? cu.prev_wager_checkpoint;
                cu.curr_wager_checkpoint = total_wager;
                await cu.save();
                console.log({ total_points: user.total_points, wager, wagerPerPoint, points });

                await user.increment({ total_points: points });
            }
        }
        return res.json({ message: 'Wages reset' });
    } catch (err) {
        return res.status(err.code).json({ err: err.toString() });
    }
});
app.post(ROUTES.SETTINGS,authenticate, async (req, res) => {
    try {
        if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
        const validSettings =Object.fromEntries(Object.entries(req.body).filter(o=>['wagerPerPoint', 'redeem'].includes(o[0])));
        await setSettings(validSettings);
        return res.json({ message: 'Settings changed', ...validSettings});
    } catch (err) {
        return res.status(err.code).json({ err: err.toString() });
    }
});

// app.post(ROUTES.CONFIG_CASINO_USER,authenticate, async (req, res) => {
//     try {
//         if (!res.locals.member.isAdmin) throw new ErrorCode(403, 'Not admin');
//         return res.json({ message: 'Configured Casino Users', ...req.body});
//     } catch (err) {
//         return res.status(err.code).json({ err: err.toString() });
//     }
// });
app.get(ROUTES.LOGIN, async (req, res) => res.redirect(DISCORD_OAUTH2_URL));
app.get(CLIENT_ROUTES, (req, res) => res.sendFile(path.join(frontend_path, 'index.html')));
app.get('*', (req, res) => res.redirect(ROUTES.HOME));

const { port } = app.listen(PORT).address();
console.info(`\n\nRunning on\nhttp://localhost:${port}`);