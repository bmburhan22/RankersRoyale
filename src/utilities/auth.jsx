// /* FOR REFERENCE */
// import { createContext, useContext, useEffect, useRef, useState } from "react"
// import { RefreshControl } from "react-native";
// import axios from 'axios';
// import { newItemDefault, topBarHeight } from "../config/constants";
// import { url } from "../config/constants";

// export const Auth = createContext();

// export const useAuth = () => useContext(Auth);

// async function updateItem(item) {
//     const newItem = await axios.post(url + '/items', item).then(res => res.data);

//     if (item.image_uri) {
//         const form = new FormData();
//         form.append('sn', newItem.sn);
//         form.append('image', { uri: item.image_uri, type: 'image/jpeg', name: 'image' });

//         await axios.post(url + '/items/image', form, {
//             headers: { 'Content-Type': 'multipart/form-data' }
//         }).catch(err => console.log(err));
//     }
//     return newItem;
// }

// async function updateQty(item) {
//     await axios.post(url + '/quantities', item);
// }

// export default function ({ children }) {
//     const sheetRef = useRef();
//     const [orders, setOrders] = useState([]);

//     const fetchOrders = () => {
//         axios.get(url + '/orders').then(({ data }) =>setOrders(data));

//     }

//     const [searchTerm, setSearchTerm] = useState("");
//     const [itemToUpdate, setItemToUpdate] = useState(newItemDefault);
//     const [items, setItems] = useState([]);
//     const [next, setNext] = useState('/items');
//     const [refreshing, setRefreshing] = useState(true);

//     const showUpdate = (item = newItemDefault) => { setItemToUpdate(item); sheetRef.current?.snapToIndex(1); };
//     const refreshItems = async () => { setNext('/items'); setItems([]); fetchOrders();}
//     const fetchItems = async () => {
//         if (!next) return;
//         setRefreshing(true);
//         await axios.get(url + next)
//             .then(({ data: { items, next } }) => {
//                 setItems(prev => [...prev, ...items]);
//                 setNext(next);
//             })
//             .catch(() => { console.log("API ERR"); }).finally(() => console.log('fetched'))
//         setRefreshing(false);
//     };
//     useEffect(()=>{fetchOrders();}, []);

//     const refreshControl = <RefreshControl onRefresh={refreshItems} refreshing={refreshing} progressViewOffset={topBarHeight} />;
//     return <ItemsContext.Provider value={{ searchTerm, setSearchTerm, items, setItems, showUpdate,orders,setOrders, setRefreshing, fetchItems, itemToUpdate, setItemToUpdate, updateItem, updateQty, sheetRef, refreshing, refreshControl, refreshItems, next }} children={children} />
// }

import React, { createContext, useState, useEffect } from 'react';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [auth, setAuth] = useState({
    isAuthenticated: false,
    token: null,
    avatar: '', 
  });
  useEffect(() => {
    const token = localStorage.getItem('token');
    const profilePhoto = localStorage.getItem('avatar');
    if (token) {
      setAuth({ isAuthenticated: true, token, profilePhoto });
    }
  }, []);

  const login = (token, profilePhoto) => {
    localStorage.setItem('token', token);
    localStorage.setItem('avatar', avatar); 
    setAuth({ isAuthenticated: true, token, profilePhoto });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('avatar'); 
    setAuth({ isAuthenticated: false, token: null, avatar: '' });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 

export default AuthProvider;
