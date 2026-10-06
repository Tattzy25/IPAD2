import React from 'react';
import { motion } from 'motion/react';
import { MoreVertical, X } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
import { AgentStatus } from '../hooks/useRealtimeAgent';
import { LiveCommerce } from './liveCommerce';

// Classic phone handset icons from the original soundbar file
const PhoneCallIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className || 'w-4 h-4'}
  >
    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.05 15.05 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 3.99c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
  </svg>
);

const PhoneHangupIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className || 'w-4 h-4'}
  >
    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.99.99 0 0 1 0-1.41C3.25 8.78 7.39 7 12 7c4.61 0 8.75 1.78 11.71 4.67.39.39.39 1.02 0 1.41l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
  </svg>
);

interface IpadFrameProps {
  imageUrl?: string;
  onClose: () => void;
  status: AgentStatus;
  activeMode: 'speaking' | 'listening' | 'idle';
  frequencyData: number[];
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenSettings: () => void;
  aiSpeakingColor: string;
  listeningColor: string;
  idleColor: string;
}

export const IpadFrame: React.FC<IpadFrameProps> = ({
  onClose,
  status,
  activeMode,
  frequencyData,
  onConnect,
  onDisconnect,
  onOpenSettings,
  aiSpeakingColor,
  listeningColor,
  idleColor,
}) => {
  return (
    <motion.div
      key="expanded-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="w-full h-full bg-[#0a0a0a] rounded-full overflow-hidden relative flex items-center justify-between px-5 sm:px-6"
    >
      {/* Left: Call and End (hangup) buttons side-by-side */}
      <div className="flex items-center gap-2 z-20">
        <button
          id="call-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onConnect();
          }}
          disabled={status === 'connected' || status === 'connecting'}
          className={`p-1 flex items-center justify-center transition-colors bg-transparent border-0 outline-none ${
            status === 'connecting'
              ? 'text-amber-400 animate-pulse cursor-wait'
              : status === 'connected'
              ? 'text-white/20 cursor-not-allowed'
              : 'text-[#22c55e] hover:text-[#4ade80] cursor-pointer active:scale-90'
          }`}
          title="Call"
          aria-label="Call"
        >
          <PhoneCallIcon className="w-4 h-4" />
        </button>

        <button
          id="hangup-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDisconnect();
          }}
          disabled={status === 'idle'}
          className={`p-1 flex items-center justify-center transition-colors bg-transparent border-0 outline-none ${
            status === 'connected' || status === 'connecting'
              ? 'text-red-500 hover:text-red-400 cursor-pointer active:scale-90'
              : 'text-white/20 cursor-not-allowed'
            }`}
          title="End"
          aria-label="End"
        >
          <PhoneHangupIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Audio Visualizer replacing the camera, with zero padding */}
      <div
        id="ipad-header-visualizer"
        className="flex items-center justify-center p-0 m-0 z-20"
      >
        <AudioVisualizer
          frequencyData={frequencyData}
          status={status}
          activeMode={activeMode}
          aiSpeakingColor={aiSpeakingColor}
          listeningColor={listeningColor}
          idleColor={idleColor}
        />
      </div>

      {/* Far Right: 3 vertical dots and X collapse button closer to each other */}
      <div className="flex items-center gap-1 z-20">
        <button
          id="options-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSettings();
          }}
          className="p-1 flex items-center justify-center text-white/70 hover:text-white transition-colors bg-transparent border-0 outline-none cursor-pointer active:scale-90"
          title="Settings (Visualizer Colors)"
          aria-label="Settings"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        <button
          id="close-ipad-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 flex items-center justify-center text-white/70 hover:text-white transition-colors bg-transparent border-0 outline-none cursor-pointer active:scale-90"
          title="Collapse to bubble"
          aria-label="Collapse to bubble"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Live Commerce Layer for Rendering Results */}
      <LiveCommerce className="fixed inset-0 pointer-events-none z-40" />
    </motion.div>
  );
};
export default IpadFrame;
