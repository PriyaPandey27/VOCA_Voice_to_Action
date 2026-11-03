import React from 'react';
import type { VoiceState } from '../types';
import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';

interface VoiceButtonProps {
  state: VoiceState;
  onStart: () => void;
  onStop: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  state,
  onStart,
  onStop,
  size = 'lg',
}) => {
  const sizeClasses = {
    sm: 'w-11 h-11',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const iconSize = {
    sm: 18,
    md: 22,
    lg: 32,
  };

  const handleClick = () => {
    if (state === 'LISTENING') {
      onStop();
    } else if (state === 'IDLE' || state === 'ERROR') {
      onStart();
    }
  };

  const getButtonClasses = (): string => {
    const base = `${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`;

    switch (state) {
      case 'IDLE':
        return `${base} bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 hover:scale-105 active:scale-95`;
      case 'LISTENING':
        return `${base} bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-lg shadow-rose-500/35 animate-pulse-ring`;
      case 'PROCESSING':
        return `${base} bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20 cursor-wait`;
      case 'EXECUTING':
        return `${base} bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20 cursor-wait`;
      case 'SPEAKING':
        return `${base} bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25`;
      case 'ERROR':
        return `${base} bg-rose-600 text-white shadow-md hover:bg-rose-500`;
      default:
        return base;
    }
  };

  const renderIcon = () => {
    const s = iconSize[size];
    switch (state) {
      case 'IDLE':
        return <Mic size={s} className="text-white" />;
      case 'LISTENING':
        return <MicOff size={s} className="text-white animate-pulse" />;
      case 'PROCESSING':
        return <Loader2 size={s} className="text-white animate-spin" />;
      case 'EXECUTING':
        return <Loader2 size={s} className="text-white animate-spin" />;
      case 'SPEAKING':
        return <Volume2 size={s} className="text-white animate-pulse" />;
      case 'ERROR':
        return <AlertCircle size={s} className="text-white" />;
      default:
        return <Mic size={s} className="text-white" />;
    }
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      {state === 'LISTENING' && (
        <span
          className={`absolute rounded-full bg-rose-500/30 animate-ping ${
            size === 'lg' ? 'inset-[-8px]' : size === 'md' ? 'inset-[-6px]' : 'inset-[-4px]'
          }`}
        />
      )}
      {state === 'SPEAKING' && (
        <span
          className={`absolute rounded-full bg-emerald-500/20 animate-pulse ${
            size === 'lg' ? 'inset-[-6px]' : size === 'md' ? 'inset-[-4px]' : 'inset-[-3px]'
          }`}
        />
      )}
      <button
        onClick={handleClick}
        className={getButtonClasses()}
        disabled={state === 'PROCESSING' || state === 'EXECUTING'}
        aria-label={
          state === 'LISTENING' ? 'Stop listening' : 'Start listening'
        }
      >
        {renderIcon()}
      </button>
    </div>
  );
};
