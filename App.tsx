
import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import MockSession from './components/MockSession';
import SessionPrep from './components/SessionPrep';
import RoleCapture from './components/RoleCapture';
import AppContainer from './components/AppContainer';
import SplashScreen from './components/SplashScreen';
import InterviewReport from './components/InterviewReport';
import InterviewOrbit from './components/InterviewOrbit';
import { FinalReport, SessionContext, UserProfile } from './types';
import { Logo } from './components/icons/Logo';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import OnboardingQuestions from './components/OnboardingQuestions';
import GrowthDashboard from './components/GrowthDashboard';
import { saveSessionToHistory } from './services/storageService';
import { audioService } from './services/audioService';
import { auth, signOut } from './services/firebaseClient';

// Lazy load heavy components
const LazyGrowthDashboard = React.lazy(() => import('./components/GrowthDashboard'));
const LazyInterviewReport = React.lazy(() => import('./components/InterviewReport'));
const LazyMockSession = React.lazy(() => import('./components/MockSession'));

type AppState = 'SPLASH' | 'LOADING' | 'LANDING' | 'LOGIN' | 'ONBOARDING' | 'ROLE_SELECTION' | 'CONTEXT_UPLOAD' | 'SESSION_ACTIVE' | 'REPORT_VIEW' | 'HISTORY_VIEW';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('SPLASH');
    const [showSplash, setShowSplash] = useState(true);
    const [sessionContext, setSessionContext] = useState<SessionContext | null>(null);
    const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        // Use the auth listener to determine starting state
        const unsubscribe = auth.onAuthStateChanged((user: any) => {
            if (user) {
                const storedProfile = localStorage.getItem('mockmate_user_profile');
                if (storedProfile) {
                    setUserProfile(JSON.parse(storedProfile));
                    setAppState('ROLE_SELECTION');
                } else {
                    // Logged in but no profile -> Go to onboarding
                    setUserProfile({ name: user.displayName || user.email.split('@')[0], experienceLevel: 'mid', primaryGoal: 'skill_building' });
                    setAppState('ONBOARDING');
                }
            } else {
                setAppState('LANDING');
            }
        });
        return () => unsubscribe();
    }, []);

    const handleSplashComplete = () => {
        setShowSplash(false);
        // If appState was SPLASH, the useEffect with auth listener should have already
        // determined if we move to LANDING, ROLE_SELECTION etc.
        // If it's still SPLASH, it means auth check isn't done, so we wait or default to LOADING/LANDING.
        if (appState === 'SPLASH') setAppState('LOADING');
    };

    const handleGetStarted = () => {
        audioService.playConfirm();
        setAppState('LOGIN');
    };
    const handleLogin = () => {
        audioService.playStart();
        // The useEffect will handle the state shift based on onAuthStateChanged
    };
    const handleBackToLanding = () => setAppState('LANDING');

    const handleOnboardingComplete = (profile: UserProfile, targetRole: string, sessionType: 'structured' | 'conversational') => {
        audioService.playConfirm();
        try {
            localStorage.setItem('mockmate_user_profile', JSON.stringify(profile));
            setUserProfile(profile);

            const initialContext: SessionContext = {
                candidateRole: targetRole,
                intentText: targetRole,
                selectedPanelIDs: [],
                sessionType: sessionType,
                sessionMode: 'exam'
            };
            setSessionContext(initialContext);

            if (sessionType === 'structured') {
                setAppState('CONTEXT_UPLOAD');
            } else {
                setAppState('SESSION_ACTIVE');
            }
        } catch (error) {
            console.error("Failed to save user profile", error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('mockmate_user_profile');
        } catch (error) {
            console.error("Failed to logout", error);
        }
        setUserProfile(null);
        setAppState('LANDING');
        setSessionContext(null);
        setFinalReport(null);
    };


    const handleRoleSubmit = (intent: string, sessionType: 'structured' | 'conversational', companyData?: { name: string, url: string }) => {
        audioService.playConfirm();
        const initialContext: SessionContext = {
            candidateRole: intent,
            intentText: intent,
            selectedPanelIDs: [],
            sessionType: sessionType,
            sessionMode: 'exam',
            companyName: companyData?.name,
            companyUrl: companyData?.url
        };
        setSessionContext(initialContext);

        if (sessionType === 'structured') {
            setAppState('CONTEXT_UPLOAD');
        } else {
            setAppState('SESSION_ACTIVE');
        }
    };

    const handleContextReady = (context: SessionContext) => {
        audioService.playStart();
        setSessionContext(context);
        setAppState('SESSION_ACTIVE');
    }

    const handleReportGenerated = (report: FinalReport) => {
        audioService.playNotify();
        if (sessionContext) {
            saveSessionToHistory(report, sessionContext.candidateRole, sessionContext.sessionType);
        }
        setFinalReport(report);
        setAppState('REPORT_VIEW');
    };

    const handleRestart = () => {
        audioService.playConfirm();
        setAppState('ROLE_SELECTION');
        setSessionContext(null);
        setFinalReport(null);
    }

    const handleGoBack = () => {
        if (appState === 'CONTEXT_UPLOAD') {
            setAppState('ROLE_SELECTION');
            setSessionContext(null);
        }
    };

    const handleCancelSession = () => {
        audioService.playEnd();
        if (appState === 'SESSION_ACTIVE') {
            if (sessionContext?.sessionType === 'structured') {
                setAppState('CONTEXT_UPLOAD');
            } else {
                setAppState('ROLE_SELECTION');
                setSessionContext(null);
            }
        }
    };

    const toggleHistory = () => {
        audioService.playConfirm();
        if (appState === 'HISTORY_VIEW') {
            setAppState('ROLE_SELECTION');
        } else {
            setAppState('HISTORY_VIEW');
        }
    }

    const pageAnimation = {
        initial: { opacity: 0, scale: 0.99, filter: 'blur(10px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 1.01, filter: 'blur(15px)' },
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }
    };

    const headerAnimation = {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as any }
    }


    const renderPageContent = () => {
        switch (appState) {
            case 'LOADING':
                return null;
            case 'LANDING':
                return (
                    <ErrorBoundary>
                        <LandingPage onGetStarted={handleGetStarted} />
                    </ErrorBoundary>
                );
            case 'LOGIN':
                return (
                    <ErrorBoundary>
                        <Login onLoginSuccess={handleLogin} onBack={handleBackToLanding} />
                    </ErrorBoundary>
                );
            case 'ONBOARDING':
                return (
                    <ErrorBoundary>
                        <OnboardingQuestions onComplete={handleOnboardingComplete} />
                    </ErrorBoundary>
                );
            case 'ROLE_SELECTION':
                return (
                    <motion.div key="role" {...pageAnimation} className="w-full max-w-2xl px-4">
                        <AppContainer>
                            <ErrorBoundary>
                                <RoleCapture
                                    userProfile={userProfile}
                                    onRoleSubmit={handleRoleSubmit}
                                    onBack={handleLogout}
                                    onViewHistory={toggleHistory}
                                />
                            </ErrorBoundary>
                        </AppContainer>
                    </motion.div>
                );
            case 'HISTORY_VIEW':
                return (
                    <motion.div key="history" {...pageAnimation} className="w-full max-w-5xl px-4">
                        <Suspense fallback={
                            <div className="flex items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        }>
                            <ErrorBoundary>
                                <LazyGrowthDashboard
                                    onBack={toggleHistory}
                                    onViewReport={(report) => {
                                        setFinalReport(report);
                                        setAppState('REPORT_VIEW');
                                    }}
                                />
                            </ErrorBoundary>
                        </Suspense>
                    </motion.div>
                );
            case 'CONTEXT_UPLOAD':
                return (
                    <motion.div key="context" {...pageAnimation} className="w-full max-w-3xl px-4">
                        <AppContainer>
                            <ErrorBoundary>
                                <SessionPrep
                                    onContextReady={handleContextReady}
                                    context={sessionContext!}
                                    onGoBack={handleGoBack}
                                />
                            </ErrorBoundary>
                        </AppContainer>
                    </motion.div>
                );
            case 'SESSION_ACTIVE':
                return (
                    <div className="fixed inset-0 w-full h-full z-50 bg-[#0A192F]">
                        <Suspense fallback={
                            <div className="flex items-center justify-center h-full">
                                <div className="text-white text-lg">Loading interview session...</div>
                            </div>
                        }>
                            <ErrorBoundary>
                                <LazyMockSession
                                    sessionContext={sessionContext!}
                                    onReportGenerated={handleReportGenerated}
                                    onCancel={handleCancelSession}
                                />
                            </ErrorBoundary>
                        </Suspense>
                    </div>
                );
            case 'REPORT_VIEW':
                return (
                    <motion.div key="report" {...pageAnimation} className="w-full max-w-5xl px-4">
                        <Suspense fallback={
                            <div className="flex items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <div className="ml-4 text-white text-lg">Generating report...</div>
                            </div>
                        }>
                            <ErrorBoundary>
                                {finalReport && <LazyInterviewReport report={finalReport} onRestart={handleRestart} />}
                            </ErrorBoundary>
                        </Suspense>
                    </motion.div>
                );
            default:
                return null;
        }
    }

    const showAppHeader = appState !== 'LANDING' && appState !== 'LOGIN' && appState !== 'ONBOARDING' && appState !== 'LOADING' && appState !== 'SESSION_ACTIVE';


    return (
        <ErrorBoundary>
            <ToastProvider>
                <div className="min-h-screen w-full flex flex-col">
                    <AnimatePresence>
                        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
                    </AnimatePresence>

                    {showSplash ? null : (
                        <>
                            {showAppHeader && (
                                <motion.header {...headerAnimation} className="absolute top-0 left-0 w-full px-4 sm:px-12 py-6 sm:py-10 flex justify-between items-center z-20 pointer-events-none">
                                    <div onClick={handleRestart} className="cursor-pointer transition-transform hover:scale-[1.02] pointer-events-auto">
                                        <Logo className="h-12 w-auto sm:h-16" />
                                    </div>
                                    <div className="flex items-center gap-4 sm:gap-8 pointer-events-auto">
                                        <button
                                            onClick={toggleHistory}
                                            className="text-[9px] sm:text-[11px] font-bold text-text-secondary hover:text-info-blue uppercase tracking-widest transition-colors"
                                        >
                                            Journal
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="text-[8px] sm:text-[10px] font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-6 py-2 sm:py-3 transition-all backdrop-blur-md uppercase tracking-widest"
                                        >
                                            End Session
                                        </button>
                                    </div>
                                </motion.header>
                            )}
                            <main className="flex-grow w-full flex flex-col items-center justify-center p-2 sm:p-4 relative z-10 overflow-hidden">
                                <AnimatePresence mode="wait">
                                    {renderPageContent()}
                                </AnimatePresence>
                            </main>
                        </>
                    )}
                </div>
            </ToastProvider>
        </ErrorBoundary>
    );
};

export default App;
