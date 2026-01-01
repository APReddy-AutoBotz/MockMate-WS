
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionContext, FinalReport, InterviewTurn, QuestionBlueprint } from '../types';
import * as mockGeminiService from '../services/mockGeminiService';
import PushToTalkInput from './PushToTalkInput';
import CodeEditor from './CodeEditor';
import PresenceMonitor from './PresenceMonitor';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { PERSONAS_CONFIG } from '../personas.config';
import { audioService } from '../services/audioService';
import { trackQuestionUsage } from '../services/storageService';
import { useIsMobile } from '../hooks/useIsMobile';

interface MockSessionProps {
    sessionContext: SessionContext;
    onReportGenerated: (report: FinalReport) => void;
    onCancel: () => void;
}

type SessionPhase = 'loading_question' | 'asking' | 'thinking' | 'reviewing' | 'confirm_exit' | 'confirm_skip' | 'generating_report';

const MockSession: React.FC<MockSessionProps> = ({ sessionContext, onReportGenerated, onCancel }) => {
    const isMobile = useIsMobile();
    const [sessionPhase, setSessionPhase] = useState<SessionPhase>('loading_question');
    const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
    const [currentPersonaId, setCurrentPersonaId] = useState<string>('p1');
    const [currentBlueprint, setCurrentBlueprint] = useState<QuestionBlueprint | null>(null);
    const [lastTranscript, setLastTranscript] = useState<string | null>(null);
    const [codeValue, setCodeValue] = useState<string>('');
    const [codeFeedback, setCodeFeedback] = useState<string | null>(null);
    const [isAnalyzingCode, setIsAnalyzingCode] = useState(false);
    const [hint, setHint] = useState<string | null>(null);
    const [isHintLoading, setIsHintLoading] = useState(false);
    const [localContext, setLocalContext] = useState(sessionContext);

    const sessionHistory = useRef<InterviewTurn[]>([]);
    const currentQuestionIndex = useRef(0);

    const totalExpectedQuestions = sessionContext.interviewPlan?.meta?.controls?.totalQuestions || 7;

    useEffect(() => {
        const startSession = async () => {
            setSessionPhase('loading_question');
            let qText = '';
            let personaId = '';

            try {
                if (sessionContext.sessionType === 'structured' && sessionContext.interviewPlan?.questionSet?.length) {
                    const firstQuestion = sessionContext.interviewPlan.questionSet[0];
                    if (firstQuestion && firstQuestion.question) {
                        setCurrentBlueprint(firstQuestion);
                        setCurrentQuestion(firstQuestion.question);
                        personaId = firstQuestion.personaFocus || sessionContext.selectedPanelIDs[0] || 'p1';
                        setCurrentPersonaId(personaId);
                        qText = firstQuestion.question;
                    }
                } else {
                    const { firstQuestion, personaId: startId, updatedContext } = await mockGeminiService.startInterviewSession(sessionContext);
                    setLocalContext(updatedContext);
                    setCurrentQuestion(firstQuestion);
                    setCurrentPersonaId(startId);
                    qText = firstQuestion;
                }

                if (!qText || qText.trim() === "") {
                    qText = "Welcome. Please describe your most relevant experience for this role.";
                    setCurrentQuestion(qText);
                    setCurrentPersonaId(sessionContext.selectedPanelIDs[0] || 'p1');
                }

                trackQuestionUsage(qText, sessionContext.candidateRole);
                audioService.playNotify();
                setSessionPhase('asking');
            } catch (err) {
                console.error("Session start error", err);
                onCancel();
            }
        };
        startSession();
    }, [sessionContext]);

    const handleAnswerSubmit = async (transcript: string) => {
        if (!currentQuestion || !currentPersonaId) return;
        audioService.playConfirm();
        setHint(null);
        setLastTranscript(transcript);
        setSessionPhase('reviewing');
    };

    const handleCodeSubmit = async (code: string) => {
        if (!currentBlueprint) return;
        setIsAnalyzingCode(true);
        audioService.playStart();
        try {
            const feedback = await mockGeminiService.analyzeCode(currentBlueprint, code);
            setCodeFeedback(feedback);
            setLastTranscript(code);
            setSessionPhase('reviewing');
        } catch (e) {
            setLastTranscript(code);
            setSessionPhase('reviewing');
        } finally {
            setIsAnalyzingCode(false);
        }
    };

    const handleConfirmTranscript = () => {
        if (!currentQuestion || !currentPersonaId || !lastTranscript) return;
        audioService.playConfirm();
        const persona = PERSONAS_CONFIG.find(p => p.id === currentPersonaId) || PERSONAS_CONFIG[0];
        sessionHistory.current.push({
            interviewer: `${persona.name} — ${persona.title}`,
            question: currentQuestion,
            candidateResponse: lastTranscript,
            questionBlueprint: currentBlueprint ?? undefined,
            codeFeedback: codeFeedback || undefined
        });
        handleProceedToNextQuestion();
    };

    const handleReRecord = () => {
        audioService.playEnd();
        setLastTranscript(null);
        setCodeFeedback(null);
        setSessionPhase('asking');
    };

    const handleRequestHint = async () => {
        if (!currentQuestion || isHintLoading) return;
        setIsHintLoading(true);
        audioService.playConfirm();
        try {
            const nudge = await mockGeminiService.getHintForQuestion(currentQuestion);
            setHint(nudge);
        } catch (e) {
            setHint("Focus on the primary technical tradeoff of your chosen approach.");
        } finally {
            setIsHintLoading(false);
        }
    };

    const handleSkipClick = () => {
        audioService.playConfirm();
        setSessionPhase('confirm_skip');
    };

    const handleConfirmSkip = () => {
        if (!currentQuestion || !currentPersonaId) return;
        audioService.playConfirm();
        const persona = PERSONAS_CONFIG.find(p => p.id === currentPersonaId) || PERSONAS_CONFIG[0];
        sessionHistory.current.push({
            interviewer: `${persona.name} — ${persona.title}`,
            question: currentQuestion,
            candidateResponse: '[SKIPPED]',
            questionBlueprint: currentBlueprint ?? undefined
        });
        handleProceedToNextQuestion();
    };

    const handleProceedToNextQuestion = async () => {
        const currentTotal = localContext.interviewPlan?.meta?.controls?.totalQuestions || 7;
        if (sessionHistory.current.length >= currentTotal) {
            generateReport();
            return;
        }

        setSessionPhase('thinking');
        setCurrentQuestion(null);
        setCurrentBlueprint(null);
        setLastTranscript(null);
        setCodeValue('');
        setCodeFeedback(null);
        setHint(null);

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            if (localContext.sessionType === 'structured' && localContext.interviewPlan?.questionSet?.length) {
                currentQuestionIndex.current++;
                const blueprint = localContext.interviewPlan.questionSet[currentQuestionIndex.current];
                if (blueprint && blueprint.question) {
                    setCurrentBlueprint(blueprint);
                    setCurrentQuestion(blueprint.question);

                    let pId = blueprint.personaFocus;
                    const personaExists = PERSONAS_CONFIG.some(p => p.id === pId);
                    if (!personaExists || !pId) {
                        pId = localContext.selectedPanelIDs[currentQuestionIndex.current % localContext.selectedPanelIDs.length] || 'p1';
                    }

                    setCurrentPersonaId(pId);
                    audioService.playNotify();
                    setSessionPhase('asking');
                    trackQuestionUsage(blueprint.question, localContext.candidateRole);
                } else {
                    generateReport();
                }
            } else {
                const nextIndex = sessionHistory.current.length % localContext.selectedPanelIDs.length;
                const nextPersonaId = localContext.selectedPanelIDs[nextIndex];
                const { nextQuestion, isLastQuestion } = await mockGeminiService.submitAnswerAndGetNext(sessionHistory.current, localContext, nextPersonaId);

                if (isLastQuestion) generateReport();
                else if (nextQuestion) {
                    setCurrentQuestion(nextQuestion);
                    setCurrentPersonaId(nextPersonaId);
                    audioService.playNotify();
                    setSessionPhase('asking');
                    trackQuestionUsage(nextQuestion, localContext.candidateRole);
                } else generateReport();
            }
        } catch (err) { generateReport(); }
    };

    const generateReport = async () => {
        setSessionPhase('generating_report');
        try {
            const report = await mockGeminiService.generateFinalReport(sessionHistory.current.slice(), localContext);
            onReportGenerated(report);
        } catch (error) { onCancel(); }
    };

    const currentPersona = PERSONAS_CONFIG.find(p => p.id === currentPersonaId) || PERSONAS_CONFIG[0];
    const isCodingQuestion = currentBlueprint?.phase === 'coding';
    const PersonaIcon = currentPersona.icon;

    return (
        <div className="w-full h-full flex flex-col bg-[#010912] relative overflow-hidden">
            {/* Minimal Dashboard Header */}
            <div className="flex justify-between items-center w-full px-4 md:px-8 py-3 z-30 border-b border-white/5 bg-[#010912]/80 backdrop-blur-3xl shrink-0">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className={`w-2 h-2 rounded-full ${sessionPhase === 'asking' ? 'bg-action-teal animate-pulse shadow-[0_0_10px_rgba(20,200,176,0.6)]' : 'bg-white/10'}`} />
                    <h2 className="text-[9px] md:text-[10px] font-black text-white tracking-[0.2em] uppercase opacity-60">
                        {isCodingQuestion ? 'Technical Command' : 'Active Dialogue'}
                    </h2>
                </div>
                <div className="flex items-center gap-2 md:gap-6">
                    <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 bg-white/[0.03] border border-white/10 rounded-md">
                        <span className="text-[7px] md:text-[8px] font-black text-info-blue uppercase tracking-widest opacity-40">Step</span>
                        <span className="text-[9px] md:text-[10px] font-mono font-bold text-white leading-none">{sessionHistory.current.length + 1}/{totalExpectedQuestions}</span>
                    </div>
                    <button onClick={() => setSessionPhase('confirm_exit')} className="text-[8px] md:text-[9px] font-black text-text-secondary hover:text-white transition-all px-2 md:px-3 py-1 border border-white/5 rounded-md hover:bg-white/5 uppercase tracking-widest">Quit</button>
                </div>
            </div>

            <div className="flex-grow relative flex overflow-hidden">
                <AnimatePresence mode="wait">
                    {sessionPhase === 'loading_question' || sessionPhase === 'generating_report' || sessionPhase === 'thinking' ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-[#010912] z-40">
                            <LoadingSpinner />
                            <p className="mt-8 text-[11px] font-black text-info-blue uppercase tracking-[0.4em] animate-pulse">
                                {sessionPhase === 'generating_report' ? 'Synthesizing Data' : sessionPhase === 'thinking' ? 'Analyzing Response' : 'Calibrating System'}
                            </p>
                        </motion.div>
                    ) : sessionPhase === 'confirm_exit' ? (
                        <motion.div key="exit" className="absolute inset-0 flex items-center justify-center bg-[#010912]/95 backdrop-blur-xl z-50 p-4">
                            <div className="max-w-sm w-full p-6 md:p-8 text-center space-y-6">
                                <h3 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">Terminate Session?</h3>
                                <div className="flex flex-col gap-3">
                                    <button onClick={generateReport} className="bg-action-teal text-base-surface font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95">Generate Partial Audit</button>
                                    <button onClick={onCancel} className="bg-white/5 text-text-secondary font-black py-4 rounded-xl border border-white/10 text-[10px] uppercase tracking-widest hover:bg-white/10">Discard Everything</button>
                                    <button onClick={() => setSessionPhase('asking')} className="text-[9px] font-black text-info-blue uppercase py-3 tracking-widest hover:text-white">Resume</button>
                                </div>
                            </div>
                        </motion.div>
                    ) : sessionPhase === 'confirm_skip' ? (
                        <motion.div key="skip" className="absolute inset-0 flex items-center justify-center bg-[#010912]/95 backdrop-blur-xl z-50 p-4">
                            <div className="max-w-sm w-full p-6 md:p-8 text-center space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">Skip Current Inquiry?</h3>
                                    <p className="text-[11px] md:text-xs text-text-secondary/60 leading-relaxed px-2">
                                        Skipping will record a null response in your performance audit.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button onClick={handleConfirmSkip} className="bg-accent-amber text-base-surface font-black py-4 rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-accent-amber/10 active:scale-95">Confirm Bypass</button>
                                    <button onClick={() => setSessionPhase('asking')} className="bg-white/5 text-white font-black py-4 rounded-xl border border-white/10 text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Resume Rehearsal</button>
                                </div>
                            </div>
                        </motion.div>
                    ) : sessionPhase === 'reviewing' ? (
                        <motion.div key="review" className="absolute inset-0 flex items-center justify-center bg-[#010912]/95 backdrop-blur-2xl z-50 p-4">
                            <div className="w-full max-w-lg text-center flex flex-col h-full justify-center">
                                <span className="text-[10px] font-black text-accent-amber uppercase tracking-[0.4em] mb-4 md:mb-6 inline-block">Transmission Captured</span>
                                <div className="bg-white/[0.02] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-8 mb-6 md:mb-10 overflow-hidden relative group backdrop-blur-3xl flex-grow md:flex-grow-0 max-h-[60vh] md:max-h-none">
                                    {isCodingQuestion ? (
                                        <pre className="text-left text-action-teal font-mono text-xs md:text-sm whitespace-pre-wrap leading-relaxed h-full overflow-y-auto custom-scrollbar p-2">{lastTranscript}</pre>
                                    ) : (
                                        <textarea
                                            value={lastTranscript || ''}
                                            onChange={(e) => setLastTranscript(e.target.value)}
                                            className="w-full h-full md:h-[25vh] bg-transparent text-white font-medium text-lg md:text-xl leading-relaxed focus:outline-none resize-none text-center custom-scrollbar"
                                        />
                                    )}
                                </div>
                                <div className="flex flex-col md:flex-row gap-4 justify-center shrink-0">
                                    <button onClick={handleConfirmTranscript} className="w-full md:w-auto bg-action-teal text-base-surface font-black py-4 md:py-5 px-12 rounded-xl md:rounded-2xl text-[11px] uppercase tracking-[.2em] shadow-2xl shadow-action-teal/20 transition-transform active:scale-95 order-1 md:order-2">Submit</button>
                                    <button onClick={handleReRecord} className="w-full md:w-auto bg-white/5 text-text-primary px-12 py-4 md:py-5 rounded-xl md:rounded-2xl border border-white/10 text-[11px] uppercase tracking-[.2em] hover:bg-white/10 transition-all order-2 md:order-1">Edit</button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow w-full flex overflow-hidden">
                            {isCodingQuestion ? (
                                <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 w-full h-full overflow-hidden">
                                    {/* Mission Control Sidebar - Mobile Optimized */}
                                    <div className="col-span-12 lg:col-span-4 h-auto lg:h-full bg-[#010B14] border-b lg:border-r border-white/5 flex flex-col relative z-20 shrink-0">
                                        <div className="overflow-y-auto lg:flex-grow custom-scrollbar p-4 md:p-6 lg:p-10 space-y-4 md:space-y-6 lg:space-y-10">
                                            {/* Persona Profile */}
                                            <div className="flex items-center gap-3 md:gap-5">
                                                <div className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-${currentPersona.color}/10 border border-${currentPersona.color}/20 shadow-2xl shrink-0`}>
                                                    {PersonaIcon && <PersonaIcon className="w-5 h-5 md:w-9 md:h-9 text-white opacity-80" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] md:text-base font-black text-white tracking-[.15em] uppercase leading-none">{currentPersona.name}</span>
                                                    <p className="text-[8px] md:text-[10px] text-info-blue font-black tracking-[0.2em] uppercase mt-1 md:mt-2 opacity-50">{currentPersona.title}</p>
                                                </div>
                                            </div>

                                            {/* Technical Requirements */}
                                            <div className="space-y-2 md:space-y-4 lg:space-y-6">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="h-0.5 w-4 md:w-8 bg-action-teal/30" />
                                                    <span className="text-[8px] md:text-[10px] font-black text-action-teal uppercase tracking-[0.3em]">Protocol Objective</span>
                                                </div>
                                                <h3 className="font-serif font-bold text-white tracking-tight leading-snug text-sm md:text-xl lg:text-2xl xl:text-3xl max-h-[100px] lg:max-h-none overflow-y-auto">
                                                    {currentQuestion || "Syncing Challenge..."}
                                                </h3>
                                            </div>

                                            {/* Tactical Hint (Nudge) */}
                                            <AnimatePresence>
                                                {hint && (
                                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-info-blue/5 border-l-4 border-info-blue/50 p-3 md:p-6 rounded-r-xl md:rounded-r-2xl">
                                                        <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-info-blue animate-pulse" />
                                                            <span className="text-[8px] md:text-[10px] font-black text-info-blue uppercase tracking-widest">Tactical Support</span>
                                                        </div>
                                                        <p className="text-[10px] md:text-[13px] font-medium text-text-secondary leading-relaxed italic">"{hint}"</p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Dashboard Footer (Sidebar Bottom) */}
                                        <div className="p-4 md:p-6 lg:p-8 border-t border-white/5 bg-black/20">
                                            <div className="flex items-center gap-2 md:gap-4">
                                                <button onClick={handleRequestHint} disabled={isHintLoading} className="flex-1 bg-info-blue/10 hover:bg-info-blue/20 text-info-blue border border-info-blue/20 font-black py-3 md:py-4 rounded-xl text-[9px] md:text-[10px] uppercase tracking-widest transition-all">
                                                    {isHintLoading ? 'Syncing...' : 'Hint'}
                                                </button>
                                                <button onClick={handleSkipClick} className="flex-1 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/10 font-black py-3 md:py-4 rounded-xl text-[9px] md:text-[10px] uppercase tracking-widest transition-all">
                                                    Skip
                                                </button>
                                            </div>
                                            <div className="hidden lg:flex items-center justify-between text-[8px] font-black text-white/10 uppercase tracking-[0.4em] mt-6">
                                                <span>{currentBlueprint?.language?.toUpperCase() || 'PYTHON'} CORE</span>
                                                <span>SECURITY: ACTIVE</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* High-Fidelity IDE Area */}
                                    <div className="col-span-12 lg:col-span-8 h-full bg-[#010B14] overflow-hidden relative group">
                                        <CodeEditor
                                            value={codeValue}
                                            onChange={setCodeValue}
                                            onSubmit={handleCodeSubmit}
                                            isProcessing={isAnalyzingCode}
                                            feedback={codeFeedback}
                                            language={currentBlueprint?.language}
                                        />
                                        <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-action-teal/5 blur-[80px] md:blur-[120px] rounded-full pointer-events-none -mr-16 md:-mr-32 -mt-16 md:-mt-32" />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-grow w-full flex flex-col items-center justify-center p-4 md:p-8 bg-[#010912] overflow-y-auto">
                                    <div className="max-w-lg w-full flex flex-col items-center text-center space-y-6 md:space-y-10 py-8">
                                        <div className="flex flex-col items-center space-y-3 md:space-y-4">
                                            <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-${currentPersona.color}/5 border border-${currentPersona.color}/20 shadow-[0_0_50px_rgba(234,88,12,0.1)]`}>
                                                {PersonaIcon && <PersonaIcon className="w-7 h-7 md:w-10 md:h-10 text-white opacity-90" />}
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-sm md:text-lg font-black text-white tracking-[.2em] uppercase">{currentPersona.name}</span>
                                                <p className="text-[8px] md:text-[10px] text-info-blue font-black tracking-[0.2em] uppercase opacity-50">{currentPersona.title}</p>
                                            </div>
                                        </div>

                                        <h3 className="font-serif font-bold text-white tracking-tight leading-snug text-lg md:text-3xl lg:text-4xl italic px-2 md:px-4">
                                            {currentQuestion ? `"${currentQuestion}"` : "Initializing protocol..."}
                                        </h3>

                                        <AnimatePresence>
                                            {hint && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-info-blue/5 border-l-4 border-info-blue/40 p-4 md:p-6 rounded-r-2xl md:rounded-r-3xl text-left max-w-sm md:max-w-xl self-center shadow-2xl">
                                                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-info-blue animate-pulse" />
                                                        <span className="text-[8px] md:text-[10px] font-black text-info-blue uppercase tracking-[0.2em]">Tactical Assist</span>
                                                    </div>
                                                    <p className="text-[11px] md:text-sm font-medium text-text-secondary/70 leading-relaxed italic">"{hint}"</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="w-full flex flex-col items-center gap-6 md:gap-10 pt-4 md:pt-6">
                                            <PushToTalkInput onTranscriptSubmit={handleAnswerSubmit} disabled={false} />
                                            <div className="flex gap-4 items-center">
                                                <button onClick={handleRequestHint} disabled={isHintLoading} className="font-black text-[9px] md:text-[10px] text-info-blue hover:text-white transition-all uppercase tracking-[0.2em] px-5 py-2.5 border border-info-blue/10 rounded-xl bg-info-blue/5 active:scale-95">
                                                    {isHintLoading ? 'Syncing...' : 'Hint'}
                                                </button>
                                                <button onClick={handleSkipClick} className="font-black text-[9px] md:text-[10px] text-accent-amber/40 hover:text-accent-amber transition-all uppercase tracking-[0.2em] px-5 py-2.5 border border-accent-amber/5 rounded-xl bg-accent-amber/5 active:scale-95">
                                                    Skip
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MockSession;

