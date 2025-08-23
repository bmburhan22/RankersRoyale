import React from 'react';
import CasinoBase from '../components/CasinoBase';

const Casinos = ({ focused, casinoId }) => {
  return (
    <CasinoBase
      focused={focused}
      casinoId={casinoId}
      showTop3={true}
      showLeaderboard={true}
      showUserInput={true}
      showWithdraw={true}
    />
  );
};

export default Casinos;