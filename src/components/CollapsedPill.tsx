import React from 'react';
import { motion } from 'motion/react';
import { Maximize2 } from 'lucide-react';

const IPAD_IMAGE_URL =
  'https://pub-9b2398b039ea4fe288988ee883a0fa48.r2.dev/815ebaa3-90b6-4a70-8f2a-4347dc10d1c3.png';

export const CollapsedPill: React.FC = () => {
  return (
    <motion.div
      key="bubble-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeInOut' }}
      className="w-full h-full flex items-center justify-between z-20"
    >
      {/* Left: Circle logo slot with the same iPad image & title */}
      <div className="flex items-center gap-2.5 pl-0.5">
        <div
          id="pill-logo-slot"
          className="w-8 h-8 rounded-full overflow-hidden border border-white/30 flex items-center justify-center shadow-inner flex-shrink-0 bg-black"
          title="Logo"
        >
          <img
            src={IPAD_IMAGE_URL}
            alt="Logo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-full select-none"
            draggable={false}
          />
        </div>
        <span className="text-[12px] text-white/80 font-medium uppercase tracking-[0.15em] group-hover:text-white transition-colors">
          2027 iPad
        </span>
      </div>

      {/* Right: Expand cue */}
      <div className="flex items-center gap-1 text-white/50 group-hover:text-white transition-colors">
        <span className="text-[10px] uppercase tracking-widest opacity-70">
          Open
        </span>
        <Maximize2 className="w-3.5 h-3.5" />
      </div>
    </motion.div>
  );
};
export default CollapsedPill;

