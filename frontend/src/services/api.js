import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:5000',
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error("No refresh token");
                }
                
                const refreshResponse = await axios.post('http://localhost:5000/api/auth/refresh', {}, {
                    headers: { 'Authorization': `Bearer ${refreshToken}` }
                });
                
                const newToken = refreshResponse.data.access_token;
                localStorage.setItem('token', newToken);
                
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('role');
                localStorage.removeItem('username');
                window.location.href = '/dashboard';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('username', response.data.username);
        }
        return response.data;
    },
    register: async (username, password, role = 'Analyst') => {
        const response = await api.post('/auth/register', { username, password, role });
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
    },
    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    }
};

export const scanService = {
    runScan: async (query) => {
        const response = await api.post('/scan/', { query });
        return response.data;
    },
    getHistory: async (page = 1, limit = 20) => {
        const response = await api.get(`/scan/history?page=${page}&limit=${limit}`);
        return response.data;
    },
    getScanDetails: async (scanId) => {
        const response = await api.get(`/scan/${scanId}`);
        return response.data;
    }
};

export default api;
