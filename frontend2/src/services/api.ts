import axios from 'axios';


export const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        // We fetch tokens directly from localStorage/sessionStorage instead of the store to avoid cyclic dependency issues
        const userToken = localStorage.getItem('userToken');
        const guestToken = sessionStorage.getItem('guestToken');

        if (userToken) {
            config.headers.Authorization = `Bearer ${userToken}`;
        } else if (guestToken) {
            config.headers.Authorization = `Bearer ${guestToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
