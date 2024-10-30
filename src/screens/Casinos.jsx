import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/auth';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../utils/routes';
import { Container, Tab, Tabs, CssBaseline, Box, TextField, Button, Divider, Select, MenuItem, InputLabel, setRef } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridAddIcon } from '@mui/x-data-grid';
const casinoIds = ['razed', '500casino'];
const sampleCasinoUserIds = {
  "500casino": {
    "user_id": "689933391352692897",
    "casino_id": "500casino",
    "casino_user_id": "66d40f94e3ca5498f5880993",
    "prev_revenue_checkpoint": "5.00",
    "curr_revenue_checkpoint": "5.00",
    "total_reward": 2.13
  },
  "razed": {
    "user_id": "689933391352692897",
    "casino_id": "razed",
    "casino_user_id": "suisui0804",
    "prev_revenue_checkpoint": "79473.00",
    "curr_revenue_checkpoint": "79473.00",
    "total_reward": 947.3
  }
};

const sampleLeaderboard = {
  total: { "leaderboard": [{ "revenue": 5, "reward": 0.5, "user": { "id": "689933391352692897", "username": "casper.exe_2", "discriminator": "0" }, "user_id": "689933391352692897" }] },
  '500casino': {
    "allowWithdraw": true, "rate": 0.0006002400960384153, "currencies": ["bch", "btc", "doge", "eos", "eth", "ltc", "sol", "xlm", "xrp", "usdt", "usdc", "bnb", "trx", "avax", "matic", "ada"], "inverseRate": 1666, "referralCode": "REF63435AX7A89OU", "referralLink": "https://500.casino/r/REF63435AX7A89OU", "datetime": "28/10/2024, 7:32:00 pm",
    "leaderboard": [
      { "casino_user_id": "66d40f94e3ca5498f5880993", "total_revenue": 10, "casino_user": { "user_id": "689933391352692897", "casino_id": "500casino", "casino_user_id": "66d40f94e3ca5498f5880993", "prev_revenue_checkpoint": "5.00", "curr_revenue_checkpoint": "5.00", "total_reward": 2.13 }, "revenue": 5, "reward": 0.5, "user_id": "689933391352692897", "user": { "id": "689933391352692897", "username": "casper.exe_2", "discriminator": "0" } },
      { "casino_user_id": "44d40f94e3ca5498f5880993", "total_revenue": 10, "casino_user": { "user_id": "790658457786384404", "casino_id": "500casino", "casino_user_id": "44d40f94e3ca5498f5880993", "prev_revenue_checkpoint": "6.00", "curr_revenue_checkpoint": "6.00", "total_reward": 5.13 }, "revenue": 6, "reward": 2.5, "user_id": "790658457786384404", "user": { "id": "790658457786384404", "username": "casper.exe_", "discriminator": "0" } },
    ]
  },
  razed: { "allowWithdraw": false, "rate": 1, "currencies": ["usd"], "inverseRate": 1, "referralCode": "PasCal", "referralLink": "https://www.razed.com/signup/?raf=PasCal", "datetime": "28/10/2024, 7:33:01 pm", "leaderboard": [{ "casino_user_id": "suisui0804", "total_revenue": 79473, "casino_user": { "user_id": "689933391352692897", "casino_id": "razed", "casino_user_id": "suisui0804", "prev_revenue_checkpoint": "79473.00", "curr_revenue_checkpoint": "79473.00", "total_reward": 947.3 }, "revenue": 0, "reward": 0, "user_id": "689933391352692897", "user": { "id": "689933391352692897", "username": "casper.exe_2", "discriminator": "0" } }] },
};
const Casinos = () => {
  const [params, setParams] = useSearchParams();
  const casinoId = params.get('casino_id');
  const { post, get, casinoUserIds } = useAuth();

  const [leaderBoard, setLeaderboard] = useState({});
  const [amount, setAmount] = useState(0);
  const [balanceType, setBalanceType] = useState('usdt');
  const [casinoUser, setCasinoUser] = useState();
  const [casinoUserId, setCasinoUserId] = useState();
  const { total_reward, user_id } = casinoUser ?? {};

  const getLeadboard = async () => setLeaderboard((await get(ROUTES.CASINOS + (!casinoId ? '' : `?casino_id=${casinoId}`)))?.data);
  

  const updateCasinoUserId = async () => await post(ROUTES.CASINOS, { casino_id: casinoId, casino_user_id: casinoUserId }).catch(alert)
    .then(r => { if (!r.data.err) { setCasinoUser(r?.data?.user_casino); setLeaderboard(r.data?.leaderboard); } });

  const sendBalance = async () => await post(ROUTES.CLAIM_REWARD, { amount, balanceType, casinoId }).catch(alert)
    .then(r => { if (r.data.err) {alert(r.data.err); return;} setCasinoUser(cu => ({ ...cu, total_reward: r?.data?.balance })); });//TODO: if fails dont update balance

  useEffect(() => {
    setCasinoUser(casinoUserIds?.[casinoId]);
  },[casinoId, casinoUserIds]);
  useEffect(() => {
    if (!casinoIds.includes(casinoId)) setParams();
    getLeadboard();
    // setCasinoUser(sampleCasinoUserIds[casinoId]);
    // setLeaderboard(sampleLeaderboard[casinoIds.includes(casinoId) ? casinoId : 'total'])
  }, [casinoId]);

  return (
    <Container>
      <CssBaseline />
      <Navbar />
      <div style={{ marginTop: 100 }}>
        <Tabs value={casinoId ?? ''} onChange={(_, casino_id) => { !casino_id ? setParams() : setParams({ casino_id }) }}>
          {...['', ...casinoIds].map(c =>
            <Tab label={c || 'Total'} value={c} />
          )}
        </Tabs>

        <div>

          {!casinoIds.includes(casinoId) ? <></> : <div>

            <h4>{casinoId || 'Total'} Leaderboard</h4>
            <br />
            referralCode: {leaderBoard.referralCode}
            <br />
            referralLink: {leaderBoard.referralLink}
            <br />
            rate: {leaderBoard.rate}
            <br />
            inverseRate: {leaderBoard.inverseRate}
            <br />
            casinoUserId: {casinoUser?.casino_user_id}
            <br />
            <TextField label={casinoId + ' username'} variant='outlined' value={casinoUserId} onChange={({ target: { value } }) => setCasinoUserId(value)} />
            <Button variant='contained' onClick={updateCasinoUserId}>Submit</Button>

          </div>
          }         <DataGrid getRowClassName={({ row }) => row.user_id == user_id ? 'highlight-row' : ''} getRowId={({ user_id, casino_id }) => user_id + '-' + casino_id}
            columns={[
              { field: 'user_id' },
              { field: 'username' },
              { field: 'casino_user_id' },
              { field: 'casino_id' },

              { field: 'reward' },
              { field: 'revenue' },

              { field: 'total_revenue' },
              { field: 'prev_revenue_checkpoint' },
              { field: 'curr_revenue_checkpoint' },
              { field: 'total_reward' },

            ]
              .filter(({ field }) => casinoIds.includes(casinoId) ? true : ['reward', 'revenue', 'user_id', 'username'].includes(field))
            }
            rows={leaderBoard?.leaderboard?.map(rec => ({ ...rec, ...rec.user, ...rec.casino_user }))
            }
          />

        </div>

        <>
          {
            leaderBoard?.allowWithdraw ?
              <div>
                <TextField fullWidth label={`Amount (available: ${total_reward})`} type='number' variant='outlined'
                  slotProps={{ htmlInput: { max: total_reward, min: 0 } }} value={amount}
                  onChange={({ target: { value } }) => setAmount(value)} ></TextField>
                <Select label='Currency' variant='outlined' value={balanceType} onChange={({ target: { value } }) => setBalanceType(value)} >
                  {leaderBoard?.currencies?.map(curr => <MenuItem value={curr}>{curr}</MenuItem>)}
                </Select>
                <Button variant='contained' onClick={sendBalance}>Send</Button>
              </div> : <></>
          }
        </>

      </div>
    </Container>
  );
};

export default Casinos;