import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { compressImage } from '../utils';

export default function OwnerSidebar({
  adminProfile = null,
  onSignOut = null
}) {
  const { isDark, toggleTheme, sidebarOpen, closeSidebar } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [photoURL, setPhotoURL] = useState(adminProfile?.photoURL || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPhotoURL(adminProfile?.photoURL || '');
  }, [adminProfile?.photoURL]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarOpen) closeSidebar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, closeSidebar]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  if (!sidebarOpen) return null;

  const displayName = adminProfile?.name || 'Gym Owner';
  const displaySubtitle = adminProfile?.email || 'Owner Account';
  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : 'O';

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !adminProfile?.id) return;
    e.target.value = '';
    setUploading(true);
    try {
      const { blob, dataUrl } = await compressImage(file, 256, 0.75);
      const fileName = `${adminProfile.id}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, blob || file, { contentType: 'image/jpeg', upsert: true });

      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);
        await supabase.from('profiles').update({ photo_url: publicUrl }).eq('id', adminProfile.id);
        setPhotoURL(publicUrl);
      } else {
        setPhotoURL(dataUrl);
      }
    } catch { /* ignore */ }
    finally { setUploading(false); }
  };

  const navLinks = [
    {
      label: 'Members List',
      path: '/members',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    {
      label: 'Performance & Revenue',
      path: '/performance',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12M2 12h4M18 12h4" />
        </svg>
      )
    },
    {
      label: 'Register New Member',
      path: '/register',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      )
    },
    {
      label: 'Membership Plans',
      path: '/plans',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      )
    },
    {
      label: 'Expiry Calendar',
      path: '/calendar',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    }
  ];

  return (
    <div className="sidebar-backdrop" onClick={closeSidebar}>
      <aside
        className="owner-sidebar"
        onClick={(e) => e.stopPropagation()}
        aria-label="Gym Owner Settings"
      >
        <div className="sidebar-header">
          <div className="sidebar-profile-info">
            {/* Clickable avatar to upload profile photo */}
            <label
              className="sidebar-avatar-circle"
              title="Tap to change profile photo"
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              {uploading ? (
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>⏳</div>
              ) : photoURL ? (
                <img src={photoURL} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                avatarLetter
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              <span style={{
                position: 'absolute', bottom: 0, right: 0,
                background: 'var(--accent)', borderRadius: '50%',
                width: 16, height: 16, fontSize: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', pointerEvents: 'none'
              }}>✏️</span>
            </label>
            <div>
              <div className="sidebar-profile-name">{displayName}</div>
              <div className="sidebar-profile-role">{displaySubtitle}</div>
              <div style={{ fontSize: 10, color: uploading ? 'var(--accent)' : 'var(--muted)', marginTop: 2 }}>
                {uploading ? 'Uploading...' : 'Tap avatar to change photo'}
              </div>
            </div>
          </div>
          <button type="button" className="sidebar-close-btn" onClick={closeSidebar} aria-label="Close menu">✕</button>
        </div>

        <div className="sidebar-scrollable-content">
          <section className="sidebar-section">
            <div className="sidebar-section-title"><span>Gym Management</span></div>
            <div style={{ display: 'grid', gap: 6 }}>
              {navLinks.map(link => {
                const isActive = location.pathname === link.path;
                return (
                  <button
                    key={link.path}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: isActive ? 'var(--surface-active, rgba(255,255,255,0.08))' : 'transparent',
                      border: '1.5px solid ' + (isActive ? 'var(--accent)' : 'var(--border)'),
                      color: isActive ? 'var(--accent)' : 'var(--ink)',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => {
                      closeSidebar();
                      navigate(link.path);
                    }}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="sidebar-section">
            <div className="sidebar-section-title"><span>Appearance</span></div>
            <div className="theme-toggle-row">
              <div className="theme-toggle-info">
                <span className="theme-toggle-label">Dark Mode</span>
                <span className="theme-toggle-subtext">
                  {isDark ? 'Full Black theme' : 'White & Black plain theme'}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isDark}
                className={`switch-toggle ${isDark ? 'checked' : ''}`}
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
              >
                <span className="switch-handle" />
              </button>
            </div>
          </section>


        </div>
      </aside>
    </div>
  );
}
