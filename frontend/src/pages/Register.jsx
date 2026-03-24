import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { ShieldAlert, Lock, User, UserPlus } from 'lucide-react';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Analyst');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.register(username, password, role);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-cyber-900 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-cyber-blue/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-cyber-green/10 rounded-full blur-[100px]" />

            <div className="glass-panel p-10 w-full max-w-md relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <UserPlus className="w-16 h-16 text-cyber-blue mb-4" />
                    <h2 className="text-3xl font-bold text-cyber-blue drop-shadow-[0_0_8px_rgba(0,210,255,0.8)] tracking-wider">NEW OPERATIVE</h2>
                    <p className="text-gray-400 mt-2">Registration Portal</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded mb-6 text-sm text-center glow-text-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2 uppercase tracking-wide">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input 
                                type="text"
                                className="w-full bg-cyber-900/50 border border-cyber-700 text-gray-200 px-10 py-3 rounded focus:outline-none focus:border-cyber-blue transition-colors"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 uppercase tracking-wide">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input 
                                type="password"
                                className="w-full bg-cyber-900/50 border border-cyber-700 text-gray-200 px-10 py-3 rounded focus:outline-none focus:border-cyber-blue transition-colors"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 uppercase tracking-wide">Role</label>
                        <select 
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-cyber-900/50 border border-cyber-700 text-gray-200 px-4 py-3 rounded focus:outline-none focus:border-cyber-blue transition-colors appearance-none"
                        >
                            <option value="Analyst">Analyst</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue text-cyber-blue py-3 rounded uppercase tracking-wider font-bold transition-all disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Processing...' : 'Register'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Already registered? <Link to="/login" className="text-cyber-green hover:text-green-400">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
