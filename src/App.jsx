import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';

// Auth is disabled — the app boots directly into the dashboard.
const STATIC_PROFILE = {
  id: 'owner',
  uid: 'owner',
  name: 'Gym Owner',
  email: '',
  role: 'admin',
  photoURL: ''
};

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<AppShell user={STATIC_PROFILE} profile={STATIC_PROFILE} />} />
    </Routes>
  );
}
