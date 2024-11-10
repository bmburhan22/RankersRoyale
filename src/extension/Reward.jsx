import {   useState } from 'react';
import { Button, Paper,  } from '@mui/material';
import { InputNumber } from 'antd';
import { green, grey, teal } from '@mui/material/colors';
const bg = {
  '500casino': teal[400],
  'razed': grey[400],
  null: green[400],

}
const Reward = ({ casinoUser, setCasinoUserIds }) => {
  const { casino_id,total_reward} = casinoUser??{};
  const [amount, setAmount] = useState(0);
  const sendBalance = async () => await post(ROUTES.CLAIM_REWARD, { amount, casinoId:casino_id }).catch(alert)
    .then(r => {
      if (r.data.err) { alert(r.data.err); return; }
      setCasinoUserIds(cuids => { cuids[casino_id].total_reward = r?.data?.balance; return cuids; });
    });
    
  return (
    <Paper elevation={24} sx={{
      scrollbarWidth: 'none', overflow: 'auto', bgcolor: bg[casino_id],
      alignContent: 'center', justifyItems: 'center',
    }}>

      <InputNumber prefix='$' addonBefore={`av: ${total_reward}`}
        addonAfter={<Button sx={{ height: 40 }} variant='contained' onClick={sendBalance}>Send</Button>}
        max={total_reward} min={0} width={40}
        value={amount} onChange={({ target: { value } }) => setAmount(value)}
      ></InputNumber>
    </Paper>

  );
};

export default Reward;