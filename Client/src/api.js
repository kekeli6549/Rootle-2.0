import axios from 'axios';

const API = axios.create({ baseURL: 'rootle-2-0-gps6-eowdtgqtp-lord-frostbytes-projects-d5e710e2.vercel.app' });

// Automatically attaches your JWT token to every request
API.interceptors.request.use((req) => {
    // Look for both common token names to prevent undefined token errors
    const token = localStorage.getItem('rootle_token') || localStorage.getItem('token'); 
    
    if (token) {
        req.headers['x-auth-token'] = token;
    }
    return req;
});

export default API;