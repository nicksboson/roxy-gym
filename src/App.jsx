import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Show, SignIn, useUser } from '@clerk/react';
import AppShell from './components/AppShell';

export default function App() {
  const { user } = useUser();

  // We map the Clerk user to the app's expected profile format
  const profile = user ? {
    id: user.id,
    uid: user.id,
    name: user.fullName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Gym Owner',
    email: user.primaryEmailAddress?.emailAddress || '',
    role: 'admin',
    photoURL: user.imageUrl || ''
  } : null;

  return (
    <>
      <Show when="signed-out">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
          <SignIn routing="hash" />
        </div>
      </Show>
      <Show when="signed-in">
        <Routes>
          <Route path="/login" element={<Navigate to="/members" replace />} />
          <Route path="/*" element={<AppShell user={profile} profile={profile} />} />
        </Routes>
      </Show>
    </>
  );
}
