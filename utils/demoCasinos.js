export const buildDemoCasinos = () => {
    function tippingAPI(me, receiver, amount, currency){
        if (me[currency] < amount) 
            return {success: false, message: 'Insufficient funds', data:{balance:me[currency], balanceType:currency}};
        me[currency] -= amount;
        receiver[currency] += amount;
        return {success: true, me, receiver};
    }
    return {
        '500casino': new class _500casino {
            constructor() { 
                this.data = {
                    allowWithdraw: true,
                    referralLink: "https://500.casino/r/ABC500",
                }; 
                this.balanceTypes=['usdt','eth'],
                this.users={
                    me:{usdt:5_100_030, eth:423_400_000_000},
                    floppy12:{usdt:100_000, eth:100_000},
                    qwerty:{usdt:100_000, eth:100_000},
                };
                this.referrals=[
                    {
                        casino_user_id: 'floppy12',
                        total_revenue: 100_000,
                        total_wager: 100_000,
                    },
                    {
                        casino_user_id: 'qwerty',
                        total_revenue: 5500_000,
                        total_wager: 52100_000,
                    },

                ];
            }
            getLeaderboard = async () => {
                try {
                    this.data.datetime = new Date(Date.now()).toISOString();
                    this.leaderboard = this.referrals.sort((a,b)=>b.total_revenue-a.total_revenue);
                } catch (e) { console.error(e) }
            };
            sendBalance = async (destinationUserId, value) => {
                let resp = { success: false };
                for await (let balanceType of this.balanceTypes) {
                    try {
                        const r = tippingAPI(this.users.me, this.users[destinationUserId], value, balanceType);
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
                this.balances = this.balanceTypes.map(currency_type => ({  casino_id: '500casino',currency_type, value: this.users.me[currency_type] }));
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
                this.users={
                    me:{usd:5_100_030},
                    gary:{usd:100_000},
                    raz1:{usd:400_000},
                    raz2:{usd:700_000},
                };
                this.referrals=[
                    {
                        casino_user_id: 'raz1',
                        total_revenue: 520_000,
                        total_wager: 620_000,
                    },
                    {
                        casino_user_id: 'raz2',
                        total_revenue: 520_000,
                        total_wager: 620_000,
                    },
                    {
                        casino_user_id: 'gary',
                        total_revenue: 520_000,
                        total_wager: 620_000,
                    },

                ];
            }
            getLeaderboard = async () => {
                try {
                    this.data.datetime = new Date(Date.now()).toISOString();
                    this.leaderboard = this.referrals.sort((a,b)=>b.total_revenue-a.total_revenue);
                } catch (e) { console.error(e) }
            };
            sendBalance = async (destinationUserId, value) => {
                const resp = tippingAPI(this.users.me, this.users[destinationUserId], value, this.balanceTypes[0]);
                console.log(resp);
                await this.getBalance(); 
                return resp;
            }
            getBalance = async () => {
                    this.balances = this.balanceTypes.map(currency_type => ({  casino_id: 'razed',currency_type, value: this.users.me[currency_type] }));
                    return this;
            };
        }(),
    };
}