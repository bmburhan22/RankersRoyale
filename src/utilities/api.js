import axios from "axios";
export const endPoints = {
    REDIRECT:'/auth/discord/redirect',
    AUTH:'/auth/discord/login',
}

export const API_URL = import.meta.env.VITE_API_URL;

export const get = (path, data)=>axios.get(URL+path, {data});
export const post = (path, data)=>axios.post(URL+path, {data});
