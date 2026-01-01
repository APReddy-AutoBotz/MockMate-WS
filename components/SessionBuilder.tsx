
import { motion } from 'framer-motion';
import { JDInsights, CompetencyWeight, QuestionBlueprint } from '../types';
import React from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

interface SessionBuilderProps {
    jdInsights: JDInsights;
    competencyWeights: CompetencyWeight[];
    questionSet?: QuestionBlueprint[];
    researchLinks?: { uri: string; title: string; }[];
    onAdjustSpecs?: () => void;
    onInitialize?: () => void;
}

const SkillSection: React.FC<{ title: string; items: string[]; delay?: number }> = ({ title, items, delay = 0 }) => {
    if (!items || items.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="space-y-3 md:space-y-4"
        >
            <h3 className="text-sm md:text-base font-bold text-white mb-2 md:mb-4">{title}</h3>
            <ul className="space-y-2 md:space-y-2.5">
                {items.map((item, idx) => (
                    <li key={idx} className="text-xs md:text-sm text-text-secondary pl-5 relative before:content-['•'] before:absolute before:left-0 before:text-action-teal">
                        {item}
                    </li>
                ))}
            </ul>
        </motion.div>
    );
};

const ArenaBlueprint: React.FC<SessionBuilderProps> = ({
    jdInsights,
    competencyWeights,
    onAdjustSpecs = () => { },
    onInitialize = () => { }
}) => {
    const isMobile = useIsMobile();
    const isQuestionBank = jdInsights.source === 'questionBank';
    const sourceLabel = isQuestionBank ? 'Question Bank' : 'Job Description';

    // Ensure we always have data
    const skills = jdInsights.mustHaveSkills?.length > 0 ? jdInsights.mustHaveSkills : [];
    const niceToHave = jdInsights.niceToHave?.length > 0 ? jdInsights.niceToHave : [];
    const domains = jdInsights.domains?.length > 0 ? jdInsights.domains : [];
    const tools = jdInsights.tools?.length > 0 ? jdInsights.tools : [];
    const softSkills = jdInsights.softSkills?.length > 0 ? jdInsights.softSkills : [];

    return (
        <div className="w-full max-w-5xl mx-auto py-4 md:py-8 px-4 md:px-6">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8 md:mb-16"
            >
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4">Prepare Your Session</h1>
                <p className="text-sm md:text-base text-text-secondary max-w-2xl mx-auto">
                    We've analyzed your goal and generated a tailored interview plan based on your {sourceLabel}.
                </p>
            </motion.div>

            {/* Blueprint Card - Flattened for mobile, Glass on desktop */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="md:bg-[#0A192F]/40 md:backdrop-blur-2xl md:border md:border-white/10 md:rounded-3xl p-0 md:p-12 space-y-8 md:space-y-10"
            >
                {/* Blueprint Header */}
                <div className="space-y-3 md:space-y-4 pb-6 md:pb-8 border-b border-white/10">
                    <h2 className="text-xl md:text-2xl font-bold text-action-teal">Your Interview Blueprint</h2>
                    <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
                        The intelligence engine has synthesized the following requirements for your rehearsal.
                    </p>
                </div>

                {/* Skills Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 md:gap-x-12 gap-y-8 md:gap-y-10">
                    <SkillSection title="Must-Have Skills" items={skills} delay={0.3} />
                    <SkillSection title="Nice-to-Have Skills" items={niceToHave} delay={0.4} />
                    <SkillSection title="Domains" items={domains} delay={0.5} />
                    <SkillSection title="Tools & Tech" items={tools} delay={0.6} />
                    <SkillSection title="Soft Skills" items={softSkills} delay={0.7} />
                </div>

                {/* Competency Weights (Compact) */}
                {competencyWeights && competencyWeights.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="pt-8 md:pt-10 border-t border-white/10 space-y-6 md:space-y-8"
                    >
                        <h3 className="text-sm md:text-base font-bold text-white">Assessment Focus</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">
                            {competencyWeights.map((w, i) => {
                                const percentage = w.weight <= 1 ? Math.round(w.weight * 100) : Math.round(w.weight);
                                const label = w.competency.replace(/([A-Z])/g, ' $1').trim();

                                return (
                                    <div key={i} className="text-center space-y-1 md:space-y-2">
                                        <div className="text-xl md:text-2xl font-black text-action-teal font-mono">{percentage}%</div>
                                        <div className="text-[9px] md:text-xs text-text-secondary uppercase tracking-wider font-bold">{label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="flex flex-col md:flex-row gap-4 pt-6 md:pt-8"
                >
                    <button
                        onClick={onInitialize}
                        className="w-full md:flex-[2] bg-action-teal hover:bg-action-teal/90 text-base-surface font-black py-4 md:py-5 px-6 rounded-xl shadow-lg shadow-action-teal/30 hover:shadow-action-teal/50 transition-all text-[11px] md:text-sm uppercase tracking-widest order-1 md:order-2"
                    >
                        Launch Interview Session →
                    </button>
                    <button
                        onClick={onAdjustSpecs}
                        className="w-full md:flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 md:py-5 px-6 rounded-xl transition-all text-[10px] md:text-sm tracking-widest order-2 md:order-1"
                    >
                        Adjust Specs
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ArenaBlueprint;

