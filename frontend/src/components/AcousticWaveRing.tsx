import React from 'react';
import type { VoiceState } from '../types';
import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';

interface AcousticWaveRingProps {
  state: VoiceState;
  onToggle: () => void;
  size?: number;
}

export const AcousticWaveRing: React.FC<AcousticWaveRingProps> = ({
  state,
  onToggle,
  size = 280,
}) => {
  const isListening = state === 'LISTENING';
  const isProcessing = state === 'PROCESSING';
  const isExecuting = state === 'EXECUTING';
  const isSpeaking = state === 'SPEAKING';
  const isError = state === 'ERROR';

  const getGradientColors = () => {
    switch (state) {
      case 'LISTENING':
        return ['#F43F5E', '#E11D48', '#FDA4AF'];
      case 'PROCESSING':
        return ['#6366F1', '#8B5CF6', '#A855F7'];
      case 'EXECUTING':
        return ['#0EA5E9', '#6366F1', '#38BDF8'];
      case 'SPEAKING':
        return ['#10B981', '#059669', '#34D399'];
      case 'ERROR':
        return ['#EF4444', '#DC2626', '#F87171'];
      default:
        return ['#6366F1', '#4F46E5', '#818CF8'];
    }
  };

  const getGlowBg = () => {
    switch (state) {
      case 'LISTENING':
        return 'rgba(244, 63, 94, 0.15)';
      case 'PROCESSING':
        return 'rgba(99, 102, 241, 0.15)';
      case 'SPEAKING':
        return 'rgba(16, 185, 129, 0.15)';
      default:
        return 'rgba(99, 102, 241, 0.08)';
    }
  };

  const colors = getGradientColors();

  return (
    <div
      className="relative flex items-center justify-center select-none cursor-pointer group"
      style={{ width: size, height: size }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-label="Toggle voice assistant"
    >
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl transition-all duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${getGlowBg()} 0%, transparent 70%)`,
          transform: isListening || isSpeaking ? 'scale(1.2)' : 'scale(1)',
        }}
      />

      {/* Dynamic Animated Wave Ring SVG */}
      <svg
        className={`w-full h-full transition-transform duration-500 ${
          isProcessing || isExecuting ? 'animate-spin-slow' : ''
        }`}
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="proWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.9" />
            <stop offset="50%" stopColor={colors[1]} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors[2]} stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="proWaveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors[2]} stopOpacity="0.7" />
            <stop offset="100%" stopColor={colors[0]} stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Outer subtle guide ring */}
        <circle
          cx="150"
          cy="150"
          r="138"
          stroke="#E2E8F0"
          strokeWidth="1.5"
          strokeDasharray="4 8"
        />

        {/* Dynamic Acoustic Wave Outer Path */}
        <circle
          cx="150"
          cy="150"
          r="122"
          stroke="url(#proWaveGrad1)"
          strokeWidth={isListening ? 4 : 2.5}
          className="transition-all duration-300"
        />

        {/* Inner acoustic ripple */}
        <circle
          cx="150"
          cy="150"
          r="102"
          stroke="url(#proWaveGrad2)"
          strokeWidth="2"
          strokeDasharray={isListening || isSpeaking ? '8 4' : 'none'}
          className="transition-all duration-300"
        />

        {/* Listening Ping Ring */}
        {isListening && (
          <circle
            cx="150"
            cy="150"
            r="128"
            stroke="#F43F5E"
            strokeWidth="1.5"
            strokeOpacity="0.5"
            className="animate-ping"
            style={{ animationDuration: '2s' }}
          />
        )}
      </svg>

      {/* Central interactive orb */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div
          className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-lg ${
            isListening
              ? 'bg-gradient-to-tr from-rose-600 to-red-600 text-white scale-110 shadow-rose-500/35'
              : isProcessing
              ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white scale-105 shadow-indigo-500/25'
              : isExecuting
              ? 'bg-gradient-to-tr from-sky-600 to-indigo-600 text-white scale-105 shadow-sky-500/25'
              : isSpeaking
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white scale-110 shadow-emerald-500/30'
              : isError
              ? 'bg-rose-600 text-white shadow-rose-500/30'
              : 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-indigo-500/30 group-hover:scale-105 group-hover:shadow-indigo-500/40'
          }`}
        >
          {isListening && <MicOff className="w-8 h-8 animate-pulse text-white" />}
          {isProcessing && <Loader2 className="w-8 h-8 animate-spin text-white" />}
          {isExecuting && <Loader2 className="w-8 h-8 animate-spin text-white" />}
          {isSpeaking && <Volume2 className="w-8 h-8 animate-pulse text-white" />}
          {isError && <AlertCircle className="w-8 h-8 text-white" />}
          {!isListening && !isProcessing && !isExecuting && !isSpeaking && !isError && (
            <Mic className="w-8 h-8 text-white transition-transform group-hover:scale-110" />
          )}

          <span className="text-[10px] font-bold tracking-wider uppercase mt-1 text-white/90">
            {state === 'IDLE' ? 'Speak' : state}
          </span>
        </div>
      </div>
    </div>
  );
};
