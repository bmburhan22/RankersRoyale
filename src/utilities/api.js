import axios from "axios";
export const endPoints = {
    AUTH:'/a.txt',
    REDIRECT:'/redirect',
}

export const get = (path, data)=>axios.get(URL+path, {data});
export const post = (path, data)=>axios.post(URL+path, {data});
        