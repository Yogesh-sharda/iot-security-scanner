import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Defer state updates to avoid synchronous setState-in-effect lint warnings.
        const t = setTimeout(() => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');
            const username = localStorage.getItem('username');
            
            if (token && username) {
                setUser({ username, role });
            }
            setLoading(false);
        }, 0);

        return () => clearTimeout(t);
    }, []);

    const login = async (username, password) => {
        const data = await authService.login(username, password);
        setUser({ username: data.username, role: data.role });
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
