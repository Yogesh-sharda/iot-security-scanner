import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';

const SOCLogs = ({ isActive, query }) => {
    const [logs, setLogs] = useState([]);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!isActive) return;
        
        // Defer the first state update to avoid synchronous setState-in-effect lint warnings.
        const t0 = setTimeout(() => {
            setLogs([`[SYSTEM] Initializing scan sequence for target: ${query}`]);
        }, 0);
        
        const sequence = [
            { delay: 1000, msg: `[AUTH] Validating operative clearance... SUCCESS` },
            { delay: 2000, msg: `[NETWORK] Establishing secure connection to Shodan API...` },
            { delay: 3500, msg: `[EXEC] Querying signature database for "${query}"...` },
            { delay: 5000, msg: `[DATA] Receiving payload... mapping service banners.` },
            { delay: 6500, msg: `[ANALYSIS] Engine processing risk metrics...` },
            { delay: 8000, msg: `[SYSTEM] Data aggregation complete. Finalizing report.` }
        ];

        let timeouts = [];
        sequence.forEach((step) => {
            const t = setTimeout(() => {
                setLogs(prev => [...prev, step.msg]);
            }, step.delay);
            timeouts.push(t);
        });

        return () => {
            clearTimeout(t0);
            timeouts.forEach(clearTimeout);
        };
    }, [isActive, query]);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <div className="bg-cyber-900 border border-cyber-700/50 rounded-lg p-4 font-mono text-sm h-48 overflow-y-auto relative custom-scrollbar shadow-inner mt-4">
            <div className="flex items-center space-x-2 mb-3 sticky top-0 bg-cyber-900/90 backdrop-blur pb-2 border-b border-cyber-800">
                <Terminal className="w-4 h-4 text-cyber-green" />
                <span className="text-gray-400 font-semibold tracking-wider uppercase text-xs">Live Operation Feed</span>
                {isActive && <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse ml-2"></span>}
            </div>
            <div className="space-y-1">
                {logs.map((log, i) => (
                    <div key={i} className={`animate-fade-in ${log.includes('SUCCESS') || log.includes('complete') ? 'text-cyber-green' : 'text-gray-300'}`}>
                        <span className="text-cyber-blue/70 mr-2">{new Date().toISOString().split('T')[1].slice(0,8)}</span>
                        {log}
                    </div>
                ))}
                {isActive && (
                    <div className="text-cyber-green animate-pulse">_</div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default SOCLogs;
