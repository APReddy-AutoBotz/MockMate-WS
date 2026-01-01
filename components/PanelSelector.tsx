
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PERSONAS_CONFIG, Persona } from '../personas.config';
import { useIsMobile } from '../hooks/useIsMobile';

interface PanelSelectorProps {
    selectedPanelIDs: string[];
    onSelectionChange: (ids: string[]) => void;
    matchReasons?: Record<string, string>;
}

const PanelSelector: React.FC<PanelSelectorProps> = ({ selectedPanelIDs, onSelectionChange, matchReasons }) => {
    const isMobile = useIsMobile();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);

    const selectedPersonas = selectedPanelIDs.map(id => PERSONAS_CONFIG.find(p => p.id === id)).filter(Boolean) as Persona[];

    const openModal = (slotIndex: number) => {
        setActiveSlot(slotIndex);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setActiveSlot(null);
    };

    const handlePersonaSelect = (personaId: string) => {
        if (activeSlot === null) return;
        const newSelection = [...selectedPanelIDs];
        newSelection[activeSlot] = personaId;
        onSelectionChange(newSelection);
        closeModal();
    };

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {selectedPersonas.map((persona, index) => (
                    <motion.div
                        key={persona.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => openModal(index)}
                        className="relative group p-4 md:p-6 bg-[#162741]/50 border border-white/5 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 transition-all hover:bg-[#162741] hover:border-white/20 cursor-pointer overflow-hidden min-h-[80px] md:min-h-[90px]"
                    >
                        {/* Icon Circle */}
                        <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 border-[#EA580C] bg-[#EA580C]/10 text-white shadow-[0_0_15px_rgba(234,88,12,0.2)]">
                            <persona.icon className="w-6 h-6 md:w-7 md:h-7" />
                        </div>

                        <div className="text-left flex flex-col justify-center gap-0.5 md:gap-1">
                            <div>
                                <p className="font-black text-white text-base md:text-xl tracking-tight leading-none group-hover:text-action-teal transition-colors">
                                    {persona.name}
                                </p>
                                <p className="text-[10px] md:text-[11px] font-black text-info-blue/60 uppercase tracking-widest mt-1">
                                    {persona.title}
                                </p>
                            </div>

                            <div className="min-h-[30px] md:min-h-[40px] flex flex-col justify-center">
                                {matchReasons && matchReasons[persona.id] ? (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-[9px] md:text-[11px] text-text-secondary font-medium leading-relaxed italic border-l border-white/10 pl-2 md:pl-3 py-0.5 md:py-1"
                                    >
                                        "{matchReasons[persona.id]}"
                                    </motion.p>
                                ) : (
                                    <p className="text-[9px] md:text-[11px] text-text-secondary/40 font-medium leading-relaxed italic border-l border-white/5 pl-2 md:pl-3 py-0.5 md:py-1">
                                        "{persona.blurb}"
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="absolute top-3 md:top-4 right-3 md:right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <span className="text-[8px] md:text-[9px] text-info-blue font-black uppercase tracking-[0.2em] bg-info-blue/10 px-2 py-1 rounded">Swap Expert</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal for Selecting Personas */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#0A192F]/95 backdrop-blur-2xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0D213F] border border-white/10 rounded-3xl md:rounded-[3rem] p-6 md:p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8 md:mb-12">
                                <h3 className="text-2xl md:text-4xl font-serif font-bold text-white">Select Panel Expert</h3>
                                <button onClick={closeModal} className="label-pill text-[10px] md:text-xs text-text-secondary hover:text-white transition-colors">Close</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {PERSONAS_CONFIG.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => handlePersonaSelect(p.id)}
                                        className={`p-5 md:p-8 text-left bg-white/[0.03] border border-white/5 rounded-xl md:rounded-2xl hover:border-action-teal/40 hover:bg-white/[0.08] transition-all flex items-start gap-4 md:gap-6 group ${selectedPanelIDs.includes(p.id) ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        disabled={selectedPanelIDs.includes(p.id)}
                                    >
                                        <div className="p-3 md:p-4 rounded-full border-2 border-[#EA580C] bg-[#EA580C]/10 shrink-0">
                                            <p.icon className="w-5 h-5 md:w-8 md:h-8 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base md:text-xl text-white mb-0.5 md:mb-1 group-hover:text-action-teal transition-colors">{p.name}</h4>
                                            <p className="text-[11px] md:text-sm text-text-secondary mb-2 md:mb-3 opacity-60 tracking-tight">{p.title}</p>
                                            <p className="text-[11px] md:text-sm text-text-secondary/80 leading-relaxed italic">"{p.blurb}"</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PanelSelector;

