import { useState, useRef, useCallback, useEffect } from 'react';
import { BASE_CONTOUR } from '../components/AudioVisualizer';
import { discoverStoreDomain } from '../services/discovery';

export type AgentStatus = 'idle' | 'connecting' | 'connected' | 'error';

const NUM_BARS = BASE_CONTOUR.length; // 48 bars

interface UseRealtimeAgentOptions {
  onEvent?: (event: any) => void;
  onOpen?: () => void;
}

export function useRealtimeAgent(options: UseRealtimeAgentOptions = {}) {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [activeMode, setActiveMode] = useState<'speaking' | 'listening' | 'idle'>('idle');
  const [frequencyData, setFrequencyData] = useState<number[]>(() =>
    new Array(NUM_BARS).fill(0.05)
  );

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fallbackTimerRef = useRef<any>(null);

  const onEventRef = useRef(options.onEvent);
  onEventRef.current = options.onEvent;
  const onOpenRef = useRef(options.onOpen);
  onOpenRef.current = options.onOpen;

  const sendMessage = useCallback((text: string, responseInstructions?: string) => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') return;
    dcRef.current.send(
      JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text,
            },
          ],
        },
      })
    );
    const responsePayload: any = { type: 'response.create' };
    if (responseInstructions) {
      responsePayload.response = {
        instructions: responseInstructions,
        tool_choice: 'auto',
      };
    }
    dcRef.current.send(JSON.stringify(responsePayload));
  }, []);

  const disconnect = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
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

    // 2. Obtain client secret with dynamic domain discovered from .well-known/ucp
    const searchParams = new URLSearchParams(window.location.search);
    const discoveredDomain = await discoverStoreDomain();
    const clientDomain =
      searchParams.get('shop_domain') ||
      searchParams.get('domain') ||
      discoveredDomain;

    const res = await fetch('/api/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain: clientDomain }),
    });

    const sessionData = await res.json();
    const dynamicDomain = sessionData.domain || clientDomain || 'store.anigok.com';
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

    const dc = pc.createDataChannel('oai-events');
    dcRef.current = dc;

    dc.onopen = () => {
      console.log('[OpenAI Realtime DataChannel Opened]');
      const kickoffPrompt = `DO NOT START TALKING YET THIS IS THE INITIAL KICKOFF FOR YOUR LIVE SESSION START , CALL YOUR MCP TOOL search_catalog WITH ${dynamicDomain} GRAB THE COLLECTIONS AND DISPLAY THE COLLECTIONS ALL OF THEM .. JUST COLLECTION IMAGE AND NAME LABLE. IF THE STORE HAS NO COLLECTIONS, IMMEDIATELY DISPLAY THE FIRST 4 PRODUCTS INSTEAD. AS SOON AS THATS LOADED YOUR SESSION WITH START THE LIVE VOICE....`;
      const responseInstructions = `DO NOT SPEAK YET. Call your MCP tool search_catalog with shop_domain='${dynamicDomain}' to grab and display all collections. If no collections exist, display the first 4 products instead. Do not generate audio or speech until collections or products are rendered.`;

      dc.send(
        JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: kickoffPrompt,
              },
            ],
          },
        })
      );
      dc.send(
        JSON.stringify({
          type: 'response.create',
          response: {
            instructions: responseInstructions,
            tool_choice: 'auto',
          },
        })
      );

      // 15-second safety timer so the customer and agent are never held indefinitely
      fallbackTimerRef.current = setTimeout(() => {
        if (dc.readyState === 'open') {
          dc.send(
            JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [
                  {
                    type: 'input_text',
                    text: `Display the first 4 products from ${dynamicDomain} now.`,
                  },
                ],
              },
            })
          );
          dc.send(
            JSON.stringify({
              type: 'response.create',
            })
          );
        }
      }, 15000);

      if (onOpenRef.current) {
        onOpenRef.current();
      }
    };

    dc.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (onEventRef.current) {
        onEventRef.current(msg);
      }
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
    sendMessage,
  };
}
