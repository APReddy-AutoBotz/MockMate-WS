
import React, { useState, useEffect, useRef } from 'react';
import { SessionContext, InterviewPlan, SessionControls } from '../types';
import * as mockGeminiService from '../services/mockGeminiService';
import PanelSelector from './PanelSelector';
import SessionBuilder from './SessionBuilder';
import { AnimatePresence, motion } from 'framer-motion';
import SessionControlsEditor from './SessionControlsEditor';
import { UploadIcon } from './icons/UploadIcon';
import { audioService } from '../services/audioService';
import { useIsMobile } from '../hooks/useIsMobile';

interface SessionPrepProps {
    onContextReady: (context: SessionContext) => void;
    context: SessionContext;
    onGoBack: () => void;
}

const defaultControls: SessionControls = {
    difficulty: 'intermediate',
    totalQuestions: 15,
    includeBehavioral: true,
    includeCoding: false,
    timePerQuestion: '90s',
    sessionMode: 'exam',
    sourceMode: 'job_description'
};

const FileDropZone: React.FC<{ onTextReady: (text: string) => void; mode: 'job_description' | 'question_bank' }> = ({ onTextReady, mode }) => {
    const isMobile = useIsMobile();
    const [fileName, setFileName] = useState<string | null>(null);
    const [isPasting, setIsPasting] = useState(false);
    const [pastedText, setPastedText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isQuestionBank = mode === 'question_bank';

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsPasting(false);
        audioService.playConfirm();

        try {
            if (file.type === "application/pdf") {
                onTextReady(`[Extracted from PDF: ${file.name} - Mode: ${mode}] ${isQuestionBank ? 'STUDY MATERIAL:' : 'REQUIREMENTS:'} `);
            } else {
                const text = await file.text();
                onTextReady(text);
            }
        } catch (err) {
            console.error("Failed to read file", err);
        }
    };

    const handlePasteSubmit = () => {
        if (pastedText.trim()) {
            onTextReady(pastedText);
            setFileName('Pasted Context');
            setIsPasting(false);
            audioService.playConfirm();
        }
    };

    return (
        <div className="w-full space-y-4">
            <AnimatePresence mode="wait">
                {!isPasting ? (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full"
                    >
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-6 md:py-8 px-6 md:px-10 border-2 border-dashed border-info-blue/10 rounded-2xl md:rounded-3xl bg-white/[0.01] hover:bg-white/[0.03] hover:border-info-blue/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 md:gap-4 group"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".txt,.pdf,.doc,.docx"
                            />
                            <UploadIcon className="w-6 h-6 md:w-8 md:h-8 text-info-blue opacity-80 group-hover:scale-110 transition-transform" />
                            <p className="text-xs md:text-sm font-bold text-white/50 transition-colors group-hover:text-white/80 text-center">
                                {fileName
                                    ? `Selected: ${fileName}`
                                    : isQuestionBank
                                        ? 'Upload Study Material / Question Dump'
                                        : 'Upload Job Description or Resume'
                                }
                            </p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsPasting(true); }}
                            className="w-full mt-3 text-[9px] md:text-[10px] font-black text-info-blue/40 hover:text-info-blue transition-colors uppercase tracking-[0.2em]"
                        >
                            Or paste text manually
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="paste-area"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-4 shadow-inner"
                    >
                        <textarea
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            placeholder={isQuestionBank ? "Paste your specific questions or study notes here..." : "Paste your Job Description or Resume content here..."}
                            className="w-full h-32 md:h-40 bg-transparent text-sm text-text-primary placeholder:text-white/10 focus:outline-none resize-none font-sans leading-relaxed"
                            autoFocus
                        />
                        <div className="flex gap-3 md:gap-4">
                            <button
                                onClick={handlePasteSubmit}
                                className="flex-1 bg-info-blue text-base-surface font-black py-4 md:py-3 rounded-xl text-[9px] md:text-[10px] uppercase tracking-widest"
                            >
                                Confirm Text
                            </button>
                            <button
                                onClick={() => setIsPasting(false)}
                                className="px-4 md:px-6 text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SessionPrep: React.FC<SessionPrepProps> = ({ onContextReady, context, onGoBack }) => {
    const isMobile = useIsMobile();
    const [isLoading, setIsLoading] = useState(true);
    const [isPlanReady, setIsPlanReady] = useState(false);
    const [plan, setPlan] = useState<InterviewPlan | null>(null);
    const [selectedPanelIDs, setSelectedPanelIDs] = useState<string[]>([]);
    const [showCustomization, setShowCustomization] = useState(false);
    const [sessionControls, setSessionControls] = useState<SessionControls>(defaultControls);
    const [currentContext, setCurrentContext] = useState(context);
    const [jdText, setJdText] = useState<string | null>(null);

    const [matchReasons, setMatchReasons] = useState<Record<string, string>>({});

    useEffect(() => {
        const init = async () => {
            const { recommendedPanelIDs, recommendedRole, matchReasons } = await mockGeminiService.calibrateIntent(context.intentText);
            setSelectedPanelIDs(recommendedPanelIDs);
            setMatchReasons(matchReasons || {});
            setCurrentContext(prev => ({
                ...prev,
                candidateRole: recommendedRole,
                selectedPanelIDs: recommendedPanelIDs
            }));
            setIsLoading(false);
        };
        init();
    }, [context.intentText]);

    const handleGeneratePlan = async () => {
        setIsLoading(true);
        audioService.playStart();
        try {
            const interviewPlan = await mockGeminiService.generateInterviewPlan(
                context.intentText,
                jdText,
                sessionControls,
                selectedPanelIDs
            );
            setPlan(interviewPlan);
            setIsPlanReady(true);
        } catch (err) {
            console.error("Plan generation failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartSession = () => {
        if (!plan) return;
        audioService.playConfirm();
        const weights = plan.jdInsights?.competencyWeights || {};
        const weightsArray = Object.entries(weights).map(([key, val]) => ({ competency: key, weight: val as number }));
        onContextReady({
            ...currentContext,
            selectedPanelIDs,
            interviewPlan: plan,
            competencyWeights: weightsArray,
            jdInsights: plan.jdInsights
        });
    };

    if (isPlanReady && plan) {
        return (
            <SessionBuilder
                jdInsights={plan.jdInsights}
                competencyWeights={Object.entries(plan.jdInsights?.competencyWeights || {}).map(([k, v]) => ({ competency: k, weight: v as number }))}
                questionSet={plan.questionSet}
                onAdjustSpecs={() => { audioService.playEnd(); setIsPlanReady(false); }}
                onInitialize={handleStartSession}
                researchLinks={plan.researchLinks}
            />
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto py-4 md:py-8 px-4 md:px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
            >
                <div className="w-full mb-8 md:mb-10">
                    <FileDropZone
                        onTextReady={setJdText}
                        mode={sessionControls.sourceMode}
                    />
                </div>

                <div className="w-full text-left mb-5 md:mb-6 pl-4 border-l-2 border-action-teal/40">
                    <h3 className="text-action-teal font-black text-lg md:text-xl uppercase tracking-widest leading-none">
                        Your interview panel
                    </h3>
                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest opacity-40 mt-1.5">Selected experts for this rehearsal</p>
                </div>

                <div className="w-full mb-10 md:mb-12">
                    <PanelSelector selectedPanelIDs={selectedPanelIDs} onSelectionChange={setSelectedPanelIDs} matchReasons={matchReasons} />
                </div>

                <div className="w-full bg-white/[0.02] border border-white/10 rounded-2xl md:rounded-3xl mb-10 md:mb-12 overflow-hidden transition-all">
                    <button
                        onClick={() => { audioService.playConfirm(); setShowCustomization(!showCustomization); }}
                        className="w-full px-6 md:px-10 py-6 md:py-8 flex justify-between items-center hover:bg-white/[0.02] border-b border-white/5"
                    >
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-action-teal shadow-[0_0_8px_rgba(20,200,176,0.6)]" />
                            <h4 className="text-white font-bold text-base md:text-lg tracking-tight">Advanced parameters</h4>
                        </div>
                        <span className={`text-info-blue text-[10px] md:text-xs transition-transform duration-300 ${showCustomization ? 'rotate-180' : 'rotate-90'}`}>▲</span>
                    </button>
                    <AnimatePresence initial={false}>
                        {showCustomization && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-6 md:px-10 py-6 md:py-10"
                            >
                                <SessionControlsEditor controls={sessionControls} onChange={setSessionControls} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="w-full flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8">
                    <button
                        onClick={handleGeneratePlan}
                        disabled={isLoading}
                        className="w-full bg-action-teal text-base-surface font-black py-4 md:py-5 rounded-xl md:rounded-2xl hover:bg-opacity-90 transition-all text-[11px] md:text-sm tracking-widest shadow-xl shadow-action-teal/20 order-1 md:order-2"
                    >
                        {isLoading ? 'Synthesizing...' : 'Confirm & generate plan'}
                    </button>
                    <button
                        onClick={onGoBack}
                        className="w-full bg-[#162741] text-white/60 font-bold py-4 md:py-5 rounded-xl md:rounded-2xl hover:bg-[#1c3253] hover:text-white transition-all text-[10px] md:text-sm tracking-widest order-2 md:order-1"
                    >
                        Change goal
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default SessionPrep;

