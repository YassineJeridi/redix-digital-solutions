import React, { createContext, useState, useEffect } from 'react';
import * as DashboardService from '../services/DashboardServices';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await DashboardService.getDashboardStats(); // Changed from getDashboardData
            setDashboardData(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshData = () => {
        fetchData();
    };

    return (
        <AppContext.Provider value={{ dashboardData, loading, refreshData }}>
            {children}
        </AppContext.Provider>
    );
};
