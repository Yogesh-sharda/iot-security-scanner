import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Sidebar from './components/Sidebar';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/dashboard" element={
                        <div className="flex h-screen overflow-hidden">
                            <Sidebar />
                            <div className="flex-1 overflow-y-auto w-full">
                                <Dashboard />
                            </div>
                        </div>
                    } />
                    <Route path="/analytics" element={
                        <div className="flex h-screen overflow-hidden">
                            <Sidebar />
                            <div className="flex-1 overflow-y-auto w-full">
                                <Analytics />
                            </div>
                        </div>
                    } />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
