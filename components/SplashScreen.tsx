import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './icons/Logo';

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [showSecondary, setShowSecondary] = useState(false);

    useEffect(() => {
        // Show secondary text after logo appears
        const secondaryTimer = setTimeout(() => setShowSecondary(true), 800);

        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 600);
        }, 2800);

        return () => {
            clearTimeout(timer);
            clearTimeout(secondaryTimer);
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
                    style={{
                        background: 'radial-gradient(ellipse at center, #0f1f3d 0%, #0A192F 50%, #020508 100%)'
                    }}
                >
                    {/* Animated Grid Background */}
                    <div className="absolute inset-0 opacity-20">
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `
                                    linear-gradient(rgba(20, 200, 176, 0.1) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(20, 200, 176, 0.1) 1px, transparent 1px)
                                `,
                                backgroundSize: '50px 50px',
                                animation: 'gridSlide 20s linear infinite'
                            }}
                        />
                    </div>

                    {/* Glowing Orbs */}
                    <motion.div
                        className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-action-teal/20 rounded-full blur-[120px]"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.2, 0.3, 0.2]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-info-blue/15 rounded-full blur-[120px]"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.15, 0.25, 0.15]
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    />

                    {/* Floating Particles */}
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-action-teal rounded-full"
                            style={{
                                left: `${20 + (i * 10)}%`,
                                top: `${30 + (i * 5)}%`
                            }}
                            animate={{
                                y: [0, -100, 0],
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0]
                            }}
                            transition={{
                                duration: 3 + (i * 0.3),
                                repeat: Infinity,
                                delay: i * 0.4,
                                ease: "easeInOut"
                            }}
                        />
                    ))}

                    {/* Main Content */}
                    <div className="relative z-10 flex flex-col items-center">
                        {/* Logo with dramatic entrance */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
                            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                            transition={{
                                duration: 1.2,
                                ease: [0.34, 1.56, 0.64, 1],
                                delay: 0.2
                            }}
                            className="relative"
                        >
                            {/* Glow ring behind logo */}
                            <motion.div
                                className="absolute inset-0 -m-8 bg-gradient-to-r from-action-teal/30 to-info-blue/30 rounded-full blur-2xl"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.3, 0.6, 0.3]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />

                            <Logo className="relative h-28 w-auto sm:h-36 md:h-44 drop-shadow-2xl" />
                        </motion.div>

                        {/* Brand Name with stagger effect */}
                        <AnimatePresence>
                            {showSecondary && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-10 flex flex-col items-center gap-6"
                                >
                                    {/* MockMate text with letter animation */}
                                    <div className="flex items-center gap-1 overflow-hidden">
                                        {'MockMate'.split('').map((letter, i) => (
                                            <motion.span
                                                key={i}
                                                initial={{ opacity: 0, y: 50 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.5,
                                                    delay: i * 0.05,
                                                    ease: [0.22, 1, 0.36, 1]
                                                }}
                                                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight"
                                                style={{
                                                    background: 'linear-gradient(135deg, #ffffff 0%, #14C8B0 100%)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                    textShadow: '0 0 40px rgba(20, 200, 176, 0.3)'
                                                }}
                                            >
                                                {letter}
                                            </motion.span>
                                        ))}
                                    </div>

                                    {/* Tagline with shine effect */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.6, duration: 0.6 }}
                                        className="relative overflow-hidden px-6 py-2 rounded-full bg-gradient-to-r from-action-teal/10 to-info-blue/10 border border-action-teal/20"
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                            animate={{ x: ['-100%', '200%'] }}
                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                        />
                                        <p className="relative text-sm sm:text-base text-action-teal font-black tracking-[0.3em] uppercase">
                                            ACE YOUR INTERVIEW
                                        </p>
                                    </motion.div>

                                    {/* Subtitle */}
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.9, duration: 0.8 }}
                                        className="text-xs sm:text-sm text-white/40 font-medium tracking-wider uppercase"
                                    >
                                        AI Interview Coach
                                    </motion.p>

                                    {/* Premium loading bar */}
                                    <motion.div
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 200 }}
                                        transition={{ delay: 1.2, duration: 0.6 }}
                                        className="relative h-1 bg-white/10 rounded-full overflow-hidden mt-4"
                                    >
                                        <motion.div
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-action-teal via-info-blue to-action-teal rounded-full"
                                            animate={{ x: ['-100%', '200%'] }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            style={{ width: '50%' }}
                                        />
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Scan line effect (subtle) */}
                    <motion.div
                        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-action-teal/30 to-transparent"
                        animate={{ y: [0, '100vh'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
