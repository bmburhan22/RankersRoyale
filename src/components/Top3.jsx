import { Typography, Paper } from "@mui/material";
import casinoIds from '../config/casinoIds';
const Top3= ({ cu}) => <Paper sx={{ width: 160, height: 280, p: 1 }}>
    <img width="100%" src={cu?.displayAvatarURL} />
    <Typography variant='h3'>{cu?.rank}</Typography>
    <Typography variant='h5'>{casinoIds.includes(cu?.casino_id) ? cu?.casino_user_id : cu?.username}</Typography>
    <Typography variant='h5'>${cu?.wager}</Typography>
    <Typography variant='h5'>${cu?.reward}</Typography>
</Paper>
export default Top3;