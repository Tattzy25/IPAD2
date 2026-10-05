import React, { useEffect, useRef } from 'react';
import { AgentStatus } from '../hooks/useRealtimeAgent';

export interface VisualizerColors {
  aiSpeaking: string;
  listening: string;
  idle: string;
}

export const DEFAULT_VISUALIZER_COLORS: VisualizerColors = {
  aiSpeaking: '#f000ff', // Magenta / Purple from video
  listening: '#ffd700',  // Yellow / Gold from video
  idle: '#00f2fe',       // Teal / Cyan from video
};

interface VisualizerProps {
  status: AgentStatus;
  speakingMode: 'idle' | 'listening' | 'ai_speaking';
  analyserRef: React.RefObject<AnalyserNode | null>;
  colors?: VisualizerColors;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  status,
  speakingMode,
  analyserRef,
  colors = DEFAULT_VISUALIZER_COLORS,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;
    const barCount = 36; // High density waveform like in video
    const dataArray = new Uint8Array(64);

    const render = () => {
      phase += 0.06;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      let maxLevel = 0;
      if (analyserRef.current && status === 'connected') {
        try {
          analyserRef.current.getByteFrequencyData(dataArray);
          for (let i = 0; i < 32; i++) {
            if (dataArray[i] > maxLevel) maxLevel = dataArray[i];
          }
        } catch {
          // ignore
        }
      }

      // Determine active color based on speaking mode
      let activeColor = colors.idle;
      if (status === 'connected') {
        if (speakingMode === 'ai_speaking') {
          activeColor = colors.aiSpeaking;
        } else if (speakingMode === 'listening' || maxLevel > 25) {
          activeColor = colors.listening;
        } else {
          activeColor = colors.idle;
        }
      } else if (status === 'connecting') {
        activeColor = colors.idle;
      }

      const barWidth = 2;
      const gap = 2;
      const totalWidth = barCount * barWidth + (barCount - 1) * gap;
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < barCount; i++) {
        // Distance from center (0 at center, 1 at edges)
        const centerDist = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
        // Window function: bell curve tapering at edges
        const bellCurve = Math.max(0.08, 1 - Math.pow(centerDist, 1.8));

        let amp = 0.08;

        if (status === 'connected') {
          if (maxLevel > 15) {
            // Real audio reaction
            const freqIdx = Math.min(31, Math.floor((1 - centerDist) * 16));
            const raw = dataArray[freqIdx] || 0;
            const audioRatio = raw / 255;
            amp = Math.max(0.08, audioRatio * bellCurve * 1.1);
          } else {
            // Calm resting ambient wave
            const wave = Math.sin(phase * 1.5 + (1 - centerDist) * 3);
            amp = (0.08 + 0.12 * Math.abs(wave)) * bellCurve;
          }
        } else if (status === 'connecting') {
          // Gentle pulsing animation
          const pulse = Math.sin(phase * 2 + centerDist * 2);
          amp = (0.1 + 0.2 * Math.max(0, pulse)) * bellCurve;
        } else {
          // Idle state: crisp slim horizontal baseline with center prominence
          amp = 0.06 * bellCurve;
        }

        const barHeight = Math.max(2, amp * (height - 2));
        const x = startX + i * (barWidth + gap);
        const y = centerY - barHeight / 2;

        ctx.fillStyle = activeColor;
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = status === 'connected' && maxLevel > 20 ? 6 : 2;

        ctx.beginPath();
        const radius = barWidth / 2;
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [status, speakingMode, analyserRef, colors]);

  return (
    <div
      id="ipad-audio-visualizer"
      className="p-0 m-0 flex items-center justify-center select-none pointer-events-none"
      style={{ padding: 0, margin: 0 }}
    >
      <canvas
        ref={canvasRef}
        width={160}
        height={26}
        className="block p-0 m-0"
        style={{ padding: 0, margin: 0 }}
      />
    </div>
  );
};

export default Visualizer;
