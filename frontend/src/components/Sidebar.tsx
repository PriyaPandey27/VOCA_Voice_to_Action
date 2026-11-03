import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  Receipt,
  CheckSquare,
  Bell,
  History,
  Users,
  Settings,
  Database,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/voice', label: 'Voice Assistant', icon: Mic },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/reminders', label: 'Reminders', icon: Bell },
    { to: '/contacts', label: 'Contacts', icon: Users },
    { to: '/history', label: 'Activity History', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-60 h-screen bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 shadow-2xs">
      <div>
        {/* Brand */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-xs">
              <span className="text-white font-extrabold text-sm tracking-tight">V</span>
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900">VOCA</h1>
              <p className="text-[11px] font-semibold text-slate-500">Voice Productivity</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-2.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold border-l-3 border-l-indigo-600 shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-3 m-3 rounded-xl border border-slate-200/90 bg-slate-50/70 shadow-2xs">
        <div className="flex items-center gap-1.5 mb-0.5 text-slate-900 font-bold text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SQLite Engine Active</span>
        </div>
        <p className="text-[10px] font-medium text-slate-500 leading-tight">
          Strict database truth · Zero fake data
        </p>
      </div>
    </aside>
  );
};
