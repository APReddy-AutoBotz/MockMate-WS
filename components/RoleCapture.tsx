
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

interface RoleCaptureProps {
    userProfile: UserProfile | null;
    onRoleSubmit: (role: string, sessionType: 'structured' | 'conversational', companyData?: { name: string, url: string }) => void;
    onBack: () => void;
    onViewHistory: () => void;
}

const RoleCapture: React.FC<RoleCaptureProps> = ({ userProfile, onRoleSubmit, onBack, onViewHistory }) => {
    const isMobile = useIsMobile();
    const [intentText, setIntentText] = useState('');
    const [companyName, setCompanyName] = useState(userProfile?.companyName || '');
    const [companyUrl, setCompanyUrl] = useState(userProfile?.companyUrl || '');
    const [showCompanyFields, setShowCompanyFields] = useState(false);

    const handleSubmit = (sessionType: 'structured' | 'conversational') => {
        const trimmedIntent = intentText.trim();
        if (trimmedIntent) {
            onRoleSubmit(trimmedIntent, sessionType, { name: companyName, url: companyUrl });
        }
    };

    const welcomeMessage = userProfile ? `Welcome back, ${userProfile.name}` : 'Initialize Environment';

    return (
        <div className="relative flex flex-col items-center text-center text-text-primary p-6 md:p-12 mt-16 md:mt-0">
            {/* Redundant nav buttons removed - now handled by App.tsx header */}

            <header className="max-w-xl mb-10 md:mb-16">
                <h2 className="text-3xl md:text-6xl font-serif font-bold mb-4 md:mb-6 tracking-tight text-white leading-tight md:leading-none">
                    {welcomeMessage}
                </h2>
                <p className="text-sm md:text-base text-text-secondary font-medium leading-relaxed opacity-60">
                    Define your target objective. Our intelligence engine will assemble the required panel and constraints instantly.
                </p>
            </header>

            <div className="w-full max-w-xl flex flex-col items-center space-y-6 md:space-y-8">
                <div className="w-full relative group">
                    <textarea
                        value={intentText}
                        onChange={(e) => setIntentText(e.target.value)}
                        placeholder="e.g. Director of Engineering"
                        className="w-full h-32 md:h-40 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-[2.5rem] py-6 md:py-8 px-6 md:px-10 text-white font-sans font-bold placeholder:text-white/10 focus:outline-none focus:border-action-teal/40 text-xl md:text-2xl transition-all resize-none shadow-2xl leading-tight"
                        aria-label="Your interview goal"
                        autoFocus
                    />
                    <div className="absolute bottom-6 md:bottom-8 right-8 md:right-10 label-mono text-white/10 group-focus-within:text-action-teal/40 transition-colors text-[8px] md:text-[9px]">
                        Target Objective
                    </div>
                </div>

                <div className="w-full">
                    <button
                        onClick={() => setShowCompanyFields(!showCompanyFields)}
                        className="label-mono text-[9px] text-white/20 hover:text-action-teal transition-all flex items-center gap-2 mx-auto"
                    >
                        {showCompanyFields ? '[-] Hide Strategic Grounding' : '[+] Add Strategic Grounding (Company Vibe)'}
                    </button>

                    <AnimatePresence>
                        {showCompanyFields && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-6"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                    <input
                                        type="text"
                                        placeholder="Company Name"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-xl md:rounded-2xl px-6 md:px-8 py-4 md:py-5 text-sm md:text-base text-white font-sans placeholder:text-white/20 focus:border-action-teal/40 outline-none transition-all shadow-xl"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Company URL"
                                        value={companyUrl}
                                        onChange={(e) => setCompanyUrl(e.target.value)}
                                        className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-xl md:rounded-2xl px-6 md:px-8 py-4 md:py-5 text-sm md:text-base text-white font-sans placeholder:text-white/20 focus:border-action-teal/40 outline-none transition-all shadow-xl"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-10">
                    <button
                        onClick={() => handleSubmit('structured')}
                        disabled={!intentText.trim()}
                        className="w-full bg-white/[0.02] backdrop-blur-xl text-text-primary p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] hover:bg-white/[0.05] hover:border-info-blue/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed border border-white/10 text-left group flex flex-col justify-between h-40 md:h-56 shadow-2xl"
                    >
                        <div>
                            <span className="label-mono text-info-blue mb-2 md:mb-4 block text-[8px] md:text-[9px]">Protocol Alpha</span>
                            <h3 className="font-serif font-bold text-xl md:text-2xl text-white mb-1 md:mb-2">The Blueprint</h3>
                            <p className="text-[10px] md:text-xs text-text-secondary font-medium leading-relaxed opacity-60">Structured strategic rehearsal based on a ground-truth plan.</p>
                        </div>
                        <span className="label-mono text-[8px] md:text-[9px] opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-all">Initialize &rarr;</span>
                    </button>
                    <button
                        onClick={() => handleSubmit('conversational')}
                        disabled={!intentText.trim()}
                        className="w-full bg-action-teal/[0.03] backdrop-blur-xl text-text-primary p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] hover:bg-action-teal/[0.06] hover:border-action-teal/40 transition-all disabled:opacity-20 disabled:cursor-not-allowed border border-action-teal/10 text-left group flex flex-col justify-between h-40 md:h-56 shadow-2xl"
                    >
                        <div>
                            <span className="label-mono text-action-teal mb-2 md:mb-4 block text-[8px] md:text-[9px]">Protocol Beta</span>
                            <h3 className="font-serif font-bold text-xl md:text-2xl text-white mb-1 md:mb-2">The Arena</h3>
                            <p className="text-[10px] md:text-xs text-text-secondary font-medium leading-relaxed opacity-60">Dynamic, unscripted environment that adapts to your presence.</p>
                        </div>
                        <span className="label-mono text-[8px] md:text-[9px] opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-all">Initialize &rarr;</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleCapture;

