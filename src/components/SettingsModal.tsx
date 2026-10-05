import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiSpeakingColor: string;
  onAiSpeakingColorChange: (color: string) => void;
  listeningColor: string;
  onListeningColorChange: (color: string) => void;
  idleColor: string;
  onIdleColorChange: (color: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  aiSpeakingColor,
  onAiSpeakingColorChange,
  listeningColor,
  onListeningColorChange,
  idleColor,
  onIdleColorChange,
}) => {
  const [activeTab, setActiveTab] = useState<'speaking' | 'listening' | 'idle'>('speaking');

  if (!isOpen) return null;

  const currentColor =
    activeTab === 'speaking'
      ? aiSpeakingColor
      : activeTab === 'listening'
      ? listeningColor
      : idleColor;

  const handleColorChange = (newColor: string) => {
    if (activeTab === 'speaking') onAiSpeakingColorChange(newColor);
    else if (activeTab === 'listening') onListeningColorChange(newColor);
    else onIdleColorChange(newColor);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[360px] bg-[#121214] border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-white">Settings</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visualizer Gradients / Colors */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-neutral-300">
            Visualizer Gradients
          </label>
          <div className="flex items-center gap-2 bg-[#1c1c1f] p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('speaking')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'speaking'
                  ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              AI Speaking
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('listening')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'listening'
                  ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Listening
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('idle')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'idle'
                  ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Idle
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-10 h-10 rounded-full cursor-pointer bg-transparent border-0 outline-none"
            />
            <span className="font-mono text-xs text-neutral-300 uppercase">
              {currentColor}
            </span>
          </div>
        </div>

        {/* Save & Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <Check className="w-4 h-4" />
          Save & Close
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
