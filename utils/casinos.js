import axios from "axios";
import dotenv from 'dotenv';
import cron from 'node-cron';
dotenv.config();
const { API_KEY_500, API_KEY_RAZED, API_KEY_RAZED_REF, } = process.env;

export const casinos = {
    '500casino': await (new class _500casino {
        constructor() { this.data = {}; }
        init = async () => await axios.get('https://500.casino/api/boot', { headers: { 'x-500-auth': API_KEY_500 } })

            .then(async ({ data: { userData: { referralCode }, siteSettings, balances: { crypto: currencies } } }) => {
                const { rate, inverseRate } = siteSettings.currencyRates.bux.usd;
                const referralLink = "https://500.casino/r/" + referralCode
                this.data = {allowWithdraw:true, rate, currencies, inverseRate, referralCode, referralLink }
                await this.getLeaderboard();
                return this;
            }).catch(c => this);
        getLeaderboard = async () => {
            try {
                const r = await axios.post("https://500.casino/api/rewards/affiliate-users",
                    { sorting: { totalPlayed: -1 } }, { headers: { 'x-500-auth': API_KEY_500 } }
                );
                this.data.datetime = new Date(Date.now()).toLocaleString();

                this.leaderboard = r.data.results.map(u => ({
                    casino_user_id: u._id,
                    total_revenue: parseFloat(this.data?.rate) *parseFloat( u.totalPlayed),
                }));
            } catch (e) { console.log(e) }
        };
        sendBalance = async (destinationUserId, value, balanceType) => {
            return await axios.post('https://tradingapi.500.casino/api/v1/user/balance/send',
                { destinationUserId, value: value * this.data.inverseRate, balanceType }, { headers: { 'x-500-auth': API_KEY_500 }, })
                .then(r => ({ success: true, ...r.data }))
                .catch(err => { console.log(err); return { ...err.response.data, success: false } })
                ;
        }

    }().init()),



    'razed': await (new class Razed {
        constructor() { this.data = {}; }
        init = async () => await fetch('https://api.razed.com/player/api/v1/profile',
            {
                headers: { Authorization: 'Bearer ' + API_KEY_RAZED }
            },)
            .then(r => r.json())
            .then(async ({ referral_code: referralCode }) => {
                const referralLink = "https://www.razed.com/signup/?raf=" + referralCode
                this.data = {allowWithdraw:false, rate: 1, currencies: ['usd'], inverseRate: 1, referralCode, referralLink }
                await this.getLeaderboard();
                return this;
            }).catch(c => {
                console.log(c);
                return this;
            });
        getLeaderboard = async () => {
            try {
                const r = await fetch("https://api.razed.com/player/api/v1/referrals/leaderboard?from=0001-01-01&referral_code=Razedreloads%2CChrisspinsslots%2CReloadsJP%2CReloads&to=9999-12-31&top=100",
                    { headers: { 'X-Referral-Key': API_KEY_RAZED_REF }, },
                ).then(r => r.json());

                this.data.datetime = new Date(Date.now()).toLocaleString();
                this.leaderboard = r.data.map(u => ({
                    casino_user_id: u.username,
                    total_revenue: parseFloat(this.data?.rate) * parseFloat(u.wagered)
                }));
            } catch (e) { console.log(e) }
        };

        sendBalance = async (receiver_username, amount, balanceType) => {
            return await fetch('https://api.razed.com/player/api/v1/tips',
                {
                    method: 'POST', headers: { Authorization: 'Bearer ' + API_KEY_RAZED },
                    body: { receiver_username, amount, otp_code: "", is_public_tip: true },

                },
            )
                .then(async r => ({ success: true, ...await r.json() }))
                .catch(err => { console.log(err); return { ...err, success: false } })

                ;
        }
    }().init())
}
export const refreshLeaderboardData = async () => {
    for await (const casino of Object.values(casinos)) {
        await casino.getLeaderboard();
    }
}
refreshLeaderboardData();
cron.schedule('* * * * *', refreshLeaderboardData);
