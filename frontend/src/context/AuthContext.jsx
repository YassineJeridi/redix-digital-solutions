import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthService from '../services/AuthServices';

export const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize auth on mount
        AuthService.initAuth();
        const savedUser = AuthService.getCurrentUser();
        if (savedUser) {
            setUser(savedUser);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const userData = await AuthService.login(email, password);
        setUser(userData);
        return userData;
    };

    const register = async (name, email, password, role) => {
        const userData = await AuthService.register(name, email, password, role);
        setUser(userData);
        return userData;
    };

    const logout = () => {
        AuthService.logout();
        setUser(null);
    };

    const isAuthenticated = !!user?.token;

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};
