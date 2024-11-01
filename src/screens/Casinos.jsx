import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/auth';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../utils/routes';
import { Container, Tab, Tabs, CssBaseline, Box, TextField, Button, Divider, Select, MenuItem, InputLabel, setRef } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridAddIcon } from '@mui/x-data-grid';
import bg1 from '../assets/bg1.png';
import bg2 from '../assets/bg2.png';
import bg3 from '../assets/bg3.png';
import bgvid from '../assets/bgvid.mp4';
import { green, grey, teal } from '@mui/material/colors';
const images = {
  '500casino':bg1,
  'razed':bg2,
  null:bg3,
}
const bg = {
  '500casino':teal[400],
  'razed':grey[400],
  null:green[400],

}
const casinoIds = ['500casino','razed'];
const Casinos = ({get,post, focused, casinoUser, casinoId}) => {
  console.log({focused,casinoId});
  
  const [leaderBoard, setLeaderboard] = useState({});
  const [amount, setAmount] = useState(0);
  const [balanceType, setBalanceType] = useState('usdt');

  const [casinoUserId, setCasinoUserId] = useState();
  const { total_reward, user_id } = casinoUser ?? {};

  const getLeadboard = async () => setLeaderboard((await get(ROUTES.CASINOS + (!casinoId ? '' : `?casino_id=${casinoId}`)))?.data);
  

  const updateCasinoUserId = async () => await post(ROUTES.CASINOS, { casino_id: casinoId, casino_user_id: casinoUserId }).catch(alert)
    .then(r => { if (!r.data.err) { setCasinoUser(r?.data?.user_casino); setLeaderboard(r.data?.leaderboard); } });

  const sendBalance = async () => await post(ROUTES.CLAIM_REWARD, { amount, balanceType, casinoId }).catch(alert)
    .then(r => { if (r.data.err) {alert(r.data.err); return;} setCasinoUser(cu => ({ ...cu, total_reward: r?.data?.balance })); }); 


  useEffect(() => {
   if (focused) getLeadboard();
  }, [focused,casinoId]); 
  return (

<Box sx={{  height:1, width:{xs:'80vw',md:'90vw'}, overflowY:'auto',  bgcolor:bg[casinoId], 
       alignContent:'center'
}}>
            <h4>{casinoId || 'Total'} Leaderboard</h4>
          {!casinoIds.includes(casinoId) ? <></> : <div>

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
          }         
          <DataGrid sx={{}} getRowClassName={({ row }) => row.user_id == user_id ? 'highlight-row' : ''} getRowId={({ user_id, casino_id }) => user_id + '-' + casino_id}
            columns={[
              { field: 'user_id' },
              { field: 'username' },
              { field: 'casino_user_id' },
              { field: 'casino_id' },

              { field: 'reward' },
              { field: 'revenue' },

              { field: 'total_revenue' },
              { field: 'total_reward' },

            ]
              .filter(({ field }) => casinoIds.includes(casinoId) ? true : ['reward','revenue', 'wager', 'user_id', 'username'].includes(field))
            }
            rows={leaderBoard?.leaderboard}
          />


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
    </Box> 

  );
};

export default Casinos;