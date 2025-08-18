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