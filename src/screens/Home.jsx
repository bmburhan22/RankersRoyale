import React, { useEffect, useState } from 'react';
import { AppBar, Link, Box, Button, Container, IconButton, Paper, Slide, Toolbar, Typography } from '@mui/material';

import { Menu } from '@mui/icons-material';
import Casinos from './Casinos';
import { useSearchParams } from 'react-router-dom';
import Carousel from 'react-spring-3d-carousel';
import { config } from 'react-spring';
import { useAuth } from '../utils/auth';
import { ROUTES } from '../../utils/routes';
import './styles.css';
const casinoIds = ['500casino', 'razed'];

// <Box sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center', gap: { sm: 10, md: 20 }, paddingBlock: 20, paddingInline: 20, flexWrap: 'wrap', flexDirection: { sm: 'column', md: 'row' } }}>

const bg = ['teal', 'blue', 'orange']
const Home = () => {
  const [params, setParams] = useSearchParams();
  const casinoId = params.get('casino_id');
  const [slide, setSlide] = useState();
  const [casinoUser, setCasinoUser] = useState();

  const { post, get, casinoUserIds } = useAuth();
  useEffect(
    () => {
      if (!casinoIds.includes(casinoId)) setParams();
      setSlide([null, ...casinoIds].indexOf(casinoId))
    }
    , [casinoId])
  useEffect(() => {
    setCasinoUser(casinoUserIds?.[casinoId]);
  }, [casinoId, casinoUserIds]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 1, width: 1, alignItems: 'center', overflow:'hidden', bgcolor: 'tomato' }} >
      
      <AppBar position='static'><Toolbar>
        <Button variant='contained' href={API_URL + ROUTES.LOGIN}>Login</Button>
      </Toolbar></AppBar>
      <Box sx={{ width: 1  , height: 1, py: 1 }}>

        <Carousel
          animationConfig={config.stiff}
          offsetRadius={1}
          goToSlide={slide}
          slides={[null, ...casinoIds].map((cid, i) => ({
            onClick: () => setParams(!cid ? {} : { casino_id: cid }),
            key: i, content:
              <Casinos key={i} setCasinoUser={setCasinoUser} casinoUser={casinoUser} post={post} get={get} focused={casinoId == cid} casinoId={cid} />
          }))}
          offsetFn={(offset) => {
            if (offset === 0) {
              return {
                opacity: 1,
                transform: "translateY(-50%) translateX(-50%) scale(1)",
                left: "50%",
              };
            }

            const isLeft = offset < 0;

            return {
              opacity: 0.9,
              transform: isLeft
                ? "translateY(-50%) translateX(30%) scale(0.9)" // For elements on the left
                : "translateY(-50%) translateX(-130%) scale(0.9)", // For elements on the right
            };
          }}
        />
      </Box>
    </Box>
  );
};

export default Home;