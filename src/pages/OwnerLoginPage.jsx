import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';
import { friendlyError } from '../utils';

export default function OwnerLoginPage() {
  const navigate = useNavigate();
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);

    const email = form.email.trim();
    const password = form.password;

    try {
      if (isSetupMode) {
        if (!form.name.trim()) {
          setError('Please enter the gym owner name.');
          setBusy(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setBusy(false);
          return;
        }
        if (password !== form.confirmPassword) {
          setError('Passwords do not match.');
          setBusy(false);
          return;
        }

        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: form.name.trim(),
              role: 'admin'
            }
          }
        });
        if (signUpErr) throw signUpErr;

        if (data?.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              name: form.name.trim(),
              role: 'admin'
            });
          } catch (pe) {
            console.warn('Owner profile notice:', pe);
          }
        }

        if (data?.session) {
          navigate('/dashboard', { replace: true });
        } else {
          setSuccess('Owner account created! Check your email to confirm, then sign in.');
          setIsSetupMode(false);
        }
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInErr) throw signInErr;
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    const email = form.email.trim();
    if (!email) {
      setError('Please enter your owner email address first.');
      return;
    }
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email);
      if (resetErr) throw resetErr;
      setSuccess('Password reset link sent to your email inbox.');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand" style={{ marginBottom: 12 }}>
          Roxy <span>GYM</span>
        </div>
        <div
          className="brand-sub"
          style={{
            fontSize: 12,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            fontWeight: 800,
            color: 'var(--accent, #f59e0b)',
            marginBottom: 20
          }}
        >
          Gym Owner Management Portal
        </div>

        <h1>{isSetupMode ? 'Create Owner Account' : 'Owner Sign In'}</h1>
        <p>
          {isSetupMode
            ? 'Set up your administrator credentials to manage Roxy Gym members, subscriptions, and revenue.'
            : 'Sign in with your Gym Owner credentials to manage member registrations and database records.'}
        </p>

        {!supabaseConfigured && (
          <div className="notice" style={{ marginTop: 14 }}>
            Supabase credentials are missing or placeholder in configuration.
          </div>
        )}

        <div
          style={{
            display: 'flex',
            background: 'var(--surface, #1e293b)',
            borderRadius: 10,
            padding: 4,
            margin: '20px 0 16px',
            border: '1px solid var(--border, #334155)'
          }}
        >
          <button
            type="button"
            className="tab"
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 8,
              border: 0,
              cursor: 'pointer',
              background: !isSetupMode ? 'var(--accent, #f59e0b)' : 'transparent',
              color: !isSetupMode ? '#000' : 'var(--muted, #94a3b8)',
              transition: 'all 0.15s ease'
            }}
            onClick={() => {
              setIsSetupMode(false);
              setError('');
              setSuccess('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className="tab"
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 8,
              border: 0,
              cursor: 'pointer',
              background: isSetupMode ? 'var(--accent, #f59e0b)' : 'transparent',
              color: isSetupMode ? '#000' : 'var(--muted, #94a3b8)',
              transition: 'all 0.15s ease'
            }}
            onClick={() => {
              setIsSetupMode(true);
              setError('');
              setSuccess('');
            }}
          >
            First-Time Setup
          </button>
        </div>

        {isSetupMode && (
          <div
            className="notice"
            style={{
              fontSize: 12,
              lineHeight: 1.45,
              borderColor: 'var(--accent, #f59e0b)',
              marginBottom: 16
            }}
          >
            🔒 <strong>Owner Account Only:</strong> This application is strictly for the Gym Owner. Members do not have access and are registered from the dashboard.
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSetupMode && (
            <div className="field">
              <label>Gym Owner Name</label>
              <input
                required
                type="text"
                placeholder="e.g. John Doe / Owner"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}

          <div className="field">
            <label>Owner Email</label>
            <input
              type="email"
              required
              placeholder="owner@roxygym.com"
              autoComplete="username"
              autoCapitalize="none"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              <button
                type="button"
                className="text-btn"
                style={{ fontSize: 11, padding: 0 }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              minLength={6}
              required
              placeholder="••••••••"
              autoComplete={isSetupMode ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {isSetupMode && (
            <div className="field">
              <label>Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                minLength={6}
                required
                placeholder="••••••••"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </div>
          )}

          {error && <div className="error-text">{error}</div>}
          {success && (
            <div
              className="notice"
              style={{
                color: 'var(--green, #10b981)',
                borderColor: 'var(--green, #10b981)',
                fontSize: 12
              }}
            >
              ✓ {success}
            </div>
          )}

          <button className="primary-btn" disabled={busy || !supabaseConfigured} style={{ marginTop: 8 }}>
            {busy ? 'Please wait...' : isSetupMode ? 'Create Owner Account' : 'Sign In as Gym Owner'}
          </button>
        </form>

        {!isSetupMode && (
          <div className="auth-links" style={{ justifyContent: 'center', marginTop: 18 }}>
            <button type="button" className="text-btn" onClick={handleResetPassword} disabled={busy}>
              Forgot password?
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
