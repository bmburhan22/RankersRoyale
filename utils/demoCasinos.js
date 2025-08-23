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
                    logo: `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="40" rx="5" fill="#111827"/>
                        <circle cx="20" cy="20" r="7" fill="#facc15"/>
                        <line x1="20" y1="8" x2="20" y2="14" stroke="#facc15" stroke-width="1"/>
                        <line x1="20" y1="26" x2="20" y2="32" stroke="#facc15" stroke-width="1"/>
                        <line x1="8" y1="20" x2="14" y2="20" stroke="#facc15" stroke-width="1"/>
                        <line x1="26" y1="20" x2="32" y2="20" stroke="#facc15" stroke-width="1"/>
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
                    logo: `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="40" rx="5" fill="#0a0a0a"/>
                        <path d="M10 16 Q16 12 20 16 T30 16" fill="none" stroke="#22d3ee" stroke-width="1"/>
                        <path d="M10 20 Q16 16 20 20 T30 20" fill="none" stroke="#38bdf8" stroke-width="1"/>`,
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