
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Sequelize, STRING } from 'sequelize';
import axios from 'axios';
import express, { json } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { Client, GatewayIntentBits } from 'discord.js';
import ROUTES from './config/routes.js';
dotenv.config();
const { PORT, DB_URL, TOKEN, JWT_SECRET,
    DISCORD_ROLE_ID, DISCORD_OAUTH2_URL, DISCORD_CLIENT_SECRET, DISCORD_GUILD_ID } = process.env;

const app = express();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.login(TOKEN);

const DISCORD_API = 'https://discord.com/api';
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
const users_cainos = sq.define('users_casinos',
    { user_id: { primaryKey: true, type: STRING }, casino_id: { type: STRING, primaryKey: true }, casino_username: { type: STRING }, }
    , { freezeTableName: true, timestamps: false });
const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept-Encoding': 'application/x-www-form-urlencoded',
}


app.use(cors());
app.use(json());
app.use(cookieParser());

const authenticate = async (req, res, next) => {
    const token = req.cookies?.['token'];
    if (!token) { return res.status(401).json({ err: 'Authorization token needed' }); }
    return await jwt.verify(token, JWT_SECRET, async (err, user_id) => {
        
        if (err) { return res.status(401).json({ err }); }

        const member = await client.guilds.fetch(DISCORD_GUILD_ID)
            .then(g => g?.members?.fetch(user_id).then(m => m));
        // TODO: cache not updating each time
        if (!member) return res.status(403).json({ err: 'Not a server member' });
        if (!(await member.roles.cache.has(DISCORD_ROLE_ID))) return res.status(403).json({ err: 'Member not verified' });
        res.locals.member = member;
        // const { username, discriminator, globalName } = member.user;
        // const { displayAvatarURL, nickname } = member.toJSON();
        // res.cookie('user', JSON.stringify({ displayAvatarURL, nickname, username, discriminator, globalName }),);
       
        await next();

    });
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

    } catch (error) {
        return res.json({ error });
    }
}

);

app.get(ROUTES.API_CASINOS, authenticate, async (req, res) => {

    try {
        const user_casino = await users_cainos.findAll({ where: { user_id: res.locals.member.id } });
        return res.json({ user_casino });
    } catch (error) {
        return res.json({ error });
    }
}

);

app.get(ROUTES.API_CASINO_PAGE, authenticate, async ({ params: { casino_id } }, res) => {

    try {
        const casino = await casinos.findOne({ where: { id: casino_id } });
        if (!casino) return res.json({ 'msg': 'Invalid casino' });

        const user_casino = await users_cainos.findOne({ where: { user_id: res.locals.member.id, casino_id } });

        return res.json({ user_casino });
    } catch (err) {
        return res.json({ err });
    }
}

);

app.get(ROUTES.API, authenticate, async (req, res) => {

    try {
        return res.json({ active: true });
    } catch (err) {
        return res.json({ err });
    }
}

);


app.get(ROUTES.ME, authenticate, async (req, res) => {

    try {
        const { username, discriminator, globalName } = res.locals.member.user;
        const { displayAvatarURL, nickname } = res.locals.member.toJSON();
        return res.json({ username, discriminator, nickname, globalName, displayAvatarURL });
    } catch (err) {
        return res.json({ err });
    }
}

);

app.post(ROUTES.API_CASINOS, authenticate, async ({body:{casino_id, casino_username}}, res) => {

    
    try {

        const casino = await casinos.findOne({ where: { id: casino_id } });
        if (!casino) return res.json({ 'msg': 'Invalid casino' });
        
        
        const [ user_casino] = await users_cainos.upsert({ user_id: res.locals.member.id, casino_id, casino_username });

        return res.json({  user_casino});
    } catch (err) {
        return res.json({ err });
    }
}

);



app.get(ROUTES.LOGIN, async (req, res) => res.redirect(DISCORD_OAUTH2_URL));
app.get(
    CLIENT_ROUTES,
    (req, res) => res.sendFile(path.join(frontend_path, 'index.html')));
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
