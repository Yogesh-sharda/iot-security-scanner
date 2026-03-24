import React, { useState, useEffect } from 'react';
import { scanService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Loader2, AlertCircle, Clock, ShieldCheck, Activity, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import SOCLogs from '../components/SOCLogs';

const Dashboard = () => {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentScan, setCurrentScan] = useState(null);
    
    const [history, setHistory] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [riskFilter, setRiskFilter] = useState('ALL');
    const [searchFilter, setSearchFilter] = useState('');

    const fetchHistory = async (page = 1) => {
        setHistoryLoading(true);
        try {
            const data = await scanService.getHistory(page, 15);
            setHistory(data.items || []);
            setTotalPages(data.pages || 1);
            setHistoryPage(data.current_page || 1);
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory(1);
    }, []);

    const handleScan = async (e) => {
        e.preventDefault();
        if (!query) return;
        
        setLoading(true);
        setError('');
        setCurrentScan(null);
        setRiskFilter('ALL');
        setSearchFilter('');
        
        try {
            const result = await scanService.runScan(query);
            setCurrentScan(result);
            fetchHistory(1);
        } catch (err) {
            setError(err.response?.data?.error || 'Scan failed or timed out. Check limits.');
        } finally {
            setLoading(false);
        }
    };

    const loadPastScan = async (scanId) => {
        setLoading(true);
        try {
            const result = await scanService.getScanDetails(scanId);
            setCurrentScan({
                scan_id: result.scan_id,
                results: result.results
            });
            setQuery(result.query);
            setRiskFilter('ALL');
            setSearchFilter('');
        } catch (err) {
            setError('Failed to load past scan due to lack of clearance.');
        } finally {
            setLoading(false);
        }
    };

    const getRiskLabel = (score) => {
        if (score >= 90) return 'CRITICAL';
        if (score >= 70) return 'HIGH';
        if (score >= 40) return 'MEDIUM';
        return 'LOW';
    };

    const getRiskBadge = (score) => {
        const label = getRiskLabel(score);
        if (label === 'CRITICAL') return <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold border border-red-500/50 blink-slow">CRITICAL ({score})</span>;
        if (label === 'HIGH') return <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs font-bold border border-orange-500/50">HIGH ({score})</span>;
        if (label === 'MEDIUM') return <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-500/50">MEDIUM ({score})</span>;
        return <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-500/50">LOW ({score})</span>;
    };

    const filteredResults = currentScan?.results?.filter(r => {
        const matchesRisk = riskFilter === 'ALL' || getRiskLabel(r.risk_score) === riskFilter;
        const searchStr = `${r.ip_str} ${r.port} ${r.org} ${r.country}`.toLowerCase();
        const matchesSearch = searchFilter === '' || searchStr.includes(searchFilter.toLowerCase());
        return matchesRisk && matchesSearch;
    }) || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold glow-text">Threat Dashboard</h1>
                    <p className="text-sm text-gray-500">Global Surveillance Operations {user?.role === 'Admin' ? '[GOD MODE]' : `[${user?.role}]`}</p>
                </div>
            </div>

            <div className="glass-panel p-6">
                <form onSubmit={handleScan} className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Enter IP, hostname, or Shodan query (e.g., 'apache port:80')"
                            className="w-full bg-cyber-900/50 border border-cyber-700 text-gray-200 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-cyber-green transition-colors disabled:opacity-50"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-cyber-green/10 hover:bg-cyber-green/20 border border-cyber-green text-cyber-green px-8 py-3 rounded-lg uppercase tracking-wider font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                        {loading ? 'Scanning...' : 'Initiate Scan'}
                    </button>
                </form>
                {error && (
                    <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded border border-red-500/20 animate-fade-in">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}
                
                <SOCLogs isActive={loading} query={query} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 glass-panel p-6 min-h-[500px] flex flex-col">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cyber-blue" />
                            Active Report {currentScan && <span className="text-xs text-cyber-green ml-2 border border-cyber-green px-2 py-1 rounded">ID: {currentScan.scan_id}</span>}
                        </h2>
                        
                        {currentScan && (
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input 
                                        type="text" 
                                        placeholder="Filter results..." 
                                        className="bg-cyber-900 border border-cyber-700 text-xs px-8 py-2 rounded focus:border-cyber-blue text-gray-300 outline-none w-48"
                                        value={searchFilter}
                                        onChange={(e) => setSearchFilter(e.target.value)}
                                    />
                                </div>
                                <select 
                                    className="bg-cyber-900 border border-cyber-700 text-xs px-3 py-2 rounded focus:border-cyber-blue text-gray-300 outline-none appearance-none cursor-pointer"
                                    value={riskFilter}
                                    onChange={(e) => setRiskFilter(e.target.value)}
                                >
                                    <option value="ALL">All Risks</option>
                                    <option value="CRITICAL">Critical Only</option>
                                    <option value="HIGH">High & Above</option>
                                    <option value="MEDIUM">Medium & Above</option>
                                </select>
                            </div>
                        )}
                    </div>
                    
                    {currentScan ? (
                        filteredResults.length > 0 ? (
                            <div className="overflow-x-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-cyber-700 text-sm uppercase text-gray-500">
                                            <th className="pb-3 pt-2 px-4 whitespace-nowrap">Target Node</th>
                                            <th className="pb-3 pt-2 px-4">Port</th>
                                            <th className="pb-3 pt-2 px-4 whitespace-nowrap">Location/Org</th>
                                            <th className="pb-3 pt-2 px-4">Threat Level</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {filteredResults.map((r, idx) => {
                                            const isCritical = r.risk_score >= 90;
                                            return (
                                                <tr key={idx} className={`border-b border-cyber-800/50 hover:bg-cyber-800 transition-colors ${isCritical ? 'bg-red-900/10' : ''}`}>
                                                    <td className="py-3 px-4 font-mono text-cyber-blue">{r.ip_str}</td>
                                                    <td className="py-3 px-4 text-gray-300 font-mono">{r.port}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-gray-300 truncate max-w-[150px]" title={r.org}>{r.org}</div>
                                                        <div className="text-gray-500 text-[10px] uppercase">{r.country}</div>
                                                    </td>
                                                    <td className="py-3 px-4">{getRiskBadge(r.risk_score)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-12">
                                <ShieldCheck className="w-12 h-12 mb-2 text-green-500/30" />
                                <p>No matching vulnerabilities found based on filters.</p>
                            </div>
                        )
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-12">
                            <Activity className="w-12 h-12 mb-2 text-cyber-blue/30 opacity-50" />
                            <p>Awaiting query execution to compile report.</p>
                        </div>
                    )}
                </div>

                <div className="glass-panel p-6 flex flex-col max-h-[600px]">
                    <h2 className="text-lg font-semibold mb-4 text-gray-300 flex items-center gap-2 shrink-0">
                        <Clock className="w-5 h-5 text-cyber-green" />
                        Operation Logs {user?.role === 'Admin' ? '(Global)' : '(Personal)'}
                    </h2>
                    
                    <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {historyLoading && history.length === 0 ? (
                             <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-cyber-green" /></div>
                        ) : history.length > 0 ? (
                            history.map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => !loading && loadPastScan(item.id)}
                                    className={`bg-cyber-900/50 border border-cyber-700 p-3 rounded-lg cursor-pointer transition-all group ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyber-blue hover:bg-cyber-800'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs text-cyber-green font-mono">OP-{item.id}</span>
                                        <span className="text-[10px] text-gray-500">{new Date(item.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-300 font-mono truncate group-hover:text-cyber-blue transition-colors w-full">
                                        {item.query}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-2 uppercase">
                                        Opr: <span className={item.user === user?.username ? "text-cyber-green" : "text-gray-400"}>{item.user}</span>
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No logged operations found.</p>
                        )}
                    </div>
                    
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 border-t border-cyber-700 pt-4 shrink-0">
                            <button 
                                onClick={() => fetchHistory(historyPage - 1)}
                                disabled={historyPage === 1 || historyLoading}
                                className="p-1 rounded text-gray-400 hover:text-white hover:bg-cyber-700 disabled:opacity-50"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-xs text-gray-500 font-mono">PAGE {historyPage}/{totalPages}</span>
                            <button 
                                onClick={() => fetchHistory(historyPage + 1)}
                                disabled={historyPage === totalPages || historyLoading}
                                className="p-1 rounded text-gray-400 hover:text-white hover:bg-cyber-700 disabled:opacity-50"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
