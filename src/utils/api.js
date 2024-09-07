import axios from "axios";
export const get = async (path, data)=>await axios.get(API_URL+path, {data});
export const post = async (path, data)=>await axios.post(API_URL+path, {data});
