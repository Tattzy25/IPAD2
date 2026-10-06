import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IpadFrame } from './components/IpadFrame';
import { CollapsedPill } from './components/CollapsedPill';
import { SettingsModal } from './components/SettingsModal';
import { useRealtimeAgent } from './hooks/useRealtimeAgent';

const IPAD_IMAGE_URL =
  'https://pub-9b2398b039ea4fe288988ee883a0fa48.r2.dev/815ebaa3-90b6-4a70-8f2a-4347dc10d1c3.png';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Visualizer colors stored in localStorage for persistence
  const [aiSpeakingColor, setAiSpeakingColor] = useState<string>(() => {
    return localStorage.getItem('visualizer_ai_speaking_color') || '#d946ef'; // Magenta/Purple from video
  });
  const [listeningColor, setListeningColor] = useState<string>(() => {
    return localStorage.getItem('visualizer_listening_color') || '#22d3ee'; // Cyan from video
  });
  const [idleColor, setIdleColor] = useState<string>(() => {
    return localStorage.getItem('visualizer_idle_color') || '#facc15'; // Yellow from video
  });

  const { status, activeMode, frequencyData, connect, disconnect } =
    useRealtimeAgent();

  const handleAiSpeakingColorChange = (color: string) => {
    setAiSpeakingColor(color);
    localStorage.setItem('visualizer_ai_speaking_color', color);
  };

  const handleListeningColorChange = (color: string) => {
    setListeningColor(color);
    localStorage.setItem('visualizer_listening_color', color);
  };

  const handleIdleColorChange = (color: string) => {
    setIdleColor(color);
    localStorage.setItem('visualizer_idle_color', color);
  };

  // Preload the iPad image on mount for instant zero-latency rendering
  useEffect(() => {
    const img = new Image();
    img.src = IPAD_IMAGE_URL;
  }, []);

  // Allow closing with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSettingsOpen]);

  const smoothTransition = {
    duration: 0.4,
    ease: 'easeInOut' as const,
  };

  return (
    <div
      id="app-root"
      className={`h-screen w-full bg-white text-white flex flex-col items-center select-none overflow-hidden relative font-sans ${
        isOpen ? 'justify-end pb-3 px-4' : 'justify-end pb-[1px] px-4'
      }`}
      onClick={() => {
        if (isOpen) setIsOpen(false);
      }}
    >
      {/* Morphing high-gloss black iPad container / horizontal bubble */}
      <motion.div
        id="morphing-device-frame"
        layout
        initial={false}
        style={{ transformOrigin: 'bottom center' }}
        whileHover={!isOpen ? { scale: 1.03 } : undefined}
        whileTap={!isOpen ? { scale: 0.98 } : undefined}
        onClick={(e) => {
          e.stopPropagation();
          if (!isOpen) setIsOpen(true);
        }}
        transition={smoothTransition}
        className={`relative flex flex-col justify-between transition-colors overflow-hidden ${
          isOpen
            ? 'w-[min(94vw,840px)] h-11 sm:h-12 rounded-full cursor-default p-[2px] bezel-shadow ring-1 ring-white/10 bg-black'
            : 'w-64 h-11 rounded-full cursor-pointer pl-1 pr-3.5 py-1 bg-black border border-neutral-800 shadow-[0_12px_24px_-4px_rgba(0,0,0,0.25),0_4px_8px_-2px_rgba(0,0,0,0.15)] ring-1 ring-black/10'
        }`}
      >
        {/* Specular High-Gloss Diagonal Glass Reflection Overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-full gloss-reflection z-30"
        />

        {/* High-gloss white ring strip around border from inside of the pill */}
        {!isOpen && (
          <div
            id="pill-inner-gloss-ring"
            className="absolute inset-[2.5px] rounded-full border-[1.5px] border-white pointer-events-none z-20 shadow-[0_0_6px_rgba(255,255,255,0.85),inset_0_1px_1.5px_rgba(255,255,255,0.95)]"
          />
        )}

        {/* AnimatePresence for smooth cross-fading inside the morphing frame */}
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <CollapsedPill key="collapsed-pill" />
          ) : (
            <IpadFrame
              key="expanded-ipad"
              status={status}
              activeMode={activeMode}
              frequencyData={frequencyData}
              onConnect={connect}
              onDisconnect={disconnect}
              onOpenSettings={() => setIsSettingsOpen(true)}
              aiSpeakingColor={aiSpeakingColor}
              listeningColor={listeningColor}
              idleColor={idleColor}
              onClose={() => setIsOpen(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Settings Modal (opened via 3 dots button) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        aiSpeakingColor={aiSpeakingColor}
        onAiSpeakingColorChange={handleAiSpeakingColorChange}
        listeningColor={listeningColor}
        onListeningColorChange={handleListeningColorChange}
        idleColor={idleColor}
        onIdleColorChange={handleIdleColorChange}
      />
    </div>
  );
}
