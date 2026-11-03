import { useState, useCallback, useEffect, useRef } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { processVoiceCommand } from '../services/api';
import type { VoiceState, VoiceCommandResponse, ActionResult } from '../types';

interface UseVoiceAssistantReturn {
  state: VoiceState;
  transcript: string;
  interimTranscript: string;
  response: VoiceCommandResponse | null;
  results: ActionResult[];
  startListening: () => void;
  stopListening: () => void;
  sendTextCommand: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  error: string | null;
  isProcessing: boolean;
  isSupported: boolean;
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('voca_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('voca_session_id', sessionId);
  }
  return sessionId;
}

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const [state, setState] = useState<VoiceState>('IDLE');
  const [response, setResponse] = useState<VoiceCommandResponse | null>(null);
  const [results, setResults] = useState<ActionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isProcessingRef = useRef(false);
  const lastTranscriptRef = useRef('');

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening: startSpeechRecognition,
    stopListening: stopSpeechRecognition,
    error: speechError,
    isSupported,
  } = useSpeechRecognition();

  const {
    speak,
    stop: stopSpeech,
    isSpeaking,
    isMuted,
    toggleMute,
  } = useSpeechSynthesis();

  // Update state based on current status
  useEffect(() => {
    if (isListening) {
      setState('LISTENING');
    }
  }, [isListening]);

  useEffect(() => {
    if (isSpeaking) {
      setState('SPEAKING');
    } else if (state === 'SPEAKING') {
      setState('IDLE');
    }
  }, [isSpeaking, state]);

  useEffect(() => {
    if (speechError) {
      setError(speechError);
      setState('ERROR');
      const timer = setTimeout(() => {
        setState('IDLE');
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [speechError]);

  // Process transcript when listening stops and we have a transcript
  useEffect(() => {
    if (
      !isListening &&
      transcript &&
      transcript !== lastTranscriptRef.current &&
      !isProcessingRef.current
    ) {
      lastTranscriptRef.current = transcript;
      processCommand(transcript);
    }
  }, [isListening, transcript]);

  const processCommand = useCallback(
    async (text: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      setState('PROCESSING');
      setError(null);

      try {
        const sessionId = getSessionId();
        setState('EXECUTING');
        const res = await processVoiceCommand(text, sessionId);
        setResponse(res);
        setResults(res.results || []);

        const spoken = res.spoken_text || res.response_text;
        if (spoken && !isMuted) {
          setState('SPEAKING');
          speak(spoken);
          // Safety timeout: guarantee state returns to IDLE if speech synthesis onend doesn't fire
          const timeoutMs = Math.min(8000, Math.max(2500, spoken.length * 80));
          setTimeout(() => {
            setState((curr) => (curr === 'SPEAKING' ? 'IDLE' : curr));
          }, timeoutMs);
        } else {
          setState('IDLE');
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to process command';
        setError(errorMsg);
        setState('ERROR');
        setTimeout(() => {
          setState('IDLE');
          setError(null);
        }, 3000);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [speak]
  );

  const startListening = useCallback(() => {
    setError(null);
    setResponse(null);
    setResults([]);
    lastTranscriptRef.current = '';
    startSpeechRecognition();
  }, [startSpeechRecognition]);

  const stopListening = useCallback(() => {
    stopSpeechRecognition();
  }, [stopSpeechRecognition]);

  const sendTextCommand = useCallback(
    async (text: string) => {
      if (!text.trim() || isProcessingRef.current) return;
      lastTranscriptRef.current = text;
      await processCommand(text.trim());
    },
    [processCommand]
  );

  const stopSpeaking = useCallback(() => {
    stopSpeech();
    setState('IDLE');
  }, [stopSpeech]);

  return {
    state,
    transcript,
    interimTranscript,
    response,
    results,
    startListening,
    stopListening,
    sendTextCommand,
    stopSpeaking,
    isMuted,
    toggleMute,
    error,
    isProcessing: isProcessingRef.current,
    isSupported,
  };
}
