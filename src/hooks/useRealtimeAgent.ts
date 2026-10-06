import { useState, useRef, useCallback, useEffect } from 'react';
import { BASE_CONTOUR } from '../components/AudioVisualizer';

export type AgentStatus = 'idle' | 'connecting' | 'connected' | 'error';

const NUM_BARS = BASE_CONTOUR.length; // 48 bars

export function useRealtimeAgent() {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [activeMode, setActiveMode] = useState<'speaking' | 'listening' | 'idle'>('idle');
  const [frequencyData, setFrequencyData] = useState<number[]>(() =>
    new Array(NUM_BARS).fill(0.05)
  );

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const disconnect = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
      audioElementRef.current = null;
    }
    setStatus('idle');
    setActiveMode('idle');
    setFrequencyData(new Array(NUM_BARS).fill(0.05));
  }, []);

  const connect = useCallback(async () => {
    if (status === 'connecting' || status === 'connected') return;
    setStatus('connecting');

    // 1. FIRST: Ask native device permission for microphone
    let ms: MediaStream;
    try {
      ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = ms;
    } catch (permErr) {
      console.error('[Microphone Permission Denied]:', permErr);
      setStatus('idle');
      return;
    }

    // 2. Obtain client secret
    const res = await fetch('/api/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const sessionData = await res.json();
    const ephemeralKey =
      sessionData.client_secret?.value || sessionData.value || sessionData.key;

    if (!ephemeralKey) {
      console.error('[Realtime Agent Error] No ephemeral key returned:', sessionData);
      disconnect();
      return;
    }

    // 3. Audio Context & Analysers setup
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioCtx = new AudioContextClass();
    audioContextRef.current = audioCtx;
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    const userAnalyser = audioCtx.createAnalyser();
    userAnalyser.fftSize = 128;
    userAnalyser.smoothingTimeConstant = 0.7;
    userAnalyserRef.current = userAnalyser;

    const remoteAnalyser = audioCtx.createAnalyser();
    remoteAnalyser.fftSize = 128;
    remoteAnalyser.smoothingTimeConstant = 0.75;
    remoteAnalyserRef.current = remoteAnalyser;

    const audioEl = new Audio();
    audioEl.autoplay = true;
    audioElementRef.current = audioEl;

    // 4. WebRTC Peer Connection
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    ms.getTracks().forEach((track) => pc.addTrack(track, ms));

    const micSource = audioCtx.createMediaStreamSource(ms);
    micSource.connect(userAnalyser);

    pc.ontrack = (event) => {
      audioEl.srcObject = event.streams[0];
      const remoteSource = audioCtx.createMediaStreamSource(event.streams[0]);
      remoteSource.connect(remoteAnalyser);
    };

    const handleDataChannelEvent = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const w = window as any;
        if (w.LiveCommerce?.ingest) {
          if (data.type === 'response.function_call_arguments.done' || data.type === 'response.output_item.done') {
            const raw = data.item?.formatted?.output || data.arguments || data;
            w.LiveCommerce.ingest(raw);
          } else if (data.products || data.product || data.cart || data.checkout || data.order) {
            w.LiveCommerce.ingest(data);
          }
        }
      } catch (_) {}
    };

    const dc = pc.createDataChannel('oai-events');
    dc.onmessage = handleDataChannelEvent;
    pc.ondatachannel = (e) => {
      e.channel.onmessage = handleDataChannelEvent;
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // 5. Connect to OpenAI Realtime GA endpoint with model=gpt-realtime-1.5
    const callsUrl = 'https://api.openai.com/v1/realtime/calls?model=gpt-realtime-1.5';
    const sdpResponse = await fetch(callsUrl, {
      method: 'POST',
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        'Content-Type': 'application/sdp',
      },
    });

    const answerSdp = await sdpResponse.text();

    if (!sdpResponse.ok || !answerSdp.startsWith('v=')) {
      console.error('[OpenAI Realtime Calls Error]:', sdpResponse.status, answerSdp);
      disconnect();
      return;
    }

    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    setStatus('connected');

    const bufferLength = 64;
    const userDataArray = new Uint8Array(bufferLength);
    const remoteDataArray = new Uint8Array(bufferLength);

    const renderLoop = () => {
      userAnalyser.getByteFrequencyData(userDataArray);
      remoteAnalyser.getByteFrequencyData(remoteDataArray);

      let userSum = 0;
      let remoteSum = 0;
      for (let i = 0; i < bufferLength; i++) {
        userSum += userDataArray[i];
        remoteSum += remoteDataArray[i];
      }
      const userAvg = userSum / bufferLength;
      const remoteAvg = remoteSum / bufferLength;

      // Determine state: AI Speaking vs User Speaking (Listening) vs Idle
      if (remoteAvg > 3) {
        setActiveMode('speaking');
      } else if (userAvg > 6) {
        setActiveMode('listening');
      } else {
        setActiveMode('idle');
      }

      const activeArray = remoteAvg > 3 ? remoteDataArray : userDataArray;
      const currentAvg = Math.max(remoteAvg, userAvg);

      const bars: number[] = [];
      for (let i = 0; i < NUM_BARS; i++) {
        const binIndex = Math.min(
          bufferLength - 1,
          Math.floor((i / NUM_BARS) * 48)
        );
        const rawVal = activeArray[binIndex] / 255;
        const contour = BASE_CONTOUR[i] || 0.5;

        if (currentAvg > 3) {
          const dynamicVal = Math.min(1, rawVal * 1.6 * (0.5 + contour * 0.7));
          bars.push(Math.max(0.05, dynamicVal));
        } else {
          bars.push(0.05);
        }
      }

      setFrequencyData(bars);
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        disconnect();
      }
    };
  }, [disconnect, status]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    activeMode,
    frequencyData,
    connect,
    disconnect,
  };
}
