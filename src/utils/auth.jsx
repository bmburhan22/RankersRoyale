import { createContext, useState, useContext, useLayoutEffect } from 'react';
import axios from "axios";
import Cookie from 'js-cookie';
import ROUTES from '../../utils/routes.js';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const get = async (path, data) => {
    const res = await axios.get(API_URL + path,  data ); 
    // console.log({ method: 'get', status: res.status, statusText: res.statusText ,res});
    if (res.status != 200) await validateAuth();
    return res;
  }
  const post = async (path, data) => {
    const res = await axios.post(API_URL + path,  data );
    // console.log({ method: 'post', status: res.status, statusText: res.statusText ,data});

    if (res.status != 200) await validateAuth();
    return res; 
  }
  const [auth, setAuth] = useState(null);
  const navigate = useNavigate();

  useLayoutEffect(() => { validateAuth(); }, []);

  const validateAuth = async () => {
    try {
      const token = Cookie.get('token');
      if (token) {
        const res = await get(ROUTES.ME);
        // console.log({ status: res.status, statusText: res.statusText });
        if (res.status == 200) {
          setAuth({
            token, isAuth: true,
            ...res.data
          });
          return;
        }
      } 
    } catch (e) {
      console.error('Unable to fetch user', e);
    }
    logout();
  }

  const logout = () => {
    // navigate(ROUTES.HOME, { replace: true });
    setAuth({ isAuth: false })
    Cookie.remove('token');

  }

  return (
    <AuthContext.Provider value={{ get, post, validateAuth, logout, ...auth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
