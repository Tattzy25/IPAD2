import React from 'react';
import { motion } from 'motion/react';
import { Maximize2, Headphones } from 'lucide-react';

const IPAD_IMAGE_URL =
  'https://pub-9b2398b039ea4fe288988ee883a0fa48.r2.dev/815ebaa3-90b6-4a70-8f2a-4347dc10d1c3.png';

interface CollapsedPillProps {
  isSessionActive?: boolean;
  statusText?: string;
  onClick?: () => void;
}

export const CollapsedPill: React.FC<CollapsedPillProps> = ({
  isSessionActive = false,
  statusText,
  onClick,
}) => {
  return (
    <motion.div
      key="bubble-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeInOut' }}
      onClick={onClick}
      className="w-full h-full flex items-center justify-between z-20 cursor-pointer select-none"
    >
      {/* Left: Circle logo slot with the same iPad image & title */}
      <div className="flex items-center gap-2 pl-0.5">
        <div
          id="pill-logo-slot"
          className="w-8 h-8 rounded-full overflow-hidden border border-white/30 flex items-center justify-center shadow-inner flex-shrink-0 bg-black relative"
          title="Logo"
        >
          {isSessionActive ? (
            <div className="w-full h-full bg-emerald-950 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
          ) : (
            <img
              src={IPAD_IMAGE_URL}
              alt="Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full select-none"
              draggable={false}
            />
          )}

          {isSessionActive && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-black" />
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-white/90 font-bold uppercase tracking-[0.12em] group-hover:text-white transition-colors truncate max-w-[140px]">
            {isSessionActive ? 'Agent Active' : '2027 iPad'}
          </span>
          {statusText ? (
            <span className="text-[9px] text-emerald-400 font-semibold truncate max-w-[140px] -mt-0.5">
              {statusText}
            </span>
          ) : isSessionActive ? (
            <span className="text-[9px] text-neutral-400 truncate max-w-[140px] -mt-0.5">
              Session stays active
            </span>
          ) : null}
        </div>
      </div>

      {/* Right: Expand cue */}
      <div className="flex items-center gap-1 text-white/60 group-hover:text-white transition-colors">
        <span className="text-[9.5px] uppercase tracking-widest opacity-80 font-bold">
          {isSessionActive ? 'Ask' : 'Open'}
        </span>
        <Maximize2 className="w-3.5 h-3.5" />
      </div>
    </motion.div>
  );
};

export default CollapsedPill;
