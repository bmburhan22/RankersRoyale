import { useState } from 'react'
import './App.css'
import { endPoints, API_URL } from './utilities/api';
function App() {
const [auth, setAuth] = useState(false);
    
  return (
    <>
        <a href={API_URL+endPoints['AUTH']}>
          Discord Login
        </a>
    </>
  )
}

export default App
