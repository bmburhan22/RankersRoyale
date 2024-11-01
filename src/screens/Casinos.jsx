import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/auth';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../utils/routes';
import { Container, Tab, Tabs, CssBaseline, Box, TextField, Button, Divider, Select, MenuItem, InputLabel, setRef, Paper, Typography } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridAddIcon } from '@mui/x-data-grid';
import bg1 from '../assets/bg1.png';
import bg2 from '../assets/bg2.png';
import bg3 from '../assets/bg3.png';
import bgvid from '../assets/bgvid.mp4';
import { green, grey, teal } from '@mui/material/colors';
import {   leaderboard } from '../config/constants';
import './style.css';
const bg = {
  '500casino': teal[400],
  'razed': grey[400],
  null: green[400],

}

const casinoIds = ['500casino', 'razed'];
const Casinos = ({ get, post, focused, casinoUser, setCasinoUser, casinoId }) => {

  const [leaderBoard, setLeaderboard] = useState();
  const [amount, setAmount] = useState(0);
  const [balanceType, setBalanceType] = useState(leaderBoard?.currencies?.[0]);

  const [casinoUserId, setCasinoUserId] = useState();
  const { total_reward, user_id } = casinoUser ?? {};

  const getLeadboard = async () => setLeaderboard({...(await get(ROUTES.CASINOS + (!casinoId ? '' : `?casino_id=${casinoId}`)))?.data, leaderboard} );


  const updateCasinoUserId = async () => await post(ROUTES.CASINOS, { casino_id: casinoId, casino_user_id: casinoUserId }).catch(alert)
    .then(r => { if (!r.data.err) { setCasinoUser(r?.data?.user_casino); setLeaderboard(r.data?.leaderboard); } });

  const sendBalance = async () => await post(ROUTES.CLAIM_REWARD, { amount, balanceType, casinoId }).catch(alert)
    .then(r => { if (r.data.err) { alert(r.data.err); return; } setCasinoUser(cu => ({ ...cu, total_reward: r?.data?.balance })); });


  useEffect(() => {
     if (focused) getLeadboard();
  }, [focused, casinoId]);
  return (
    //  <Box sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center', gap: { sm: 10, md: 20 }, paddingBlock: 20, paddingInline: 20, flexWrap: 'wrap', flexDirection: { sm: 'column', md: 'row' } }}>
    // </Box>
    <Box sx={{
      height: 1, width: { xs: '80vw', md: '90vw' },p:1, overflowY: 'auto', bgcolor: bg[casinoId],
      alignContent: 'center'
    }}>
      <Box display='flex' flexDirection='row' justifyContent='space-between'>
        <h4>{casinoId || 'Total'} Leaderboard</h4>
        {!leaderBoard?.allowWithdraw?
        <></>:<Box display='flex' flexDirection='row'>

          <TextField label={`Amount (available: ${total_reward})`} type='number' variant='outlined'
            slotProps={{ htmlInput: { max: total_reward, min: 0 } }} value={amount}
            onChange={({ target: { value } }) => setAmount(value)} ></TextField>
          <Select label='Currency' variant='outlined' value={balanceType} onChange={({ target: { value } }) => setBalanceType(value)} >
            {leaderBoard?.currencies?.map(curr => <MenuItem value={curr}>{curr}</MenuItem>)}
          </Select>
          <Button variant='contained' onClick={sendBalance}>Send</Button>
        </Box>}
      </Box>

      {
        // !casinoIds.includes(casinoId) ? <></> : <div> referralLink: {leaderBoard.referralLink}<br />casinoUserId: {casinoUser?.casino_user_id}<br />
        //   <TextField label={casinoId + ' username'} variant='outlined' value={casinoUserId} onChange={({ target: { value } }) => setCasinoUserId(value)} />
        //   <Button variant='contained' onClick={updateCasinoUserId}>Submit</Button>
        // </div>
      }
      <Box sx={{ 
        display: 'flex', flexDirection: { md: 'row', xs: 'column' }, justifyContent: 'center', alignItems: 'center', gap: { xs: 5, md: 10 }, paddingBlock: { xs: 5, md: 10 }
      }}>
        {leaderBoard?.leaderboard?.slice(0, 3).map(
          cu => <Paper sx={{ width: 200, height: 400, p: 1 }}><img width="100%" src={cu?.displayAvatarURL} />
            <Typography variant='h1'>{cu?.rank}</Typography>
            <Typography variant='h5'>{casinoIds.includes(casinoId)? cu?.casino_user_id: cu?.username}</Typography>
            <Typography variant='h5'>${cu?.wager}</Typography>
          </Paper>
        )}
      </Box>
      <DataGrid  autoHeight  getRowClassName={({ row }) => row.user_id == user_id ? 'highlight-row' : ''} getRowId={({ rank }) => rank}
        columns={[
          { field: 'rank',  },
          {field:'displayAvatarURL', type:'image',renderCell: (params) => <img src={params.value} />
          },
          { field: 'username' },
          { field: 'user_id' },
          { field: 'casino_user_id' },
          { field: 'revenue' },
          { field: 'wager' },

        ]
          .filter(({ field }) => casinoIds.includes(casinoId) ? true : ['reward', 'revenue', 'wager', 'user_id', 'username'].includes(field))
        }
        rows={leaderBoard?.leaderboard?.slice(3,20)}
      />



    </Box>

  );
};

export default Casinos;