import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import ROUTES from '../../utils/routes';
import { CssBaseline, Box, TextField, Button, Divider } from '@mui/material';

import { Row, Col, Container } from 'react-bootstrap';

const Casinos = () => {
  const CASINO_OBJ = { bet1: null, '500casino': null };

  const { post, get } = useAuth();
  const { pathname } = useLocation();
  const [inputData, setInputData] = useState(CASINO_OBJ);
  const [casinoData, setCasinoData] = useState(CASINO_OBJ);
  const [members, setMembers] = useState([]);
  const [lead500Casino, setLead500Casino] = useState([]);

  const getLead500Casino = async () => {
    const res = await get(ROUTES._500CASINOS);
    if (res.status != 200) { setLead500Casino([]); return; }
    setLead500Casino(res.data.results);

  }
  const getCasinoMembers = async () => {
    const res = await get(ROUTES.MEMBERS);
    if (res.status != 200) { setMembers([]); return; }
    setMembers(res.data.casino_user_ids);
  }

  const setCasinoUserId = (casinoUserId) => post(ROUTES.CASINOS, casinoUserId);
  const getCasinoUserId = async () => {
    const res = await get(ROUTES.CASINOS);
    console.log({st:res.status, ob:res.data});
    
    if (res.status != 200) { setCasinoData(CASINO_OBJ); return; }
    setCasinoData(
      res.data.user_casino?.reduce((acc, rec) => {
        acc[rec.casino_id] = rec.casino_user_ids;
        return acc;
      }, {}))
  }


  useEffect(() => {
    getCasinoUserId();
    getCasinoMembers();
    getLead500Casino();
  }, []);
  return (
    // <Box sx={{ display: 'flex', height: '100vh' }}>
    <><CssBaseline />
      <Navbar />
      <h1>CASINOS
        {pathname}
      </h1>
      <Container>

        <Row>
          <Col>
            <h5>

              {JSON.stringify(lead500Casino)}

            </h5>
            <Divider/>
            <br/><br/>
            <h6>

              {JSON.stringify(members)}

            </h6>
            <h3>{casinoData?.['500casino']}</h3>
            <TextField label='500casino username' variant='outlined'
              onChange={e => setInputData(v => { return { ...v, '500casino': e.target.value } })
              } />

            <Button variant='contained' onClick={() => setCasinoUserId({ casino_id: '500casino', casino_user_id: inputData['500casino'] })}>Submit</Button>
          </Col>
          <Col>
            <h3>{casinoData?.bet1}</h3>

            <TextField label='bet1 username' variant='outlined'
              onChange={e => setInputData(v => { return { ...v, bet1: e.target.value } })} />
            <Button variant='contained' onClick={() => setCasinoUserId({ casino_id: 'bet1', casino_user_id: inputData.bet1 })}>Submit</Button>
          </Col>
        </Row>
        <Col>
          {
            <h3></h3>}
        </Col>
      </Container>
      {/* </Box> */}
    </>
  );
};

export default Casinos;