import React from 'react';
import { useIsMobile, useIsPWA } from '../hooks/useIsMobile';

interface AppContainerProps {
    children: React.ReactNode;
    className?: string;
    removeGlass?: boolean; // Explicitly remove glass effects
    noPadding?: boolean;   // Remove default padding
}

/**
 * Mobile-optimized container that automatically flattens nested glass effects
 * and provides app-like spacing on mobile devices
 */
const AppContainer: React.FC<AppContainerProps> = ({
    children,
    className = '',
    removeGlass = false,
    noPadding = false
}) => {
    const isMobile = useIsMobile();
    const isPWA = useIsPWA();

    // On mobile, we flatten the design - no glass, minimal borders
    const baseClasses = isMobile || isPWA
        ? 'bg-transparent' // No background on mobile
        : 'bg-[#0A192F]/40 backdrop-blur-2xl border border-white/5'; // Glass on desktop

    // Apply glass removal override if specified
    const glassClasses = removeGlass
        ? 'bg-transparent border-0'
        : baseClasses;

    // Padding: mobile gets minimal, desktop gets generous
    const paddingClasses = noPadding
        ? ''
        : isMobile || isPWA
            ? 'p-4'
            : 'p-8 md:p-12';

    // Rounding: less aggressive on mobile
    const roundingClasses = isMobile || isPWA ? 'rounded-xl' : 'rounded-[2.5rem]';

    return (
        <div
            className={`
                ${glassClasses} 
                ${paddingClasses} 
                ${roundingClasses} 
                transition-all duration-300
                ${className}
            `.trim()}
        >
            {children}
        </div>
    );
};

export default AppContainer;
