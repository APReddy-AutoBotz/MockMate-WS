
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppContainer from './AppContainer';
import { GoogleIcon } from './icons/SocialIcons';
import { auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, isUsingMockAuth, signOut } from '../services/firebaseClient';
import { signInWithPopup } from 'firebase/auth';
import { audioService } from '../services/audioService';
import { useIsMobile } from '../hooks/useIsMobile';

interface LoginProps {
    onLoginSuccess: () => void;
    onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
    const isMobile = useIsMobile();
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<{ code: string; message: string } | null>(null);

    useEffect(() => {
        if (error) setError(null);
    }, [email, password]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setIsLoading(true);
        setError(null);
        audioService.playConfirm();

        try {
            await (mode === 'signup'
                ? createUserWithEmailAndPassword(auth, email, password)
                : signInWithEmailAndPassword(auth, email, password)
            );
            onLoginSuccess();
        } catch (err: any) {
            console.error("Auth error:", err.code || err.message);
            const errorCode = err.code || 'unknown';
            let message = "Authentication failed. Please check your credentials.";

            switch (errorCode) {
                case 'auth/email-already-in-use':
                    message = "This email is already registered.";
                    break;
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    message = "Invalid email or password. Please try again.";
                    break;
                case 'auth/weak-password':
                    message = "Password should be at least 6 characters.";
                    break;
                case 'auth/api-key-not-valid':
                case 'auth/invalid-api-key':
                    message = "System Configuration Error. Reverting to Sandbox Mode.";
                    break;
            }
            setError({ code: errorCode, message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAccess = async () => {
        if (!isUsingMockAuth) return;
        setIsLoading(true);
        audioService.playStart();
        try {
            const guestEmail = "guest@mockmate.io";
            const guestPass = "sandbox123";
            try {
                await signInWithEmailAndPassword(auth, guestEmail, guestPass);
            } catch (e) {
                await createUserWithEmailAndPassword(auth, guestEmail, guestPass);
            }
            onLoginSuccess();
        } catch (err) {
            setError({ code: 'quick-access-fail', message: "Quick access failed. Please use manual registration." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearSandbox = () => {
        localStorage.removeItem('mockmate_mock_users');
        localStorage.removeItem('mockmate_current_user');
        localStorage.removeItem('mockmate_user_profile');
        window.location.reload();
    };

    const handleGoogleLogin = async () => {
        if (isUsingMockAuth) {
            setError({ code: 'mock/google-disabled', message: "Google Login is disabled in Sandbox Mode. Please use Email/Password." });
            return;
        }
        setIsLoading(true);
        setError(null);
        audioService.playStart();
        try {
            await signInWithPopup(auth, googleProvider);
            onLoginSuccess();
        } catch (err: any) {
            setError({ code: 'auth/google-failed', message: "Google sign-in failed. Ensure your Firebase Project has Google Auth enabled." });
        } finally {
            setIsLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                staggerChildren: 0.1,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            key="login"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="w-full max-w-[480px]"
        >
            <AppContainer className="p-0 overflow-hidden bg-[#0A192F]/40 backdrop-blur-2xl border-white/5 shadow-2xl" noPadding>
                {/* Elite Status Banner - Unified with Flow */}
                {isUsingMockAuth && (
                    <motion.div variants={itemVariants} className="bg-accent-amber/10 border-b border-accent-amber/20 py-3 px-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                            <span className="text-[10px] font-black text-accent-amber uppercase tracking-[0.25em]">Sandbox Active</span>
                        </div>
                        <button
                            onClick={handleClearSandbox}
                            className="text-[9px] font-black text-white/30 hover:text-white uppercase tracking-widest transition-all"
                        >
                            Reset System
                        </button>
                    </motion.div>
                )}

                <div className="p-8 md:p-14 space-y-8 md:space-y-10">
                    <motion.header variants={itemVariants} className="text-center space-y-3 md:space-y-4">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
                            {mode === 'signin' ? 'Welcome Back' : 'Join Elite'}
                        </h2>
                        <div className="flex flex-col items-center gap-1">
                            <div className="h-px w-12 bg-action-teal/40 mb-2" />
                            <p className="text-text-secondary text-[12px] md:text-[13px] font-medium opacity-60 leading-relaxed max-w-[280px] mx-auto">
                                {mode === 'signin'
                                    ? 'Enter your credentials to access your growth journal.'
                                    : 'Start your professional rehearsal journey today.'}
                            </p>
                        </div>
                    </motion.header>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="p-4 bg-alert-coral/5 border border-alert-coral/20 rounded-2xl flex flex-col items-center gap-2"
                            >
                                <p className="text-[10px] font-black text-alert-coral uppercase tracking-widest text-center leading-relaxed">
                                    {error.message}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.form variants={itemVariants} onSubmit={handleAuth} className="space-y-5 md:space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.25em] ml-2">Access Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 md:py-5 px-6 text-white text-sm focus:bg-white/[0.05] focus:border-action-teal/40 outline-none transition-all placeholder:text-white/10"
                                placeholder="name@domain.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.25em] ml-2">Private Key</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 md:py-5 px-6 text-white text-sm focus:bg-white/[0.05] focus:border-action-teal/40 outline-none transition-all placeholder:text-white/10"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="pt-2 md:pt-4 flex flex-col gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-action-teal text-base-surface font-black py-4 md:py-5 rounded-2xl text-[10px] md:text-[11px] uppercase tracking-[0.25em] hover:bg-[#15e0c6] hover:shadow-[0_20px_40px_-15px_rgba(20,200,176,0.3)] active:scale-[0.98] transition-all disabled:opacity-40"
                            >
                                {isLoading ? 'Authenticating...' : (mode === 'signin' ? 'Sign In' : 'Establish Profile')}
                            </button>

                            {isUsingMockAuth && (
                                <button
                                    type="button"
                                    onClick={handleQuickAccess}
                                    disabled={isLoading}
                                    className="w-full bg-white/5 text-white/40 border border-white/5 font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all active:scale-[0.98]"
                                >
                                    Quick Entry (Guest Mode)
                                </button>
                            )}
                        </div>
                    </motion.form>

                    {!isUsingMockAuth && (
                        <motion.div variants={itemVariants} className="space-y-6 md:space-y-8">
                            <div className="relative flex items-center gap-4">
                                <div className="h-px flex-grow bg-white/5" />
                                <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">Global Auth</span>
                                <div className="h-px flex-grow bg-white/5" />
                            </div>

                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-4 bg-white/5 hover:bg-white/10 text-white font-bold py-4 md:py-5 px-6 rounded-2xl border border-white/10 transition-all text-[10px] md:text-[11px] uppercase tracking-widest active:scale-[0.98]"
                            >
                                <GoogleIcon className="w-5 h-5" />
                                Continue with Google
                            </button>
                        </motion.div>
                    )}

                    <motion.div variants={itemVariants} className="pt-6 md:pt-10 flex flex-col items-center gap-5 md:gap-6">
                        <button
                            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
                            className="text-[10px] md:text-[11px] font-black text-info-blue hover:text-white uppercase tracking-[0.2em] transition-colors"
                        >
                            {mode === 'signin' ? "New here? Create Membership" : "Have an account? Access Portal"}
                        </button>

                        <button
                            onClick={onBack}
                            className="text-[9px] md:text-[10px] font-black text-white/20 hover:text-white/40 uppercase tracking-[0.3em] transition-all"
                        >
                            ← Back to Landing
                        </button>
                    </motion.div>
                </div>
            </AppContainer>
        </motion.div>
    );
};

export default Login;

