import {promises as fs} from 'fs';
const demoDataFilename = 'utils/demodata.json';

const saveData = async data => fs.writeFile(demoDataFilename, JSON.stringify(data, null, 2));
const loadData = async () => fs.readFile(demoDataFilename, 'utf8').then(JSON.parse);

async function tippingAPI(casino_id, receiver_id, amount, currency){
    const data = await loadData();
    const me = data[casino_id].me;
    const receiver = data[casino_id][receiver_id];
    if (me[currency] < amount) 
        return {success: false, message: 'Insufficient funds', data:{balance:me[currency], balanceType:currency}};
    me[currency] -= amount;
    receiver[currency] += amount;
    await saveData(data);
    return {success: true, me, receiver};
}

export const buildDemoCasinos = () => {
    return {
        '500casino': new class _500casino {
            constructor() { 
                this.data = {
                    name: '500 Casino',
                    logo: `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                        <rect width="80" height="80" rx="10" fill="#111827"/>
                        <circle cx="40" cy="40" r="14" fill="#facc15"/>
                        <line x1="40" y1="16" x2="40" y2="28" stroke="#facc15" stroke-width="2"/>
                        <line x1="40" y1="52" x2="40" y2="64" stroke="#facc15" stroke-width="2"/>
                        <line x1="16" y1="40" x2="28" y2="40" stroke="#facc15" stroke-width="2"/>
                        <line x1="52" y1="40" x2="64" y2="40" stroke="#facc15" stroke-width="2"/>
                        </svg>`,
                    color: '#facc15',
                    allowWithdraw: true,
                    referralLink: "https://500.casino/r/ABC500",
                }; 
                this.balanceTypes=['usdt','eth'];
            }
            getLeaderboard = async () => {
                try {
                    const data = await loadData();
                    const {me, ...casino} = data['500casino'];
                    this.leaderboard = Object.entries(casino).map(([casino_user_id, {total_revenue, total_wager}])=>({casino_user_id, total_revenue, total_wager})).sort((a,b)=>b.total_revenue-a.total_revenue);
                    this.data.datetime = new Date(Date.now()).toISOString();
                } catch (e) { console.error(e) }
            };
            sendBalance = async (destinationUserId, value) => {
                let resp = { success: false };
                for await (let balanceType of this.balanceTypes) {
                    try {
                        const r = await tippingAPI('500casino', destinationUserId, value, balanceType);
                        resp = { success: true, ...r.data };
                        console.log(r);
                        if (!resp.success) throw new Error();
                        break;
                    } catch (err) {
                        resp = { success: false };
                    }
                }
                await this.getBalance(); 
                return resp;
            }
            getBalance = async () => {
                const data = await loadData();
                this.balances = this.balanceTypes.map(currency_type => ({  casino_id: '500casino',currency_type, value: data['500casino'].me[currency_type] }));
                return this;
            };


        }(),

        'razed': new class Razed {
            constructor() { 
                this.data = {
                    name: 'Razed',
                    logo: `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                        <rect width="80" height="80" rx="10" fill="#0a0a0a"/>
                        <path d="M20 32 Q32 24 40 32 T60 32" fill="none" stroke="#22d3ee" stroke-width="2"/>
                        <path d="M20 40 Q32 32 40 40 T60 40" fill="none" stroke="#38bdf8" stroke-width="2"/>`,
                    color: '#22d3ee',
                    allowWithdraw: true,
                    referralLink: "https://www.razed.com/signup/?raf=RAZREF123",
                }; 
                this.balanceTypes=['usd'];
            }
            getLeaderboard = async () => {
                try {
                    const data = await loadData();
                    const {me, ...casino} = data['razed'];
                    this.leaderboard = Object.entries(casino).map(([casino_user_id, {total_revenue, total_wager}])=>({casino_user_id, total_revenue, total_wager})).sort((a,b)=>b.total_revenue-a.total_revenue);
                    this.data.datetime = new Date(Date.now()).toISOString();
                } catch (e) { console.error(e) }
            };
            sendBalance = async (destinationUserId, value) => {
                const resp = await tippingAPI('razed', destinationUserId, value, this.balanceTypes[0]);
                console.log(resp);
                await this.getBalance(); 
                return resp;
            }
            getBalance = async () => {
                const data = await loadData();
                this.balances = this.balanceTypes.map(currency_type => ({  casino_id: 'razed',currency_type, value: data['razed'].me[currency_type] }));
                    return this;
            };
        }(),
    };
}