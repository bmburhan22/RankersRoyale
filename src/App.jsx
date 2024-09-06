import { useState } from 'react'
import {Navigate, Routes, Route} from 'react-router-dom'
import './App.css'

import Topbar from './components/navbar';
import { AuthProvider } from './utilities/auth';
import  ROUTES  from '../config/routes';

function App() {
  return (
    <>
    <AuthProvider>
      <Routes>
        <Route path={ROUTES.HOME} element={<Topbar />} />

        {/* {auth.isAuthenticated ? (
          <Route path="/dashboard" element={<Dashboard />} />
        ) : (
          <Route path={routes.LOGIN} element={<Navigate to="/login" />} />
        )}
         */}
      </Routes>
    </AuthProvider>
    </>
  )
}

export default App
