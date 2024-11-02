import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/auth';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../utils/routes';
import { Container, Tab, Tabs, CssBaseline, Box, TextField, Button, Divider, Select, MenuItem, InputLabel, setRef, Paper, Typography, Popover, Table } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridAddIcon } from '@mui/x-data-grid';
import bg1 from '../assets/bg1.png';
import bg2 from '../assets/bg2.png';
import bg3 from '../assets/bg3.png';
import bgvid from '../assets/bgvid.mp4';
import { green, grey, teal } from '@mui/material/colors';
import { leaderboard } from '../config/constants';
import './style.css';
const bg = {
  '500casino': teal[400],
  'razed': grey[400],
  null: green[400],

}

//  <Box sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center', gap: { sm: 10, md: 20 }, paddingBlock: 20, paddingInline: 20, flexWrap: 'wrap', flexDirection: { sm: 'column', md: 'row' } }}>
const casinoIds = ['500casino', 'razed'];
const Casinos = ({ get, post, focused, casinoUser, setCasinoUser, casinoId }) => {

  const [leaderBoard, setLeaderboard] = useState();
  const [amount, setAmount] = useState(0);
  const [balanceType, setBalanceType] = useState();

  const [casinoUserId, setCasinoUserId] = useState();
  const { total_reward, user_id } = casinoUser ?? {};

  const getLeadboard = async () => setLeaderboard({
    ...(await get(ROUTES.CASINOS + (!casinoId ? '' : `?casino_id=${casinoId}`)))?.data,
    leaderboard //TODO: constant lederboard

  });


  const updateCasinoUserId = async () => await post(ROUTES.CASINOS, { casino_id: casinoId, casino_user_id: casinoUserId }).catch(alert)
    .then(r => {
      if (!r.data.err) {
        setCasinoUser(r?.data?.user_casino); setLeaderboard(
          {
            ...r.data?.leaderboard,
            leaderboard //TODO: constant lederboard

          }
        );
      }
    });

  const sendBalance = async () => await post(ROUTES.CLAIM_REWARD, { amount, balanceType, casinoId }).catch(alert)
    .then(r => { if (r.data.err) { alert(r.data.err); return; } setCasinoUser(cu => ({ ...cu, total_reward: r?.data?.balance })); });


  useEffect(() => {
    if (focused) getLeadboard();
  }, [focused, casinoId]);
  return (

    <Paper elevation={focused ? 24 : 0} sx={{
      // filter: focused?null:"blur(10px)",
      scrollbarWidth: 'none',
      width: '30vw',
      height: 1, overflow: 'auto', bgcolor: bg[casinoId],
      alignContent: 'center'
    }}>
      <Box sx={{ display: 'flex', flexWrap:'wrap', flexDirection: { xs: 'column', xl: 'row' } }}>

        <Typography variant='h5' component='a' // href={leaderBoard?.referralLink}
        >{casinoId || 'Total'} Leaderboard</Typography>

        {!casinoIds.includes(casinoId) ? <></> : <div> casinoUserId: {casinoUser?.casino_user_id}<br />
          <TextField label={casinoId + ' username'} variant='outlined' value={casinoUserId} onChange={({ target: { value } }) => setCasinoUserId(value)} />
          <Button variant='contained' onClick={updateCasinoUserId}>Submit</Button>
        </div>}
        {!leaderBoard?.allowWithdraw ?
          <></> : <Box display='flex' flexDirection='row'>

            <TextField sx={{ minWidth: 60 }} label={`Amount (available: ${total_reward})`} type='number' variant='outlined'
              slotProps={{ htmlInput: { max: total_reward, min: 0 } }} value={amount}
              onChange={({ target: { value } }) => setAmount(value)} ></TextField>
            <Select sx={{ height: 60 }} defaultValue={leaderBoard?.currencies?.[0]} label='Currency' variant='outlined' value={balanceType} onChange={({ target: { value } }) => setBalanceType(value)} >
              {leaderBoard?.currencies?.map(curr => <MenuItem key={curr} value={curr}>{curr}</MenuItem>)}
            </Select>
            <Button sx={{ height: 40 }} variant='contained' onClick={sendBalance}>Send</Button>
          </Box>}
      </Box>




      <Box sx={{
        display: 'flex',flexWrap:'wrap', flexDirection: { md: 'row', xs: 'column' }, justifyContent: 'center', alignItems: 'center', gap: 5, paddingBlock: 5, paddingInline: 5
      }}>
        {leaderBoard?.leaderboard?.slice(0, 3).map(
          cu => <Paper key={cu?.rank} sx={{ width:160, height: 280, p: 1 }}>
            <img width="100%" src={cu?.displayAvatarURL} />
            <Typography variant='h3'>{cu?.rank}</Typography>
            <Typography variant='h5'>{casinoIds.includes(casinoId) ? cu?.casino_user_id : cu?.username}</Typography>
            <Typography variant='h5'>${cu?.wager}</Typography>
          </Paper>
        )}
      </Box>


      <DataGrid autoHeight getRowClassName={({ row }) => row.user_id == user_id ? 'highlight-row' : ''} getRowId={({ rank }) => rank}
        columns={[
          { field: 'rank' },
          { field: 'displayAvatarURL', type: 'image', renderCell: (params) => <img src={params.value} /> },
          { field: 'username' },
          { field: 'user_id' },
          { field: 'casino_user_id' },
          { field: 'revenue' },
          { field: 'wager' },

        ]
          .filter(({ field }) => casinoIds.includes(casinoId) ? true : ['displayAvatarURL', 'rank', 'reward', 'revenue', 'wager', 'user_id', 'username'].includes(field))
        }

        rows={leaderBoard?.leaderboard?.slice(0, 20)}
 
        hideFooter
        autoPageSize
        rowSpacingType='margin'
        sx={{
          
            border: 0,
          pointerEvents: 'none',
          '& .MuiDataGrid-columnSeparator': {
            display: 'none',
          },

        }} />



    </Paper>

  );
};

export default Casinos;