import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import Casinos from './Casinos';
import { useSearchParams } from 'react-router-dom';
import Carousel from 'react-spring-3d-carousel';
import { config } from 'react-spring';
import Navbar from '../components/Navbar';
import { APP_BAR_HEIGHT, CASINO_DETAILS } from '../config/constants';
import './styles.css';

const casinoIds = CASINO_DETAILS.map(casino => casino.id);

const Home = () => {
  const [params, setParams] = useSearchParams();
  const casinoId = params.get('casino_id');
  const [slide, setSlide] = useState();

  useEffect(
    () => {
      if (!casinoIds.includes(casinoId)) setParams();
      setSlide([null, ...casinoIds].indexOf(casinoId))
    }
    , [casinoId])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 1, width: 1, alignItems: 'center', overflow: 'hidden', bgcolor: '#111827'}} >
      <Navbar />
      
      {/* Add top margin to account for fixed navbar */}
      <Box sx={{ mt: `${APP_BAR_HEIGHT}px`, width: '100%', height: `calc(100vh - ${APP_BAR_HEIGHT}px)` }}>
        <Carousel
          animationConfig={config.stiff}
          offsetRadius={1}
          goToSlide={slide}
          slides={[null, ...casinoIds].map((cid, i) => ({
            onClick: () => setParams(!cid ? {} : { casino_id: cid }),
            key: i, content:
              <Casinos key={i} focused={casinoId == cid} casinoId={cid} />
          }))}
          offsetFn={(offsetFromCenter, index) => {
            const offsetRadius = 1;

            // Default transform logic
            const getDefaultTranslateX = (offsetFromCenter, offsetRadius, index) => {
              const totalPresentables = 2 * offsetRadius + 1;
              const translateXoffset = 50 * (Math.abs(offsetFromCenter) / (offsetRadius + 1));
              let translateX = -50;
          
              if (offsetRadius !== 0) {
                if (index === 0) {
                  translateX = 0;
                } else if (index === totalPresentables - 1) {
                  translateX = -100;
                }
              }
          
              if (offsetFromCenter > 0) {
                translateX += translateXoffset;
              } else if (offsetFromCenter < 0) {
                translateX -= translateXoffset;
              }
              return translateX;
            };
          
            const translateX = getDefaultTranslateX(offsetFromCenter, offsetRadius, index);
            
            return {
              transform: `translateY(-50%) translateX(${translateX}%) scale(${offsetFromCenter?0.7:1})`,
              left: `${offsetRadius === 0 ? 50 : 50 + (offsetFromCenter * 50) / offsetRadius}%`,
              opacity: offsetFromCenter ? 0.2 : 1
            };
          }}
        />
      </Box>
    </Box>
  );
};

export default Home;