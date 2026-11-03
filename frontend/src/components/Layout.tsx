import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <Outlet />
      </main>

      {/* Footer System Bar */}
      <footer className="border-t border-slate-200/80 py-4 bg-white text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-800 font-semibold">VOCA Engine 2.0</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600">Voice-to-Action Active</span>
          </div>
          <div className="text-slate-500 text-[11px] flex items-center gap-2">
            <span>SQLite Database</span>
            <span>·</span>
            <span>Web Speech API</span>
            <span>·</span>
            <span>Google Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
