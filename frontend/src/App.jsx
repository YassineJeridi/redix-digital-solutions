import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Services from './pages/Services';
import Tools from './pages/Tools';
import Settings from './pages/Settings';
import Expenses from './pages/Expenses';
import TeamMembers from './pages/TeamMembers';
import Reports from './pages/Reports';
import Investing from './pages/Investing';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import ActivityLog from './pages/ActivityLog';
import KanbanBoard from './pages/KanbanBoard';
import Backup from './pages/Backup';
import Invoices from './pages/Invoices';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: '#0f0a1a'
            }}>
                <div style={{
                    width: 40, height: 40, border: '3px solid rgba(193,45,224,0.2)',
                    borderTopColor: '#c12de0', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite'
                }} />
            </div>
        );
    }

    return isAuthenticated ? children : <NotFound />;
};

const AppRoutes = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return null;

    return (
        <Routes>
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
            />
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Routes>
                                <Route path="/" element={<Navigate to="/overview" replace />} />
                                <Route path="/overview" element={<Dashboard />} />
                                <Route path="/clients" element={<Clients />} />
                                <Route path="/services" element={<Services />} />
                                <Route path="/tasks" element={<KanbanBoard />} />
                                <Route path="/tools" element={<Tools />} />
                                <Route path="/expenses" element={<Expenses />} />
                                <Route path="/team" element={<TeamMembers />} />
                                <Route path="/reports" element={<Reports />} />
                                <Route path="/investing" element={<Investing />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/activity" element={<ActivityLog />} />
                                <Route path="/backup" element={<Backup />} />
                                <Route path="/finance/invoices" element={<Invoices />} />
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Layout>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <AppProvider>
                <Router
                    future={{
                        v7_startTransition: true,
                        v7_relativeSplatPath: true,
                    }}
                >
                    <AppRoutes />
                </Router>
            </AppProvider>
        </AuthProvider>
    );
}

export default App;
