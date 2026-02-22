import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './RevenueChart.module.css';

const RevenueChart = ({ data }) => {
    const chartData = [
        { name: 'Marketing', revenue: data?.marketingRevenue || 0 },
        { name: 'Production', revenue: data?.productionRevenue || 0 },
        { name: 'Development', revenue: data?.developmentRevenue || 0 },
    ];

    return (
        <div className={styles.chartContainer}>
            <h3 className={styles.title}>Revenue by Department</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;
