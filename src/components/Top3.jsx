import { Typography, Paper, Box } from "@mui/material";
const Top3 = ({ cu, isTotal }) => <Paper sx={{ width: 120, height: 180, p: 1 }}>
    <Box position={'relative'}>
        <img width="100%" src={cu?.displayAvatarURL} />
        <Typography sx={{ top: 0, left: 0, position: 'absolute' }} variant='h3'>{cu?.rank}</Typography>
    </Box>
    <Typography >{isTotal ? cu?.username : cu?.casino_user_id}</Typography>
    <Typography >${cu?.wager}</Typography>
    <Typography >${cu?.reward}</Typography>
</Paper>
export default Top3;