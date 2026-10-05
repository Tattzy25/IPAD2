import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IpadFrame } from './components/IpadFrame';
import { CollapsedPill } from './components/CollapsedPill';
import { SettingsModal } from './components/SettingsModal';
import { useRealtimeAgent } from './hooks/useRealtimeAgent';
import { routeResult } from './components/liveCommerce/route';

const IPAD_IMAGE_URL =
  'https://pub-9b2398b039ea4fe288988ee883a0fa48.r2.dev/815ebaa3-90b6-4a70-8f2a-4347dc10d1c3.png';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Visualizer colors stored in localStorage for persistence
  const [aiSpeakingColor, setAiSpeakingColor] = useState<string>(() => {
    return localStorage.getItem('visualizer_ai_speaking_color') || '#ffffff'; // High-gloss pure white
  });
  const [listeningColor, setListeningColor] = useState<string>(() => {
    return localStorage.getItem('visualizer_listening_color') || '#e4e4e7'; // Sleek refined zinc
  });
  const [idleColor, setIdleColor] = useState<string>(() => {
    return localStorage.getItem('visualizer_idle_color') || '#52525b'; // Subtle graphite
  });

  const [isHoldingConnection, setIsHoldingConnection] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [showProducts, setShowProducts] = useState(false);

  const handleRealtimeEvent = useCallback((event: any) => {
    if (!event) return;

    // Detect function call output or MCP tool response from search_catalog
    const output =
      event.item?.output ||
      event.output ||
      event.delta ||
      event.response?.output?.[0]?.content?.[0]?.text;

    if (output) {
      const payload = typeof output === 'string' ? JSON.parse(output) : output;
      const routed = routeResult(payload);
      if (routed.products && routed.products.length > 0) {
        setShowProducts(true);
        setIsHoldingConnection(false);
      }
      if (payload.collections && Array.isArray(payload.collections) && payload.collections.length > 0) {
        setCollections(
          payload.collections.map((c: any) => ({
            id: c.id || c.handle || c.name,
            name: c.title || c.name,
            image: c.image?.src || c.image || c.featured_image,
          }))
        );
        setIsHoldingConnection(false);
      }
    }
  }, []);

  const { status, activeMode, frequencyData, connect, disconnect, sendMessage } =
    useRealtimeAgent({ onEvent: handleRealtimeEvent });

  useEffect(() => {
    if (status === 'idle') {
      setIsHoldingConnection(false);
      setCollections([]);
      setShowProducts(false);
    }
  }, [status]);

  const handleConnect = () => {
    setIsHoldingConnection(true);
    connect();
  };

  const handleDisconnect = () => {
    setIsHoldingConnection(false);
    setCollections([]);
    setShowProducts(false);
    disconnect();
  };

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
      className="h-screen w-full bg-white text-white flex flex-col items-center justify-end pb-4 px-4 select-none overflow-hidden relative font-sans"
      onClick={() => {
        if (isOpen) setIsOpen(false);
      }}
    >
      {/* Morphing high-gloss black container: compact bubble to long status pill */}
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
        className={`relative flex items-center justify-between transition-all overflow-hidden bg-black ${
          isOpen
            ? showProducts
              ? 'w-[min(94vw,760px)] h-[440px] sm:h-[460px] rounded-[36px] cursor-default p-[3px] border border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.95),inset_0_1px_1.5px_rgba(255,255,255,0.4)] ring-1 ring-white/10'
              : collections.length > 0
              ? 'w-[min(94vw,760px)] h-[152px] sm:h-[160px] rounded-[28px] cursor-default p-[3px] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_1.5px_rgba(255,255,255,0.4)] ring-1 ring-white/10'
              : 'w-[min(94vw,760px)] h-12 sm:h-13 rounded-full cursor-default p-[3px] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_1.5px_rgba(255,255,255,0.4)] ring-1 ring-white/10'
            : 'w-64 h-11 rounded-full cursor-pointer pl-1 pr-3.5 py-1 border border-neutral-800 shadow-[0_12px_24px_-4px_rgba(0,0,0,0.25),0_4px_8px_-2px_rgba(0,0,0,0.15)] ring-1 ring-black/10'
        }`}
      >
        {/* Specular High-Gloss Diagonal Glass Reflection Overlay */}
        <div
          className={`absolute inset-0 pointer-events-none gloss-reflection z-30 ${
            showProducts ? 'rounded-[36px]' : collections.length > 0 ? 'rounded-[28px]' : 'rounded-full'
          }`}
        />

        {/* High-gloss white ring strip around border */}
        <div
          id="pill-inner-gloss-ring"
          className={`absolute inset-[2px] border border-white/30 pointer-events-none z-20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] ${
            showProducts ? 'rounded-[34px]' : collections.length > 0 ? 'rounded-[26px]' : 'rounded-full'
          }`}
        />

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
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onOpenSettings={() => setIsSettingsOpen(true)}
              aiSpeakingColor={aiSpeakingColor}
              listeningColor={listeningColor}
              idleColor={idleColor}
              isHoldingConnection={isHoldingConnection}
              collections={collections}
              showProducts={showProducts}
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
