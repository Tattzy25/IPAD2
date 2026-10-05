import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Radio } from 'lucide-react';

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
      {/* Left: Circle logo slot with pulsing live dot & live assistant label */}
      <div className="flex items-center gap-2.5 pl-0.5">
        <div
          id="pill-logo-slot"
          className="w-7 h-7 rounded-full overflow-hidden border border-white/20 flex items-center justify-center shadow-inner flex-shrink-0 bg-neutral-900 text-white"
          title="Live Shopping Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11.5px] text-white/90 font-semibold tracking-wide group-hover:text-white transition-colors">
            Live Shopping
          </span>
        </div>
      </div>

      {/* Right: Expand cue */}
      <div className="flex items-center gap-1 text-white/50 group-hover:text-white transition-colors pr-1">
        <Radio className="w-3 h-3 text-emerald-400" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-white/70">
          Talk
        </span>
      </div>
    </motion.div>
  );
};
export default CollapsedPill;


