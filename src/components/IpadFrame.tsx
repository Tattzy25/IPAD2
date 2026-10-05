import React from 'react';
import { motion } from 'motion/react';
import { MoreVertical, X } from 'lucide-react';
import { CollectionCards, CollectionItem } from './CollectionCards';
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
  isHoldingConnection?: boolean;
  collections?: CollectionItem[];
  showProducts?: boolean;
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
  isHoldingConnection = false,
  collections = [],
  showProducts = false,
}) => {
  const isConnecting = status === 'connecting' || isHoldingConnection;
  const hasCollections = collections && collections.length > 0;

  return (
    <motion.div
      key="expanded-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="w-full h-full bg-black overflow-hidden relative flex flex-col justify-between"
    >
      {/* Top Layer: Live Commerce Product Cards (if real products exist) */}
      {showProducts && (
        <div className="relative w-full flex-1 min-h-0 overflow-hidden">
          <LiveCommerce sessionActive={status === 'connected'} />
        </div>
      )}

      {/* Middle Layer: Collection Cards (only rendered if real collections exist) */}
      {hasCollections && (
        <div className="w-full flex-shrink-0 pt-2 pb-1 px-2 border-b border-white/10">
          <CollectionCards items={collections} />
        </div>
      )}

      {/* Bottom Header Bar */}
      <div className="h-11 sm:h-12 w-full flex items-center justify-between px-3 sm:px-5 flex-shrink-0 relative">
        {/* Left: Call and End (hangup) buttons side-by-side */}
        <div className="flex items-center gap-2 z-20 flex-shrink-0">
          <button
            id="call-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConnect();
            }}
            disabled={status === 'connected' || isConnecting}
            className={`p-1.5 rounded-full flex items-center justify-center transition-all bg-transparent border-0 outline-none ${
              status === 'connected' || isConnecting
                ? 'text-white/20 cursor-not-allowed'
                : 'text-[#22c55e] hover:text-[#4ade80] hover:bg-white/5 cursor-pointer active:scale-90'
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
            disabled={status === 'idle' && !isConnecting}
            className={`p-1.5 rounded-full flex items-center justify-center transition-all bg-transparent border-0 outline-none ${
              status === 'connected' || isConnecting
                ? 'text-red-500 hover:text-red-400 hover:bg-white/5 cursor-pointer active:scale-90'
                : 'text-white/20 cursor-not-allowed'
            }`}
            title="End"
            aria-label="End"
          >
            <PhoneHangupIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Audio Visualizer with zero padding */}
        <div
          id="ipad-header-visualizer"
          className="flex-1 flex items-center justify-center px-2 z-20 min-w-0 overflow-hidden"
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

        {/* Far Right: 3 vertical dots and X collapse button */}
        <div className="flex items-center gap-1 z-20 flex-shrink-0">
          <button
            id="options-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings();
            }}
            className="p-1.5 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 transition-all bg-transparent border-0 outline-none cursor-pointer active:scale-90"
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
            className="p-1.5 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 transition-all bg-transparent border-0 outline-none cursor-pointer active:scale-90"
            title="Collapse to bubble"
            aria-label="Collapse to bubble"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Connection Overlay with immediate Cancel Call button */}
        {isConnecting && (
          <div
            id="connection-hold-overlay"
            className="absolute inset-0 z-40 bg-black flex items-center justify-between px-4 sm:px-6 text-white rounded-full"
          >
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[12px] font-medium tracking-wide text-white/90">
                Connecting...
              </span>
            </div>

            {/* Cancel Call Button */}
            <button
              id="cancel-connecting-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDisconnect();
              }}
              className="px-2.5 py-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-xs border border-white/15"
              title="Cancel Call"
              aria-label="Cancel Call"
            >
              <span className="text-[11px] font-medium text-white/80">Cancel</span>
              <X className="w-3.5 h-3.5 text-white/70" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default IpadFrame;
