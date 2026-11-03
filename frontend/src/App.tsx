import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { VoiceAssistant } from './pages/VoiceAssistant';
import { Expenses } from './pages/Expenses';
import { Tasks } from './pages/Tasks';
import { Reminders } from './pages/Reminders';
import { CommandHistory } from './pages/CommandHistory';
import { Contacts } from './pages/Contacts';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="voice" element={<VoiceAssistant />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="history" element={<CommandHistory />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
