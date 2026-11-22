import axios from 'axios';
import { API_URL } from './config';

// Use the shared, environment-driven backend URL and keep the /api prefix
// that the Express server mounts its routers under.
const API = axios.create({ baseURL: API_URL });

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
