import { createContext, useState, useContext, useLayoutEffect } from 'react';
import axios from "axios";
axios.defaults.withCredentials = true;
import { ROUTES } from '../../utils/routes.js';

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const get = async (path, data) => {
    const res = await axios.get(API_URL + path, { data });
    if (res.status != 200) await validateAuth();
    return res;
  }
  const post = async (path, data) => {
    const res = await axios.post(API_URL + path, data);

    if (res.status != 200) await validateAuth();
    return res;
  }
  const del = async (path, data) => {

    const res = await axios.delete(API_URL + path, { data });

    if (res.status != 200) await validateAuth();
    return res;
  }
  const [auth, setAuth] = useState(null);

  useLayoutEffect(() => { validateAuth(); }, []);

  const validateAuth = async () => {
    try {
      await chrome.cookies?.get({ name: 'token', url: API_URL }).then(r => document.cookie='token='+r.value);
      // const token = Cookie.get('token');
      // if (token) {
      const res = await get(ROUTES.ME);
      if (!res.data.err && res.status == 200) {
        setAuth({
          isAuth: true,
          ...res.data
        });
        return;
        // }
      }
    } catch (e) {
      console.error('Unable to fetch user', e);
    }
    logout();
  }

  const logout = () => {
    // navigate(ROUTES.HOME, { replace: true });
    setAuth({ isAuth: false, isAdmin: false })
    cookieStore.delete('token');
    chrome.cookies?.remove({url:API_URL, name:'token'});
    
  }

  return (
    <AuthContext.Provider value={{ get, post, del, validateAuth, logout, ...auth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
