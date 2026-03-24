import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Activity, BarChart2, LogOut } from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="w-64 bg-cyber-800 border-r border-cyber-700 h-full flex flex-col pt-6 flex-shrink-0 z-10 transition-all">
            <div className="px-6 pb-6 flex items-center space-x-3 border-b border-cyber-700/50">
                <Shield className="w-8 h-8 text-cyber-green" />
                <h1 className="text-xl font-bold glow-text tracking-wider">SecOps</h1>
            </div>
            
            <div className="px-6 py-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Operative Details</p>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-300 truncate">{user?.username}</span>
                    <span className={`text-xs mt-1 px-2 py-0.5 rounded inline-block w-max ${user?.role === 'Admin' ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50' : 'bg-gray-700 text-gray-400 border border-gray-600'}`}>
                        {user?.role} CLEARANCE
                    </span>
                </div>
            </div>

            <div className="flex-1 px-4 py-4 space-y-2">
                <NavLink to="/dashboard" 
                    className={({isActive}) => `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-cyber-700 text-cyber-green border border-cyber-700' : 'text-gray-400 hover:bg-cyber-700/50 hover:text-gray-200 border border-transparent'}`}>
                    <Activity className="w-5 h-5" />
                    <span>Dashboard</span>
                </NavLink>
                
                {user?.role === 'Admin' && (
                    <NavLink to="/analytics" 
                        className={({isActive}) => `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-cyber-700 text-cyber-blue border border-cyber-700' : 'text-gray-400 hover:bg-cyber-700/50 hover:text-gray-200 border border-transparent'}`}>
                        <BarChart2 className="w-5 h-5" />
                        <span>Global Analytics</span>
                    </NavLink>
                )}
            </div>

            <div className="p-4 border-t border-cyber-700/50">
                <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 w-full text-left rounded-lg text-gray-400 hover:bg-cyber-700/50 hover:text-cyber-red transition-all">
                    <LogOut className="w-5 h-5" />
                    <span>Terminate Session</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
