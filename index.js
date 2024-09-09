
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { INTEGER, Op, Sequelize, STRING, where } from 'sequelize';
import axios from 'axios';
import express, { json } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { Client, GatewayIntentBits } from 'discord.js';
import ROUTES from './config/routes.js';
import { rm } from 'fs';
dotenv.config();
const { PORT, DB_URL, TOKEN, JWT_SECRET, API_KEY_500,
    DISCORD_ROLE_ID, DISCORD_OAUTH2_URL, DISCORD_CLIENT_SECRET, DISCORD_GUILD_ID } = process.env;

const app = express();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
client.login(TOKEN);

const DISCORD_API = 'https://discord.com/api';
const _500_API_URL = "https://500.casino/api/rewards/affiliate-users";
const CLIENT_ROUTES = [
    ROUTES.HOME,
    ROUTES.CASINOS,
];


const frontend_path = path.join(path.resolve(), 'dist');
app.use(express.static(frontend_path));

const sq = new Sequelize(DB_URL);


const users = sq.define('users',
    {
        id: { primaryKey: true, type: STRING }
        , username: { type: STRING }, discriminator: { type: STRING },
    }
    , { freezeTableName: true, timestamps: false });
const casinos = sq.define('casinos',
    { id: { primaryKey: true, type: STRING }, name: { type: STRING }, link: { type: STRING }, }
    , { freezeTableName: true, timestamps: false });
const users_casinos = sq.define('users_casinos',
    {
        user_id: { primaryKey: true, type: STRING }, casino_id: { type: STRING, primaryKey: true }, casino_username: { type: STRING },
        prev_wager_checkpoint: { type: INTEGER }, curr_wager_checkpoint: { type: INTEGER }
    }
    , { freezeTableName: true, timestamps: false });
const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept-Encoding': 'application/x-www-form-urlencoded',
}


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
        if (!token) {
            throw new ErrorCode(401, 'Authorization token needed');

        }

        const user_id = jwt.verify(token, JWT_SECRET, (err, user_id) => {
            if (err) throw new ErrorCode(401, err.toString());
            return user_id;
        });

        const guild = await client.guilds.fetch(DISCORD_GUILD_ID)

        const member = await guild?.members?.fetch(user_id).catch(err => {
            throw new ErrorCode(403, err.toString());
        });
        if (!member) throw new ErrorCode(403, 'Not a server member');
        if (!member.roles.cache.has(DISCORD_ROLE_ID)) throw new ErrorCode(403, 'Member not verified');
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

    if (!code) return res.json({});
    const params = new URLSearchParams({
        client_id, redirect_uri,
        code, client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
    });

    try {

        const { data: authData } = await axios.post(`${DISCORD_API}/oauth2/token`, params, { headers });
        const { data: { id, username, discriminator } } = await axios.get(`${DISCORD_API}/users/@me`, { headers: { 'Authorization': `Bearer ${authData.access_token}`, ...headers } });
        const data = { id, username, discriminator };
        const [_, isCreated] = await users.findOrCreate({ where: { id }, defaults: data });
        if (!isCreated) await users.update(data, { where: { id } });

        const token = jwt.sign(id, JWT_SECRET);
        return res.cookie('token', token, { maxAge: 30 * 24 * 60 * 60 * 1000 }).redirect(ROUTES.HOME);

    } catch (err) {
        return res.json({ err: err.toString() });
    }
}

);

app.get(ROUTES.API_CASINOS, authenticate, async (req, res) => {

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

app.post(ROUTES.API_CASINOS, authenticate, async ({ body: { casino_id, casino_username } }, res) => {


    try {

        const casino = await casinos.findOne({ where: { id: casino_id } });
        if (!casino) return res.json({ 'msg': 'Invalid casino' });


        const [user_casino] = await users_casinos.upsert({ user_id: res.locals.member.id, casino_id, casino_username });

        return res.json({ user_casino });
    } catch (err) {
        return res.json({ err });
    }
});


app.get(ROUTES.API_MEMBERS, async (req, res) => {
    try {
        const members = await client.guilds.fetch(DISCORD_GUILD_ID)
            .then(g => g.members.fetch())
            .then(m => m.filter(m => m.roles.cache.has(DISCORD_ROLE_ID))
                .map(m => m.id)
            );
        const casino_usernames = await users_casinos.findAll({ where: { user_id: { [Op.in]: members } } });
        return res.json({ casino_usernames });
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

const casinoUsernameFiltered = async (casino_id, casino_user_ids) => {
    try {
        const members = await client.guilds.fetch(DISCORD_GUILD_ID)
            .then(g => g.members.fetch())
            .then(m => m.filter(m => m.roles.cache.has(DISCORD_ROLE_ID))
                .map(m => m.id)
            );
        return (await users_casinos.findAll(
            { where: { casino_id, user_id: { [Op.in]: members }, casino_username: { [Op.in]: casino_user_ids } } }
        )
        );
    } catch (err) {
        console.log({ err: err.toString() });

        return [];
    }
}

// app.get(ROUTES.API_500_LEAD, async (req, res) => {
//     try {
//         const casino_usernames = await casinoUsernameFiltered('500casino');
//         const r = await axios.get(FIVE_HUNDRED_API);
//         let { places, detailed } = r.data;
//         places = places
//             .filter(p => casino_usernames.includes(p.userId))
//             .map(p => {
//                 return { ...p, ...detailed[p.userId] };
//             })
//         return res.json({ places });
//     } catch (err) {
//         return res.json({ err: err.toString() });
//     }
// });

app.get(ROUTES.API_500, async (req, res) => {
    try {
        const r = await axios.post(_500_API_URL,
            { sorting: { totalRevenue: -1 }, },
            { headers: { 'x-500-auth': API_KEY_500 } });

        let { results } = r.data;
        const casino_user_ids = results.map(r => r._id);
        const filtered = await casinoUsernameFiltered('500casino', casino_user_ids);

         results = results.map(r => {
            const { user_id, curr_wager_checkpoint, prev_wager_checkpoint } = filtered.find(f => f.casino_username == r._id);
            return { waged: r.totalPlayed - (curr_wager_checkpoint ?? r.totalPlayed), 
                ...r, user_id, prev_wager_checkpoint, curr_wager_checkpoint, };
        }).toSorted((a,b)=>b.waged-a.waged);
        return res.json({ results });
    } catch (err) {
        return res.json({ err: err.toString() });
    }
});

app.get(ROUTES.API_500_START_CYCLE, async (req, res) => {
    try {
        const r = await axios.post(_500_API_URL,
            { sorting: { totalPlayed: -1 } },
            { headers: { 'x-500-auth': API_KEY_500 } });
        await r.data.results.forEach(async r => {
            await users_casinos.findOne({ where: { casino_username: r._id }, })
                .then(async uc => {
                    uc.prev_wager_checkpoint = uc.curr_wager_checkpoint;
                    uc.curr_wager_checkpoint = r.totalPlayed;
                    await uc.save();
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


sq.sync({ alter: true }).then(async () => {

    // static casino data
    await casinos.bulkCreate(
        [
            { id: '500casino', name: '500casino', link: 'https://500.casino' },
            { id: 'bet1', name: 'bet1', link: 'https://bet1.com' },

        ],
        { updateOnDuplicate: ['name', 'link'] });

    const { port } = app.listen(PORT).address();
    console.info(`\n\nRunning on\nhttp://localhost:${port}`);

    return;
}).catch((err) => { console.error(err); });
