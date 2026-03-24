import React, { useState, useEffect } from 'react';
import { scanService } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const Analytics = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aggregatedData, setAggregatedData] = useState({ ports: {}, risks: {}, trends: { labels: [], data: [] } });

    if (user?.role !== 'Admin') {
        return <Navigate to="/dashboard" replace />;
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const historyData = await scanService.getHistory(1, 50);
                const items = historyData.items || [];
                setHistory(items);
                
                const recentScans = items.slice(0, 15);
                const ports = {};
                const risks = { Critical: 0, High: 0, Medium: 0, Low: 0 };
                
                const trendsLabels = [];
                const trendsData = [];

                for (let i = recentScans.length - 1; i >= 0; i--) {
                    const scan = recentScans[i];
                    trendsLabels.push(new Date(scan.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
                    
                    try {
                        const details = await scanService.getScanDetails(scan.id);
                        let scanRiskTotal = 0;
                        
                        details.results.forEach(r => {
                            ports[r.port] = (ports[r.port] || 0) + 1;
                            
                            if (r.risk_score >= 90) risks.Critical++;
                            else if (r.risk_score >= 70) risks.High++;
                            else if (r.risk_score >= 40) risks.Medium++;
                            else risks.Low++;
                            
                            scanRiskTotal += r.risk_score;
                        });
                        const avgRisk = details.results.length > 0 ? (scanRiskTotal / details.results.length) : 0;
                        trendsData.push(avgRisk);
                    } catch (e) {
                        trendsData.push(0);
                    }
                }
                
                setAggregatedData({ ports, risks, trends: { labels: trendsLabels, data: trendsData } });
            } catch (err) {
                console.error("Failed to fetch analytics data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="flex h-full items-center justify-center min-h-[400px]"><p className="text-cyber-blue animate-pulse glow-text tracking-widest uppercase">Aggregating Global Metrics...</p></div>;
    }

    const pieData = {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{
            data: [
                aggregatedData.risks.Critical, 
                aggregatedData.risks.High, 
                aggregatedData.risks.Medium, 
                aggregatedData.risks.Low
            ],
            backgroundColor: ['rgba(255, 42, 42, 0.8)', 'rgba(255, 165, 0, 0.8)', 'rgba(255, 204, 0, 0.8)', 'rgba(0, 255, 65, 0.8)'],
            borderColor: ['#ff2a2a', '#ffa500', '#ffcc00', '#00ff41'],
            borderWidth: 1,
        }],
    };

    const portLabels = Object.keys(aggregatedData.ports);
    const barData = {
        labels: portLabels,
        datasets: [{
            label: 'Frequency',
            data: Object.values(aggregatedData.ports),
            backgroundColor: 'rgba(0, 210, 255, 0.8)',
            borderColor: '#00d2ff',
            borderWidth: 1,
        }],
    };

    const lineData = {
        labels: aggregatedData.trends.labels,
        datasets: [{
            label: 'Average Risk Score',
            data: aggregatedData.trends.data,
            borderColor: '#ff2a2a',
            backgroundColor: 'rgba(255, 42, 42, 0.1)',
            tension: 0.4,
            fill: true
        }],
    };

    const commonOptions = {
        scales: {
            y: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#9ca3af' } },
            x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
        },
        plugins: { legend: { display: false }, title: { display: false } }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold glow-text mb-6">Global Intelligence</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 flex flex-col items-center">
                    <h2 className="text-lg font-semibold mb-4 text-gray-300 w-full text-left">Risk Distribution</h2>
                    <div className="w-full max-w-[300px]">
                        {Object.values(aggregatedData.risks).reduce((a, b) => a + b, 0) > 0 ? (
                            <Pie data={pieData} options={{ plugins: { legend: { labels: { color: '#d1d5db' } } } }} />
                        ) : (
                            <p className="text-gray-500 text-center py-10">Insufficient data</p>
                        )}
                    </div>
                </div>

                <div className="glass-panel p-6 flex flex-col">
                    <h2 className="text-lg font-semibold mb-4 text-gray-300 w-full text-left">Port Frequencies</h2>
                    <div className="w-full flex-grow flex items-center justify-center">
                        {portLabels.length > 0 ? (
                            <Bar data={barData} options={commonOptions} />
                        ) : (
                            <p className="text-gray-500 text-center py-10">Insufficient data</p>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="glass-panel p-6 mt-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-300">Risk Trend Over Time</h2>
                <div className="w-full h-[250px] flex justify-center">
                    {aggregatedData.trends.data.length > 0 ? (
                        <Line data={lineData} options={{...commonOptions, maintainAspectRatio: false }} />
                    ) : (
                        <p className="text-gray-500 text-center py-10">Insufficient longitudinal data</p>
                    )}
                </div>
            </div>
            
            <div className="glass-panel p-6 mt-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-300">System Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-cyber-900 border border-cyber-700 p-4 rounded text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Scans</p>
                        <p className="text-2xl font-bold text-cyber-blue font-mono">{history.length}</p>
                    </div>
                    <div className="bg-cyber-900 border border-cyber-700 p-4 rounded text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Critical Hits</p>
                        <p className="text-2xl font-bold text-cyber-red font-mono">{aggregatedData.risks.Critical}</p>
                    </div>
                    <div className="bg-cyber-900 border border-cyber-700 p-4 rounded text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">High Risks</p>
                        <p className="text-2xl font-bold text-orange-400 font-mono">{aggregatedData.risks.High}</p>
                    </div>
                    <div className="bg-cyber-900 border border-cyber-700 p-4 rounded text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Network Status</p>
                        <p className="text-xl font-bold text-cyber-green font-mono tracking-widest">ONLINE</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
