import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './icons/Logo';

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500); // Wait for exit animation
        }, 2000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#0A192F] via-[#1a2942] to-[#0A192F]"
                >
                    {/* Animated background particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-action-teal/10 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-info-blue/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>

                    {/* Logo and branding */}
                    <div className="relative z-10 flex flex-col items-center gap-8">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                duration: 0.8,
                                ease: [0.22, 1, 0.36, 1],
                                delay: 0.2
                            }}
                        >
                            <Logo className="h-24 w-auto sm:h-32 md:h-40 drop-shadow-2xl" />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.6,
                                delay: 0.6
                            }}
                            className="flex flex-col items-center gap-4"
                        >
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                MockMate
                            </h1>
                            <p className="text-xs sm:text-sm text-text-secondary font-medium tracking-wider uppercase">
                                AI Interview Coach
                            </p>
                        </motion.div>

                        {/* Loading indicator */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="flex gap-2 mt-8"
                        >
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-2 h-2 bg-action-teal rounded-full"
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [0.3, 1, 0.3]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.2
                                    }}
                                />
                            ))}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
