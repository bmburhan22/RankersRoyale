import axios from "axios";
import {url} from '../config/constants';

export const endPoints = {
    AUTH:'/a.txt'
}

export const get = (path, data)=>axios.get(url+path, {data});
export const post = (path, data)=>axios.post(url+path, {data});
        