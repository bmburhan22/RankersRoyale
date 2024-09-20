import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import ROUTES from '../../utils/routes';
import { CssBaseline, Box, TextField, Button, Divider, Select, MenuItem, InputLabel } from '@mui/material';

import { Row, } from 'react-bootstrap';
import { DataGrid, GridActionsCellItem, GridAddIcon } from '@mui/x-data-grid';

const Casinos = () => {
  const CASINO_OBJ = { bet1: null, '500casino': null };

  const { post, get } = useAuth();
  const [inputData, setInputData] = useState(CASINO_OBJ);
  const [leaderBoard, setLeaderboard] = useState({ total: {}, casinos: {} });
  const [amount, setAmount] = useState(0);
  const [balanceType, setBalanceType] = useState('usdt');
  const [casinoId, setCasinoId] = useState('500casino');
  const [casinoWallets, setCasinoWallets] = useState([]);
  const [items, setItems] = useState([]);
  const getShopItems = async () => await get(ROUTES.SHOP).then(r => { setItems(r.data.items); setCasinoWallets(r.data.casinoWallets) });
  const getLeadboard = async () => {
    const res = await get(ROUTES.CASINOS);
    if (res.status != 200) { setLeaderboard({ total: {}, casinos: {} }); return; }
    setLeaderboard(res.data);
  }
  const getLeadboardFromInitData = () => {
    setLeaderboard(JSON.parse(document.querySelector('script#initData').textContent));
  }

  const setCasinoUserId = (casinoUserId) => post(ROUTES.CASINOS, casinoUserId);

  const sendBalance = async () => await post(ROUTES.REDEEM, { amount, balanceType, casinoId }).catch(alert);
  const redeemItem = async ({ item_id, minAmount, maxAmount }) => await post(ROUTES.BUY, { item_id, casinoId, balanceType }).catch(alert);

  useEffect(() => {
    // getLeadboard();
    getLeadboardFromInitData();
    getShopItems();
  }, []);
  return (
    <>

      <CssBaseline />
      <Navbar />
      <div style={{ marginTop: 100 }}>
        <h3>TOTAL LEADERBOARD</h3>
        <DataGrid getRowId={({ user_id }) => user_id}
          columns={[
            { field: 'user_id' },
            { field: 'username' },
            { field: 'wager' },
            { field: 'total_wager' },
            { field: 'wagePerPoint' },
            { field: 'points' },
            { field: 'total_points' },
          ]}
          rows={Object.values(leaderBoard.total).map(rec => ({ ...rec, ...rec.user }))}
        />
        {Object.entries(leaderBoard.casinos).map(([casino_id, casinoData]) =>
          <>
            <h4>LEADERBOARD for {casino_id}</h4>
            <br />
            referralCode: {casinoData.referralCode}
            <br />
            referralLink: {casinoData.referralLink}
            <br />
            rate: {casinoData.rate}
            <br />
            inverseRate: {casinoData.inverseRate}
            <br />
            <Row>
              <TextField label={casino_id + ' username'} variant='outlined' onChange={e => setInputData(v => { return { ...v, [casino_id]: e.target.value } })} />
              <Button variant='contained' onClick={() => setCasinoUserId({ casino_id, casino_user_id: inputData[casino_id] })}>Submit</Button>
            </Row>
            <DataGrid getRowId={({ user_id, casino_id }) => user_id + '-' + casino_id}
              columns={[
                { field: 'user_id' },
                { field: 'username' },
                { field: 'casino_user_id' },
                { field: 'casino_id' },
                { field: 'wager' },
                { field: 'total_wager' },
                { field: 'wagerPerPoint' },
                { field: 'prev_wager_checkpoint' },
                { field: 'curr_wager_checkpoint' },
                { field: 'points' },
                { field: 'total_points' },

              ]}
              rows={casinoData.leaderboard
                .map(rec => ({ ...rec, ...rec.user, ...rec.casino_user }))
              }
            />
          </>)}

          <Divider variant="fullWidth" flexItem/>



        <TextField label='Amount' type='number' variant='outlined' value={amount} onChange={({ target: { value } }) => setAmount(value)} ></TextField>
        <Select label='Currency' variant='outlined' value={balanceType} onChange={({ target: { value } }) => setBalanceType(value)} >
          {leaderBoard?.casinos?.[casinoId]?.currencies?.map(curr => <MenuItem value={curr}>{curr}</MenuItem>)}
        </Select>
        <Select label='Destination wallet' variant='outlined' value={casinoId} onChange={({ target: { value } }) => setCasinoId(value)} >
          {casinoWallets.map(cw => <MenuItem value={cw}>{cw}</MenuItem>)}
        </Select>
        <Button variant='contained' onClick={sendBalance}>Send</Button>

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
        />
      </div>
    </>
  );
};

export default Casinos;