import React, { useState, useCallback } from 'react';
import { FinalReport, PrioritizedAction } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '../hooks/useIsMobile';
import { generatePdf } from '../services/pdfGenerator';

interface SimplifiedReportProps {
    report: FinalReport;
    onRestart: () => void;
    onShowDetails?: () => void;
}

const SimplifiedReport: React.FC<SimplifiedReportProps> = ({ report, onRestart, onShowDetails }) => {
    const isMobile = useIsMobile();
    const [showDetails, setShowDetails] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = useCallback(async () => {
        setIsDownloading(true);
        try {
            await generatePdf(report);
        } catch (error) {
            console.error('PDF generation failed:', error);
        } finally {
            setIsDownloading(false);
        }
    }, [report]);

    // Calculate simplified score if not provided
    const score = report.simplifiedScore || calculateScore(report);
    const readinessPercent = Math.round(score);

    // Get status color
    const getStatusColor = () => {
        if (readinessPercent >= 80) return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' };
        if (readinessPercent >= 60) return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' };
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' };
    };

    const statusColors = getStatusColor();

    // Get readiness text
    const getReadinessText = () => {
        if (readinessPercent >= 80) return 'Interview Ready!';
        if (readinessPercent >= 60) return 'Almost Ready';
        return 'Needs Practice';
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">

            {/* PART 1: THE VERDICT */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-10 space-y-6"
            >
                <div className="text-center space-y-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Your Interview Report</h1>

                    {/* Big Score */}
                    <div className="py-6 md:py-8">
                        <div className="text-6xl md:text-8xl font-black text-white mb-2">
                            {readinessPercent}
                            <span className="text-2xl md:text-4xl text-white/40">/100</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full max-w-md mx-auto h-3 md:h-4 bg-white/10 rounded-full overflow-hidden mt-4">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${readinessPercent}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className={`h-full ${readinessPercent >= 80 ? 'bg-green-500' : readinessPercent >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            />
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 ${statusColors.bg} ${statusColors.border}`}>
                        <div className={`w-2 h-2 rounded-full ${statusColors.text} animate-pulse`} />
                        <span className={`text-sm md:text-base font-bold ${statusColors.text} uppercase tracking-wide`}>
                            {getReadinessText()}
                        </span>
                    </div>
                </div>

                {/* Key Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8">
                    {/* Top Strength */}
                    <div className="bg-green-500/5 border border-green-500/20 rounded-xl md:rounded-2xl p-4 md:p-6">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">✅</span>
                            <div className="flex-1">
                                <h3 className="text-xs md:text-sm font-bold text-green-400 uppercase tracking-wider mb-2">Your Strength</h3>
                                <p className="text-sm md:text-base text-white font-medium">
                                    {report.topStrength || getTopStrength(report)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Top Weakness */}
                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl md:rounded-2xl p-4 md:p-6">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div className="flex-1">
                                <h3 className="text-xs md:text-sm font-bold text-red-400 uppercase tracking-wider mb-2">Work On</h3>
                                <p className="text-sm md:text-base text-white font-medium">
                                    {report.topWeakness || getTopWeakness(report)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Estimated Timeline */}
                {report.estimatedSessionsToReady && (
                    <div className="text-center pt-4 border-t border-white/10">
                        <p className="text-sm md:text-base text-white/70">
                            ⏱️ <span className="font-bold text-white">{report.estimatedSessionsToReady}</span> more practice session{report.estimatedSessionsToReady > 1 ? 's' : ''} recommended
                        </p>
                    </div>
                )}
            </motion.section>

            {/* PART 2: WHAT HAPPENED (Collapsible) */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-5 flex items-center justify-between transition-colors"
                >
                    <span className="text-base md:text-lg font-bold text-white">Show Detailed Breakdown</span>
                    <motion.span
                        animate={{ rotate: showDetails ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-white text-xl"
                    >
                        ▼
                    </motion.span>
                </button>

                <AnimatePresence>
                    {showDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 p-4 md:p-6 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl space-y-6">
                                {/* Top Skills */}
                                {report.quantitativeAnalysis && report.quantitativeAnalysis.competency_scores.length > 0 && (
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold text-white mb-4">Skills Breakdown</h3>
                                        <div className="space-y-3">
                                            {report.quantitativeAnalysis.competency_scores.slice(0, 5).map((skill, i) => (
                                                <div key={i} className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm md:text-base text-white font-medium">{skill.competency}</span>
                                                        <span className={`text-sm md:text-base font-bold ${skill.score >= 80 ? 'text-green-400' : skill.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                            {skill.score}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            style={{ width: `${skill.score}%` }}
                                                            className={`h-full ${skill.score >= 80 ? 'bg-green-500' : skill.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Better Answers Section */}
                                {report.questionPerformance && report.questionPerformance.length > 0 && (
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold text-white mb-4">💡 Better Answers</h3>
                                        <p className="text-sm md:text-base text-white/60 mb-4">
                                            Here's how top performers would have answered your toughest questions:
                                        </p>
                                        <div className="space-y-4">
                                            {report.questionPerformance
                                                .filter(q => q.max_impact_response && q.user_transcript !== '[SKIPPED]')
                                                .slice(0, 3)
                                                .map((q, i) => (
                                                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-blue-400 font-bold">Q:</span>
                                                            <p className="text-sm md:text-base text-white/90 font-medium flex-1">
                                                                {q.question_text}
                                                            </p>
                                                        </div>
                                                        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 ml-6">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
                                                                    ⭐ Ideal Response
                                                                </span>
                                                            </div>
                                                            <p className="text-sm md:text-base text-white/80 leading-relaxed italic">
                                                                "{q.max_impact_response}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}

                                {/* Summary */}
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-white mb-3">Overall Feedback</h3>
                                    <p className="text-sm md:text-base text-white/80 leading-relaxed">
                                        {report.overallSummary}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.section>

            {/* PART 3: WHAT TO DO NEXT */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-blue-500/5 border border-blue-500/20 rounded-2xl md:rounded-3xl p-6 md:p-10 space-y-6"
            >
                <div className="text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">What to Do Next</h2>
                    <p className="text-sm md:text-base text-white/60">Practice these to improve your score</p>
                </div>

                {/* Quick Wins */}
                {report.quickWins && report.quickWins.length > 0 && (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl md:rounded-2xl p-4 md:p-6">
                        <h3 className="text-base md:text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
                            <span>⚡</span> Quick Wins (2-5 min each)
                        </h3>
                        <ul className="space-y-2">
                            {report.quickWins.map((win, i) => (
                                <li key={i} className="text-sm md:text-base text-white flex items-start gap-2">
                                    <span className="text-yellow-400 mt-1">•</span>
                                    <span>{win}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Prioritized Actions */}
                <div className="space-y-4">
                    {(report.prioritizedActions || generateDefaultActions(report)).map((action, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + (i * 0.1) }}
                            className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6"
                        >
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg md:text-xl font-bold text-white">{i + 1}.</span>
                                        <h4 className="text-base md:text-lg font-bold text-white">{action.title}</h4>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs md:text-sm text-white/60">
                                        <span className={`px-2 py-1 rounded ${action.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                                            action.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            } font-bold uppercase`}>
                                            {action.impact} Impact
                                        </span>
                                        <span>⏱️ {action.timeEstimate}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm md:text-base text-white/80 mb-4">{action.exercise}</p>
                            <button className="w-full md:w-auto px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors">
                                Start Practice →
                            </button>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 pt-6">
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white text-sm md:text-base font-bold rounded-xl md:rounded-2xl transition-colors disabled:opacity-50"
                >
                    {isDownloading ? '📥 Downloading...' : '📥 Download Report'}
                </button>
                <button
                    onClick={onRestart}
                    className="flex-1 px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white text-sm md:text-base font-bold rounded-xl md:rounded-2xl transition-colors"
                >
                    🚀 Start Next Session
                </button>
            </div>
        </div>
    );
};

// Helper functions
function calculateScore(report: FinalReport): number {
    if (!report.advisoryPanel || report.advisoryPanel.length === 0) return 0;

    const scores = report.advisoryPanel.flatMap(advisor =>
        advisor.scores?.map(s => s.score) || []
    );

    if (scores.length === 0) return 0;

    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round((avgScore / 5) * 100);
}

function getTopStrength(report: FinalReport): string {
    if (report.quantitativeAnalysis && report.quantitativeAnalysis.competency_scores.length > 0) {
        const sorted = [...report.quantitativeAnalysis.competency_scores].sort((a, b) => b.score - a.score);
        return sorted[0].competency;
    }
    return 'Clear communication';
}

function getTopWeakness(report: FinalReport): string {
    if (report.quantitativeAnalysis && report.quantitativeAnalysis.competency_scores.length > 0) {
        const sorted = [...report.quantitativeAnalysis.competency_scores].sort((a, b) => a.score - b.score);
        return sorted[0].competency;
    }
    if (report.biggestRiskArea) {
        return report.biggestRiskArea.title;
    }
    return 'Technical depth';
}

function generateDefaultActions(report: FinalReport): PrioritizedAction[] {
    const actions: PrioritizedAction[] = [];

    // Add action from biggest risk
    if (report.biggestRiskArea) {
        actions.push({
            title: report.biggestRiskArea.title,
            impact: 'high',
            timeEstimate: '15 min',
            exercise: report.biggestRiskArea.mitigation || 'Practice answering questions in this area with specific examples.'
        });
    }

    // Add actions from coach pack
    if (report.coachPack?.micro_drills) {
        report.coachPack.micro_drills.slice(0, 2).forEach((drill, i) => {
            actions.push({
                title: drill.weakness,
                impact: i === 0 ? 'high' : 'medium',
                timeEstimate: '10 min',
                exercise: drill.drill_prompt
            });
        });
    }

    return actions.slice(0, 3);
}

export default SimplifiedReport;
