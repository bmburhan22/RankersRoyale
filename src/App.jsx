import { useState } from 'react'
import { Navigate, Routes, Route, BrowserRouter } from 'react-router-dom'

import { AuthProvider } from './utils/auth';
import {ROUTES} from '../utils/routes';
import { BrowseGalleryTwoTone } from '@mui/icons-material';
import Home from './screens/Home';
import Casinos from './screens/Casinos';
import AdminHome from './screens/AdminHome';

function App() {
  
  return (
    <BrowserRouter >
    <AuthProvider>
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.CASINOS_PAGE} element={<Casinos />} />
          <Route path={ROUTES.ADMIN_HOME} element={<AdminHome />} />
        </Routes>
    </AuthProvider>
      </BrowserRouter>
  );
}

export default App
