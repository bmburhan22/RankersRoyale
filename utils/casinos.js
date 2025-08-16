import axios from "axios";
import cron from 'node-cron';

import { API_KEY_500, API_KEY_RAZED, API_KEY_RAZED_REF} from '../config.js';

export const casinos = {
    '500casino': await (new class _500casino {
        transactionCurrencies = ['eth', 'usdt'];
        headers = { 'x-500-auth': API_KEY_500 }
        boot = () => axios.get('https://500.casino/api/boot', { headers: this.headers })
        constructor() { this.data = {}; }
        init = async () => await this.getBalance().then(async d => { await this.getLeaderboard(); return d; });
        getLeaderboard = async () => {
            try {
                const r = await axios.post("https://500.casino/api/rewards/affiliate-users",
                    { sorting: { totalPlayed: -1 } },
                    { headers: this.headers },
                );
                this.data.datetime = new Date(Date.now()).toLocaleString();
                this.leaderboard = r.data.results.map(u => ({
                    casino_user_id: u._id,
                    total_revenue: parseFloat(this.data?.rate) * parseFloat(u.totalRevenue),
                    total_wager: parseFloat(this.data?.rate) * parseFloat(u.totalPlayed),
                }));
            } catch (e) { console.error(e) }
        };
        sendBalance = async (destinationUserId, value) => {
            let resp = { success: false };
            for await (let balanceType of this.balanceTypes) {
                try {
                    const r = await axios.post('https://tradingapi.500.casino/api/v1/user/balance/send',
                        { destinationUserId, value: value * this.data.inverseRate, balanceType }, { headers: this.headers, })
                    resp = { success: true, ...r.data };
                    if (!resp.success) throw new Error();
                    console.log('500 transaction success', balanceType);
                    break;
                } catch (err) {
                    resp = { ...err.response?.data, success: false };
                    console.error('500 transaction failed', balanceType);
                    continue;
                }
            }

            await this.getBalance(); return resp;
        }
        getBalance = async () => await this.boot()

            .then(async ({ data: { userData: { referralCode, balances: bal }, siteSettings, } }) => {


                const { rate, inverseRate } = siteSettings.currencyRates.bux.usd;
            
                bal = await JSON.parse(bal);
                const balances = this.transactionCurrencies.map(currency_type => ({  casino_id: '500casino',currency_type, value: rate * bal[currency_type] }))
            
                const referralLink = "https://500.casino/r/" + referralCode
                this.data = { allowWithdraw: true, rate, balances, inverseRate, referralCode, referralLink }
                return this;
            }).catch(c => this);


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
                this.data = { allowWithdraw: true, rate: 1, inverseRate: 1, referralCode, referralLink }
                await this.getLeaderboard();
                return this;
            }).catch(c => {
                console.error(c);
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
                    total_revenue: parseFloat(this.data?.rate) * parseFloat(u.wagered),
                    total_wager: parseFloat(this.data?.rate) * parseFloat(u.wagered),
                }));
            } catch (e) { console.error(e) }
        };

        sendBalance = async (receiver_username, amount) => {
            return await fetch('https://api.razed.com/player/api/v1/tips',
                {
                    method: 'POST', headers: { Authorization: 'Bearer ' + API_KEY_RAZED },
                    body: { receiver_username, amount, otp_code: "", is_public_tip: true },

                },
            )
                .then(async r => ({ success: true, ...await r.json() }))
                .catch(err => { console.error(err); return { ...err, success: false } })
                .finally(async d => { await this.getBalance(); return d; })

                ;
        };
        getBalance = async () => await fetch('https://api.razed.com/player/api/v1/wallets',
            { headers: { Authorization: 'Bearer ' + API_KEY_RAZED } },
        )
            .then(async r => await r.json())
            .then(d => {
                this.data.balances = [{ casino_id: 'razed', currency_type: 'usd', value: parseFloat(d?.[0]?.balance) }];
            })
            .catch(err => { console.error(err); return err });

    }().init())
}
export const refreshLeaderboardData = async () => {
    for await (const casino of Object.values(casinos)) {
        await casino.getLeaderboard();
        await casino.getBalance();
    }
}
export const getWithdrawableBalances = () => Object.values(casinos).reduce((bal, casino) => !casino.data.allowWithdraw ? bal : [...bal, ...casino.data.balances], [])
refreshLeaderboardData();
cron.schedule('* * * * *', refreshLeaderboardData);
