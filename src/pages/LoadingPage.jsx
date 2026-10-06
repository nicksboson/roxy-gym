import React from 'react';

/**
 * LoadingPage Component
 * Provides a responsive, branded loading screen for app initialization,
 * auth state checking, and route transitions.
 *
 * @param {string} message - Primary status message (default: "Loading Roxy GYM...")
 * @param {string} subtext - Secondary hint message (default: "Preparing your gym dashboard...")
 * @param {boolean} inline - If true, renders within content flow instead of full viewport
 * @param {string} className - Optional additional CSS class
 */
export default function LoadingPage({
  message = 'Loading Roxy GYM...',
  subtext = 'Preparing your gym dashboard...',
  inline = false,
  className = ''
}) {
  return (
    <div
      className={`${inline ? 'loading-container-inline' : 'loading-screen'} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="loading-card">
        {/* Brand Header */}
        <div className="brand">
          Roxy <span>GYM</span>
        </div>
        <div className="brand-sub">Member management</div>

        {/* Animated Visual Loader */}
        <div className="loading-visual" aria-hidden="true">
          <div className="loading-spinner-ring" />
          <div className="loading-spinner-core">
            <svg
              className="loading-gym-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Dumbbell SVG icon */}
              <path d="M6 5v14" />
              <path d="M18 5v14" />
              <path d="M2 9v6" />
              <path d="M22 9v6" />
              <path d="M6 12h12" />
              <rect x="5" y="7" width="2" height="10" rx="1" />
              <rect x="17" y="7" width="2" height="10" rx="1" />
            </svg>
          </div>
        </div>

        {/* Status Message */}
        <h2 className="loading-title">{message}</h2>
        {subtext && <p className="loading-subtext">{subtext}</p>}

        {/* Linear Progress Bar */}
        <div className="loading-progress-track" aria-hidden="true">
          <div className="loading-progress-bar" />
        </div>
      </div>
    </div>
  );
}
