import React, { useState } from 'react';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { VoiceButton } from './VoiceButton';
import { Send, Volume2, VolumeX, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VoiceWidgetProps {
  onCommandExecuted?: () => void;
}

export const VoiceWidget: React.FC<VoiceWidgetProps> = ({ onCommandExecuted }) => {
  const {
    state,
    transcript,
    interimTranscript,
    response,
    startListening,
    stopListening,
    sendTextCommand,
    isMuted,
    toggleMute,
    error,
  } = useVoiceAssistant();

  const [textInput, setTextInput] = useState('');
  const navigate = useNavigate();

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    await sendTextCommand(textInput);
    setTextInput('');
    onCommandExecuted?.();
  };

  const stateLabels: Record<string, string> = {
    IDLE: 'Ready to listen',
    LISTENING: 'Listening to your voice...',
    PROCESSING: 'AI analyzing intent...',
    EXECUTING: 'Updating database...',
    SPEAKING: 'Speaking response...',
    ERROR: 'Attention needed',
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 md:p-6 shadow-xs relative overflow-hidden">
      {/* Subtle decorative glow */}
      <div className="absolute right-0 top-0 w-72 h-72 bg-indigo-50/60 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        {/* Left: Status & Input */}
        <div className="flex-1 w-full space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>Voice Action Console</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              </h3>
              <span className="text-xs font-semibold text-slate-500">· {stateLabels[state]}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isMuted
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={14} className="text-rose-600" /> : <Volume2 size={14} className="text-slate-700" />}
              </button>
              <button
                onClick={() => navigate('/voice')}
                className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 font-semibold transition-colors"
              >
                <span>Full Stage</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Transcript / Response Display */}
          {(transcript || interimTranscript || response) && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-1.5 border-l-4 border-l-indigo-600">
              {transcript && (
                <p className="text-slate-900 font-semibold">
                  <span className="text-indigo-600 text-[10px] uppercase tracking-wide mr-1.5 font-bold">You:</span>
                  "{transcript}"
                  <span className="text-slate-500 italic"> {interimTranscript}</span>
                </p>
              )}
              {response && (
                <p className="text-emerald-800 font-semibold pt-1 border-t border-slate-200">
                  <span className="text-emerald-600 text-[10px] uppercase tracking-wide mr-1.5 font-bold">VOCA:</span>
                  {response.spoken_text || response.response_text}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-md border border-rose-200">
              {error}
            </p>
          )}

          {/* Text Input */}
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type a command (e.g. 'I spent 250 on lunch', 'Create task to study')..."
              className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || state === 'PROCESSING' || state === 'EXECUTING'}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 shadow-sm shadow-indigo-500/25 transition-all"
            >
              <span>Execute</span>
              <Send size={13} />
            </button>
          </form>
        </div>

        {/* Right: Voice Button */}
        <div className="shrink-0 flex flex-col items-center">
          <VoiceButton
            state={state}
            onStart={startListening}
            onStop={stopListening}
            size="md"
          />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-2">
            {state === 'IDLE' ? 'Tap to Speak' : state}
          </span>
        </div>
      </div>
    </div>
  );
};
