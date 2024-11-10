import { Typography, Paper, Box } from "@mui/material";
import casinoIds from '../config/casinoIds';
const Top3 = ({ cu }) => <Paper sx={{ width: 120, height: 180, p: 1 }}>
    <Box position={'relative'}>
        <img width="100%" src={cu?.displayAvatarURL} />
        <Typography sx={{ top: 0, left: 0, position: 'absolute' }} variant='h3'>{cu?.rank}</Typography>
    </Box>
    <Typography >{casinoIds.includes(cu?.casino_id) ? cu?.casino_user_id : cu?.username}</Typography>
    <Typography >${cu?.wager}</Typography>
    <Typography >${cu?.reward}</Typography>
</Paper>
export default Top3;