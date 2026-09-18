import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Automatically attaches your JWT token to every request
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('rootle_token'); 
    if (token) {
        req.headers['x-auth-token'] = token;
    }
    return req;
});

export default API;