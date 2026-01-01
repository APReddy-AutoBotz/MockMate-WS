
import React from 'react';
import { SessionControls } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

interface SessionControlsEditorProps {
    controls: SessionControls;
    onChange: (newControls: SessionControls) => void;
}

const ToggleSwitch: React.FC<{
    isOn: boolean;
    onToggle: () => void;
    activeColor?: string;
}> = ({ isOn, onToggle, activeColor = 'bg-info-blue' }) => (
    <button
        onClick={onToggle}
        className={`relative w-12 md:w-14 h-6 md:h-7 rounded-full transition-all duration-300 ease-in-out border-2 ${isOn
            ? `${activeColor} border-transparent shadow-[0_0_15px_rgba(56,189,248,0.4)]`
            : 'bg-[#0A192F] border-white/10'
            }`}
    >
        <div className={`
            absolute top-0.5 w-4 md:w-5 h-4 md:h-5 rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out
            ${isOn ? 'left-[26px] md:left-[30px]' : 'left-0.5'}
        `} />
    </button>
);

const SessionControlsEditor: React.FC<SessionControlsEditorProps> = ({ controls, onChange }) => {
    const isMobile = useIsMobile();

    const setPresetCount = (difficulty: 'starter' | 'intermediate' | 'expert') => {
        let newCount = 15;
        if (difficulty === 'starter') newCount = 7;
        if (difficulty === 'expert') newCount = 25;

        onChange({
            ...controls,
            difficulty,
            totalQuestions: newCount
        });
    }

    return (
        <div className="space-y-8 md:space-y-12">
            {/* Mode Selection */}
            <div className="flex flex-col space-y-4 bg-white/[0.03] p-5 md:p-6 rounded-2xl border border-white/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h4 className="text-xs md:text-sm font-bold text-white uppercase tracking-wider">Preparation Mode</h4>
                        <p className="text-[10px] md:text-xs text-text-secondary mt-1">Choose how AI generates your session</p>
                    </div>
                    <div className="flex bg-[#0A192F] p-1 rounded-xl border border-white/10 w-full md:w-auto overflow-x-auto">
                        <button
                            onClick={() => onChange({ ...controls, sourceMode: 'job_description' })}
                            className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all whitespace-nowrap ${controls.sourceMode === 'job_description' ? 'bg-info-blue text-[#0A192F]' : 'text-text-secondary hover:text-white'}`}
                        >
                            JD Exploration
                        </button>
                        <button
                            onClick={() => onChange({ ...controls, sourceMode: 'question_bank' })}
                            className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all whitespace-nowrap ${controls.sourceMode === 'question_bank' ? 'bg-accent-amber text-[#0A192F]' : 'text-text-secondary hover:text-white'}`}
                        >
                            Question Bank
                        </button>
                    </div>
                </div>
                <p className="text-[9px] md:text-[11px] text-info-blue/80 italic border-t border-white/5 pt-3">
                    {controls.sourceMode === 'job_description'
                        ? "✨ AI will search the web for trending questions and mix them with JD requirements."
                        : "🔒 AI will strictly stick to your provided material/dump, ensuring exact phrasing variations."}
                </p>
            </div>

            {/* Volume and Sophistication Tier Row */}
            <div className="space-y-4 md:space-y-5">
                <div className="flex justify-between items-baseline px-1">
                    <label className="text-xs md:text-sm font-bold text-white tracking-tight">Difficulty & Volume</label>
                    <span className="text-[10px] md:text-sm font-bold text-info-blue">{controls.totalQuestions} Questions</span>
                </div>
                <div className="grid grid-cols-3 gap-2 md:grid-cols-3 md:gap-4">
                    {(['starter', 'intermediate', 'expert'] as const).map(d => (
                        <button
                            key={d}
                            onClick={() => setPresetCount(d)}
                            className={`flex flex-col items-center justify-center gap-1.5 md:gap-2 py-4 md:py-6 rounded-xl md:rounded-2xl border transition-all ${controls.difficulty === d
                                ? 'bg-info-blue/10 border-info-blue text-white shadow-[0_0_20px_rgba(56,189,248,0.1)]'
                                : 'bg-white/[0.03] text-text-secondary border-white/5 hover:border-white/10 hover:bg-white/[0.05]'
                                }`}
                        >
                            <span className="text-[9px] md:text-xs font-black uppercase tracking-widest">{d}</span>
                            <span className="text-[8px] md:text-[10px] opacity-60 font-mono text-center">
                                {d === 'starter' ? '7 Qs' : d === 'intermediate' ? '15 Qs' : '25 Qs'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tactical Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="flex flex-col items-center justify-between p-5 md:p-6 bg-white/[0.03] rounded-xl md:rounded-2xl border border-white/5 transition-all hover:bg-white/[0.05]">
                    <div className="w-full flex justify-between items-center mb-3 md:mb-4">
                        <label className="text-xs md:text-sm font-bold text-white tracking-tight">Coach Mode</label>
                        <ToggleSwitch
                            isOn={controls.sessionMode === 'coach'}
                            onToggle={() => onChange({ ...controls, sessionMode: controls.sessionMode === 'coach' ? 'exam' : 'coach' })}
                        />
                    </div>
                    <p className="text-[9px] md:text-[11px] text-text-secondary font-medium text-left w-full leading-relaxed">
                        If enabled, AI will provide hints and real-time feedback after every answer.
                    </p>
                </div>

                <div className="flex flex-col items-center justify-between p-5 md:p-6 bg-white/[0.03] rounded-xl md:rounded-2xl border border-white/5 transition-all hover:bg-white/[0.05]">
                    <div className="w-full flex justify-between items-center mb-3 md:mb-4">
                        <label className="text-xs md:text-sm font-bold text-white tracking-tight">Coding Questions</label>
                        <ToggleSwitch
                            isOn={!!controls.includeCoding}
                            onToggle={() => onChange({ ...controls, includeCoding: !controls.includeCoding })}
                            activeColor="bg-action-teal"
                        />
                    </div>
                    <p className="text-[9px] md:text-[11px] text-text-secondary font-medium text-left w-full leading-relaxed">
                        Include algorithmic challenges (requires technical persona).
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SessionControlsEditor;

