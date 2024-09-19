import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import ROUTES from '../../utils/routes';
import { CssBaseline, Box, TextField, Button, Divider, Select, MenuItem, InputLabel } from '@mui/material';

import { Row, Col, Container, FormControl } from 'react-bootstrap';
import { DataGrid, GridActionsCellItem, GridAddIcon } from '@mui/x-data-grid';

const Casinos = () => {
  const CASINO_OBJ = { bet1: null, '500casino': null };

  const { post, get } = useAuth();
  // const { pathname } = useLocation();
  const [inputData, setInputData] = useState(CASINO_OBJ);
  // const [casinoData, setCasinoData] = useState(CASINO_OBJ);
  // const [members, setMembers] = useState([]);
  const [leaderBoard, setLeaderboard] = useState({ total: {}, casinos: {} });
  const [amount, setAmount] = useState(0);
  const [balanceType, setBalanceType] = useState('usdt');
  const [casinoId, setCasinoId] = useState('500casino');
  const [casinoWallets,setCasinoWallets]=useState([]);
  const [items, setItems] = useState([]);
  const getShopItems=async()=>await get(ROUTES.SHOP).then(r=>{setItems(r.data.items); setCasinoWallets(r.data.casinoWallets)});
  const getLeadboard = async () => {
    const res = await get(ROUTES.CASINOS);
    if (res.status != 200) { setLeaderboard({ total: {}, casinos: {} }); return; }
    setLeaderboard(res.data);
  }
  // const getCasinoMembers = async () => {
  //   const res = await get(ROUTES.MEMBERS);
  //   if (res.status != 200) { setMembers([]); return; }
  //   setMembers(res.data.casino_user_ids);
  // }

  const setCasinoUserId = (casinoUserId) => post(ROUTES.CASINOS, casinoUserId);
  // const getCasinoUserId = async () => {
  //   const res = await get(ROUTES.CASINOS);
  //   console.log({ st: res.status, ob: res.data });

  //   if (res.status != 200) { setCasinoData(CASINO_OBJ); return; }
  //   setCasinoData(
  //     res.data.user_casino?.reduce((acc, rec) => {
  //       acc[rec.casino_id] = rec.casino_user_ids;
  //       return acc;
  //     }, {}))
  // }

  const sendBalance = async () => await post(ROUTES.REDEEM, { amount, balanceType, casinoId }).catch(alert);
  const redeemItem = async ({item_id,minAmount, maxAmount}) => await post(ROUTES.BUY, { item_id, casinoId,balanceType }).catch(alert);

  useEffect(() => {
    // getCasinoUserId();
    // getCasinoMembers();
    getLeadboard();
    getShopItems();
  }, []);
  return (
    <>

      <CssBaseline />
      <Navbar />
      <div style={{marginTop:100}}>
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
        {

          Object.entries(leaderBoard.casinos).map(
            ([casino_id, casinoData]) =>
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

              </>
          )
        }

        <Row>
          <Col>


            <TextField label='Amount' type='number' variant='outlined' value={amount} onChange={({ target: { value } }) => setAmount(value)} ></TextField>
            <Select label='Currency' variant='outlined' value={balanceType} onChange={({ target: { value } }) => setBalanceType(value)} >
            {leaderBoard?.casinos?.[casinoId]?.currencies?.map(curr=><MenuItem value={curr}>{curr}</MenuItem>)}
            </Select>
            <Select label='Destination wallet' variant='outlined'  value={casinoId} onChange={({ target: { value } }) => setCasinoId(value)} >
         {casinoWallets.map(cw=><MenuItem value={cw}>{cw}</MenuItem>)}
            </Select>
            <Button variant='contained' onClick={sendBalance}>Send</Button>
{Object.entries(leaderBoard.casinos).map (([casinoId, casinoData])=> <Row>
<TextField label={casinoId+ ' username'} variant='outlined'onChange={e => setInputData(v => { return { ...v, [casinoId]: e.target.value } })} />
<Button variant='contained' onClick={() => setCasinoUserId({ casino_id: casinoId, casino_user_id: inputData[casinoId] })}>Submit</Button>
</Row>
)
          }          </Col>
          <Col>
            {/* <h3>{casinoData?.bet1}</h3>
            <TextField label='bet1 username' variant='outlined'
              onChange={e => setInputData(v => { return { ...v, bet1: e.target.value } })} />
            <Button variant='contained' onClick={() => setCasinoUserId({ casino_id: 'bet1', casino_user_id: inputData.bet1 })}>Submit</Button> */}
          </Col>
        </Row>

        <DataGrid  getRowId={({ item_id }) => item_id}
        rows={items}
        columns={[
          { field: 'item_id' },
          { field: 'price',  },
          { field: 'minAmount', },
          { field: 'maxAmount', },
          { field: 'desc',  },
          {
            field: 'actions',
            type: 'actions',
            getActions: (params) => [
              <GridActionsCellItem icon={<GridAddIcon/>} onClick={()=>redeemItem( params.row)} label="Redeem" />]
            },
        ]}
      />
      </div>
    </>
  );
};

export default Casinos;