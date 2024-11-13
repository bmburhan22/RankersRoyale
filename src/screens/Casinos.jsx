import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/auth';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../utils/routes';
import Top3 from '../components/Top3';
import { Container, Tab, Tabs, CssBaseline, Box, TextField, Button, Divider, Select, MenuItem, InputLabel, setRef, Paper, Typography, Popover, Table } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridAddIcon } from '@mui/x-data-grid';
 
import { green, grey, teal } from '@mui/material/colors';
import { ld } from '../config/constants';

import { Input, InputNumber } from 'antd';
const bg = {
  '500casino': teal[400],
  'razed': grey[400],
  null: green[400],

}

const casinoIds = ['500casino', 'razed'];
const Casinos = ({ get, post, focused, casinoUser, setCasinoUser, casinoId }) => {

  const [leaderBoard, setLeaderboard] = useState();
  const [amount, setAmount] = useState(0);

  const [casinoUserId, setCasinoUserId] = useState();
  const { total_reward, user_id } = casinoUser ?? {};

  const getLeadboard = async () => setLeaderboard(
    await get(ROUTES.CASINOS + (!casinoId ? '' : `?casino_id=${casinoId}`)).then(({ data }) =>
    !casinoId ? data.total : data.casinos[casinoId]
    // !casinoId ? ld.total : ld.casinos[casinoId] //TODO: constant lederboard
    )

  );


  const updateCasinoUserId = async () => await post(ROUTES.CASINOS, { casino_id: casinoId, casino_user_id: casinoUserId }).catch(alert)
    .then(r => {
      if (!r.data.err) {
        setCasinoUser(r?.data?.user_casino); setLeaderboard(
          {
            ...r.data?.leaderboard,
            // leaderboard:ld.casinos[casinoId].leaderboard //TODO: constant lederboard

          }
        );
      }
    });

  const sendBalance = async () => await post(ROUTES.CLAIM_REWARD, { amount, casinoId }).catch(alert)
    .then(r => { if (r.data.err) { alert(r.data.err); return; } setCasinoUser(cu => ({ ...cu, total_reward: r?.data?.balance })); });


  useEffect(() => {
    if (focused) getLeadboard();
  }, [focused, casinoId]);
  return (

    <Paper elevation={focused ? 24 : 0} sx={{
      // filter: focused?null:"blur(10px)",
      scrollbarWidth: 'none',
      width: 1,
      height: 1, overflow: 'auto', bgcolor: bg[casinoId],
      alignContent: 'center',
      justifyItems: 'center',
    }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', flexDirection: { xs: 'column', xl: 'row' } }}>

        <Typography variant='h5' component='a' // href={leaderBoard?.referralLink}
        >{casinoId || 'Total'} Leaderboard</Typography>

        {!casinoIds.includes(casinoId) ? <></> :
          <Input addonBefore={casinoUser?.casino_user_id}
            value={casinoUserId} onChange={({ target: { value } }) => setCasinoUserId(value)}
            addonAfter={<Button variant='contained' onClick={updateCasinoUserId}>Submit</Button>}
          ></Input>

        }
        {!leaderBoard?.allowWithdraw ? <></> :
          <InputNumber prefix='$' addonBefore={`av: ${total_reward}`}
            addonAfter={<Button sx={{ height: 40 }} variant='contained' onClick={sendBalance}>Send</Button>}
            max={total_reward} min={0} width={40}
            value={amount} onChange={({ target: { value } }) => setAmount(value)}
          ></InputNumber>}

      </Box>


      <Top3 key={1} cu={leaderBoard?.leaderboard?.[0]} />

      <Box sx={{
        display: 'flex', flexWrap: 'wrap', flexDirection: { md: 'row', xs: 'column' }, justifyContent: 'center', alignItems: 'center', gap: 5, paddingBlock: 5, paddingInline: 5
      }}>
        {leaderBoard?.leaderboard?.slice(1, 3).map(
          cu => <Top3 key={cu?.rank} cu={cu} />
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
        sx={{
          '& ::-webkit-scrollbar': { display: 'none' },
          border: 0,width:1,
          pointerEvents: 'none',
          '& .MuiDataGrid-columnSeparator': { display: 'none', },

        }} />



    </Paper>

  );
};

export default Casinos;