
import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { getSessionHistory } from '../services/storageService';
import { SessionHistoryRecord, FinalReport } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

interface GrowthDashboardProps {
    onBack: () => void;
    onViewReport: (report: FinalReport) => void;
}

const ReadinessMap: Record<string, number> = {
    'NOT_READY': 1,
    'ALMOST_READY': 2,
    'INTERVIEW_READY': 3
};

const GrowthDashboard: React.FC<GrowthDashboardProps> = React.memo(({ onBack, onViewReport }) => {
    const isMobile = useIsMobile();
    const history = useMemo(() => getSessionHistory().reverse(), []); // Chronological for charts

    const chartData = useMemo(() => history.map(h => ({
        date: new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        confidence: h.avgScore,
        readiness: ReadinessMap[h.readinessStatus] || 1,
        role: h.role
    })), [history]);

    const latestSessions = useMemo(() => [...history].reverse(), [history]);

    const handleBack = useCallback(() => {
        onBack();
    }, [onBack]);

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-10 md:space-y-12 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-8 md:pb-10 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-info-blue animate-pulse" />
                        <span className="text-[9px] md:text-[10px] font-black text-info-blue uppercase tracking-[0.4em] block">Private Performance Journal</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none">Readiness Portfolio</h1>
                </div>
                <button
                    onClick={handleBack}
                    className="w-full md:w-auto group flex items-center justify-center gap-3 px-6 py-4 md:py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-text-secondary hover:text-white hover:bg-white/10 uppercase tracking-widest transition-all"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Arena
                </button>
            </header>

            {history.length === 0 ? (
                <div className="text-center py-20 md:py-32 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl md:rounded-[3rem] px-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <div className="w-2 h-2 rounded-full bg-info-blue animate-pulse" />
                    </div>
                    <h2 className="text-lg md:text-xl font-black text-text-primary mb-3 md:mb-4">No sessions yet</h2>
                    <p className="text-xs md:text-sm text-text-secondary opacity-60">Complete your first interview to see your performance data here.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-12">
                        {latestSessions.map((session, idx) => (
                            <motion.div
                                key={session.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: idx * 0.05 }}
                                className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-6 hover:bg-white/[0.05] transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-2 h-2 rounded-full ${session.readinessStatus === 'INTERVIEW_READY' ? 'bg-action-teal' :
                                                    session.readinessStatus === 'ALMOST_READY' ? 'bg-accent-amber' :
                                                        'bg-alert-coral'
                                                    }`}
                                            />
                                            <span className="text-xs font-bold text-white tracking-tight">{session.readinessStatus.replace(/_/g, ' ')}</span>
                                        </div>
                                        <span className="text-[9px] font-black uppercase text-text-secondary opacity-40 tracking-widest pl-4">Readiness Status</span>
                                    </div>
                                    <div className="text-2xl font-black text-action-teal leading-none">{session.avgScore} <span className="text-[10px] text-white/20">/100</span></div>
                                </div>

                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                                    <span className="text-[10px] text-text-secondary opacity-60 italic">{new Date(session.timestamp).toLocaleDateString()}</span>
                                    <button
                                        onClick={() => session.fullReport && onViewReport(session.fullReport)}
                                        disabled={!session.fullReport}
                                        className="text-[9px] font-black uppercase tracking-widest text-info-blue hover:text-white transition-colors disabled:opacity-30 flex items-center gap-2"
                                    >
                                        Inspect Audit <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-10 md:mt-12 bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8">
                        <div className={`mb-6 flex flex-col items-center text-center ${isMobile ? 'space-y-1' : 'space-y-2'}`}>
                            <span className="text-[9px] font-black text-action-teal uppercase tracking-[0.4em]">Progression Curve</span>
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Strategic Trajectory</h3>
                        </div>
                        <div className="w-full h-[200px] md:h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 9, fill: "#ffffff30", fontWeight: 700 }}
                                        stroke="#ffffff05"
                                        axisLine={false}
                                    />
                                    <YAxis
                                        dataKey="readiness"
                                        domain={[0, 4]}
                                        tick={{ fill: "#ffffff30", fontSize: 9 }}
                                        stroke="#ffffff05"
                                        axisLine={false}
                                        ticks={[1, 2, 3]}
                                        tickFormatter={(val) => val === 1 ? 'Low' : val === 2 ? 'Mid' : 'Peak'}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0A192F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}
                                        itemStyle={{ fontSize: '10px', color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                        labelStyle={{ color: '#ffffff40', fontSize: '9px', marginBottom: '4px', fontWeight: 900 }}
                                        cursor={{ stroke: '#ffffff10', strokeWidth: 1 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="readiness"
                                        stroke="#14C8B0"
                                        strokeWidth={3}
                                        fill="url(#readinessGradient)"
                                        fillOpacity={1}
                                        animationDuration={1500}
                                    />
                                    <defs>
                                        <linearGradient id="readinessGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#14C8B0" stopOpacity={0.15} />
                                            <stop offset="100%" stopColor="#14C8B0" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});

export default GrowthDashboard;
