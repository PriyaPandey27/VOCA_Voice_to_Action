import React from 'react';
import { Settings as SettingsIcon, Mic, Volume2, Database, Shield, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white shadow-xs">
          <SettingsIcon size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">System Settings</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Speech recognition synthesis, local SQLite storage engine, and AI privacy configurations.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Voice & Speech */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Mic size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Speech Recognition & Voice Synthesis</h2>
              <p className="text-xs text-slate-500 font-medium">Native browser audio stack configuration</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Speech-to-Text Engine</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 size={11} />
                  Active
                </span>
              </div>
              <p className="text-slate-600 font-medium">Web Speech API (High-accuracy native browser speech recognition)</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Text-to-Speech Engine</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  <Volume2 size={11} />
                  Enabled
                </span>
              </div>
              <p className="text-slate-600 font-medium">Natural synthesis voice with Indian English (en-IN) preference</p>
            </div>
          </div>
        </div>

        {/* Database & Storage */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Database size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Persistent SQLite Database</h2>
              <p className="text-xs text-slate-500 font-medium">Local single-source of truth without cloud tracking</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Local Database File: voca.db</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            </div>
            <p className="text-slate-600 font-medium leading-relaxed">
              All financial transactions, action items, reminders, and historical audit logs are persisted directly to SQLite. Zero fabricated statistics or simulated records are permitted per VOCA Data Accuracy rules.
            </p>
          </div>
        </div>

        {/* AI & Intelligence */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-violet-50 text-violet-600 border border-violet-100">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">AI Intent Parsing & Privacy</h2>
              <p className="text-xs text-slate-500 font-medium">Dual-tier natural language processing engine</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs space-y-2">
            <span className="font-bold text-slate-900 block">Google Gemini 2.0 Flash + Regex Fallback</span>
            <p className="text-slate-600 font-medium leading-relaxed">
              Spoken natural language utterances are parsed into strongly-typed <code className="text-slate-900 font-mono font-semibold">ActionIntent</code> payloads. When offline or without an API key, VOCA automatically falls back to deterministic local rule engines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
