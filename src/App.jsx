import { useState } from 'react'
import {Navigate, Routes, Route} from 'react-router-dom'
import './App.css'
import {get, endPoints } from './utilities/api';
import { routes } from './utilities/routes';
import axios from 'axios';
import TopNavbar  from './components/navbar';
import Topbar from './components/navbar';
import { AuthProvider, AuthContext } from './utilities/auth';


function App() {
  const [count, setCount] = useState(0)
    // get(endPoints['REDIRECT'], {})
    // axios.get('http://localhost:2000/redirect').then((res)=>console.log(res.data ));
    
  return (
    <>
    <AuthProvider>
      <Routes>
        <Route path={routes.LOGIN} element={<Topbar />} />
      </Routes>
    </AuthProvider>
    </>
  )
}

export default App
