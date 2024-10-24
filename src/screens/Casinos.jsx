import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/auth';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../utils/routes';
import {  Container,  Tab, Tabs,CssBaseline, Box, TextField, Button, Divider, Select, MenuItem, InputLabel, setRef } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridAddIcon } from '@mui/x-data-grid';
const casinoIds = ['razed', '500casino'];
const Casinos = () => {
  const [params, setParams] = useSearchParams();
  const casinoId= params.get('casino_id');
  // if (!casinoIds.includes(casinoId)) setParams({});
  const { post, get, userId } = useAuth();
  const [inputData, setInputData] = useState();
  const [leaderBoard, setLeaderboard] = useState({});
  const [amount, setAmount] = useState(0);
  const [balanceType, setBalanceType] = useState('usdt');
  const { casino_user } = leaderBoard?.leaderboard?.find(u => u.user_id == userId) ?? {};
  const { total_reward } = casino_user ?? {};
  // const [items, setItems] = useState([]);
  // const getShopItems = async () => await get(ROUTES.SHOP).then(r => { setItems(r.data.items); setCasinoWallets(r.data.casinoWallets) });
  const getLeadboard = async () => {
    const res = await get(`${ROUTES.CASINOS}?casino_id=${casinoId}`);
    if (res.status != 200) { setLeaderboard({}); return; }
    setLeaderboard(res.data);
  }

  const setCasinoUserId = (casinoUserId) => post(ROUTES.CASINOS, casinoUserId);

  const sendBalance = async () => await post(ROUTES.CLAIM_REWARD, { amount, balanceType, casinoId }).catch(alert);
  // const redeemItem = async ({ item_id, minAmount, maxAmount }) => await post(ROUTES.BUY, { item_id, casinoId, balanceType }).catch(alert);

  useEffect(() => {
    getLeadboard();
    // getShopItems();
  }, [casinoId]);
  return (
    <Container>



      <CssBaseline />
      <Navbar />
      <div style={{ marginTop: 100 }}>
      {/* <Button label='Total' variant='contained'  onClick={() => {setParams()}}>TOTAL</Button> */}
      <Tabs  value={casinoId} onChange={(_,casino_id) => {console.log(casino_id);setParams({ casino_id}); }}>
      {...['',...casinoIds].map(c =>
          <Tab label={c||'Total'} value={c} />
        )}

      </Tabs>
        <> {/*
        <div>
          <h3>TOTAL LEADERBOARD</h3>
          <DataGrid getRowId={({ user_id }) => user_id}
            columns={[
              { field: 'user_id' },
              { field: 'username' },
              // { field: 'wager' },
              // { field: 'total_wager' },
              // { field: 'wagePerPoint' },
              // { field: 'points' },
              // { field: 'total_points' },
              { field: 'revenue' },
              { field: 'total_revenue' },
              { field: 'reward' },
              { field: 'total_reward' },
            ]}
            rows={Object.values(leaderBoard.total).map(rec => ({ ...rec, ...rec.user }))}
          />
        </div> */}
        </>
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
            
              <TextField label={casinoId + ' username'} variant='outlined' onChange={e => setInputData(v => { return { ...v, [casinoId]: e.target.value } })} />
              <Button variant='contained' onClick={() => setCasinoUserId({ casino_id: casinoId, casino_user_id: inputData[casinoId] })}>Submit</Button>
            
          </div>
          }         <DataGrid getRowId={({ user_id, casino_id }) => user_id + '-' + casino_id}
            columns={[
              { field: 'user_id' },
              { field: 'username' },
              { field: 'casino_user_id' },
              { field: 'casino_id' },
              // { field: 'wager' },
              // { field: 'total_wager' },
              // { field: 'wagerPerPoint' },
              // { field: 'prev_wager_checkpoint' },
              // { field: 'curr_wager_checkpoint' },
              // { field: 'points' },
              // { field: 'total_points' },

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
        <>
          {/* 
        <Divider variant="fullWidth" flexItem/>

        <DataGrid getRowId={({ item_id }) => item_id}
          rows={items}
          columns={[
            { field: 'item_id' },
            { field: 'price', },
            { field: 'minAmount', },
            { field: 'maxAmount', },
            { field: 'desc', },
            {
              field: 'actions',
              type: 'actions',
              getActions: (params) => [
                <GridActionsCellItem icon={<GridAddIcon />} onClick={() => redeemItem(params.row)} label="Redeem" />]
            },
          ]}
        /> */}
        </>

      </div>
    </Container>
  );
};

export default Casinos;