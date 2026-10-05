import React from 'react';
import { AgentStatus } from '../hooks/useRealtimeAgent';

export const BASE_CONTOUR = [
  0.25, 0.4, 0.55, 0.45, 0.75, 0.95, 0.6, 1.0, 0.8, 0.55,
  0.9, 1.0, 0.7, 0.85, 0.95, 0.75, 0.5, 0.8, 0.95, 0.65,
  1.0, 0.75, 0.55, 0.9, 1.0, 0.8, 0.95, 0.6, 1.0, 0.85,
  0.5, 0.75, 0.9, 0.6, 1.0, 0.7, 0.85, 0.55, 0.95, 0.65,
  0.8, 0.5, 0.7, 0.45, 0.6, 0.4, 0.3, 0.2
];

interface AudioVisualizerProps {
  frequencyData: number[];
  status: AgentStatus;
  activeMode: 'speaking' | 'listening' | 'idle';
  aiSpeakingColor: string;
  listeningColor: string;
  idleColor: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  frequencyData,
  status,
  activeMode,
  aiSpeakingColor,
  listeningColor,
  idleColor,
}) => {
  const bars = frequencyData || [];

  const barColor =
    status === 'connected'
      ? activeMode === 'speaking'
        ? aiSpeakingColor
        : activeMode === 'listening'
        ? listeningColor
        : idleColor
      : '#3f3f46'; // Muted dark neutral when disconnected

  return (
    <div
      id="header-audio-visualizer"
      className="flex items-center justify-center gap-[2px] sm:gap-[2.5px] p-0 m-0 h-7 select-none"
    >
      {bars.map((val, index) => {
        let heightPx = 3;

        // Only animate when connected AND someone is actually talking
        if (status === 'connected' && activeMode !== 'idle') {
          heightPx = Math.max(3, Math.min(26, val * 26));
        }

        return (
          <div
            key={index}
            style={{
              height: `${heightPx}px`,
              backgroundColor: barColor,
              boxShadow:
                status === 'connected' && activeMode !== 'idle'
                  ? `0 0 6px ${barColor}`
                  : undefined,
            }}
            className="w-[2px] sm:w-[2.5px] rounded-full transition-[height,background-color] duration-75 p-0 m-0"
          />
        );
      })}
    </div>
  );
};

export default AudioVisualizer;
