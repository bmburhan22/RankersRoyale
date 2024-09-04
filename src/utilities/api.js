import axios from "axios";
export const endPoints = {
    REDIRECT:'/auth/discord/redirect',
    AUTH:'/auth/discord/login',
}


export const get = (path, data)=>axios.get(API_URL+path, {data});
export const post = (path, data)=>axios.post(API_URL+path, {data});
