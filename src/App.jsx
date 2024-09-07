import { useState } from 'react'
import { Navigate, Routes, Route, BrowserRouter } from 'react-router-dom'
import './App.css'

import { AuthProvider } from './utils/auth';
import ROUTES from '../config/routes';
import { BrowseGalleryTwoTone } from '@mui/icons-material';
import Home from './screens/Home';
import Casinos from './screens/Casinos';

function App() {
  
  return (
    <BrowserRouter >
    <AuthProvider>
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.CASINOS} element={<Casinos />} />
        </Routes>
    </AuthProvider>
      </BrowserRouter>
  );
}

export default App
