import React, { useContext, useLayoutEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import ROUTES from '../../config/routes';
import { CssBaseline, Box, TextField, Button } from '@mui/material';

import {Row,Col,Container} from 'react-bootstrap';

const Casinos = () => {
  const { post } = useAuth();
  const { pathname } = useLocation();
  const [inputData, setInputData] = useState({'500casino':null ,  bet1:null });
  const setCasinoUsername = (casinoUsername) => post(ROUTES.API_CASINOS, casinoUsername);
  

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
            <TextField label='500casino username' variant='outlined' 
            onChange={e => setInputData(v=>{return {...v, '500casino':e.target.value}} )  
                      } />
            <Button variant='contained' onClick={() => setCasinoUsername({casino_id:'500casino', casino_username:inputData['500casino']})}>Submit</Button>
          </Col>
          <Col>
            <TextField label='bet1 username' variant='outlined'
            onChange={e => setInputData(v=>{return {...v, bet1:e.target.value}} )} />
            <Button variant='contained' onClick={() => setCasinoUsername({casino_id:'bet1',casino_username:inputData.bet1 })}>Submit</Button>
          </Col>
        </Row>
      </Container>
      {/* </Box> */}
</>
  );
};

export default Casinos;