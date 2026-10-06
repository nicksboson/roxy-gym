import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ErrorPage Component
 * Displays a user-friendly error screen with diagnostic info,
 * retry mechanisms, and navigation options.
 *
 * @param {string} type - "error" | "404" | "profile" | "network"
 * @param {string} title - Optional custom headline
 * @param {string} message - Optional custom description
 * @param {Error|string} error - Caught error object or message
 * @param {object} errorInfo - React component stack trace
 * @param {function} onRetry - Optional callback when user clicks Retry
 * @param {boolean} inline - Render inside container instead of full viewport
 */
export default function ErrorPage({
  type = 'error',
  title,
  message,
  error,
  errorInfo,
  onRetry,
  inline = false
}) {
  const navigate = useNavigate ? safeUseNavigate() : null;
  const [copied, setCopied] = useState(false);

  // Fallback safe navigate if rendered outside Router context
  function safeUseNavigate() {
    try {
      return useNavigate();
    } catch {
      return null;
    }
  }

  const handleGoHome = () => {
    if (navigate) {
      navigate('/');
    } else {
      window.location.href = '/';
    }
  };

  const handleReload = () => {
    if (typeof onRetry === 'function') {
      onRetry();
    } else {
      window.location.reload();
    }
  };


  const errorMessage = error?.message || (typeof error === 'string' ? error : '');
  const errorStack = error?.stack || errorInfo?.componentStack || '';

  const copyDiagnosticInfo = () => {
    const report = [
      `Roxy GYM Error Report`,
      `Type: ${type}`,
      `Time: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      errorMessage ? `Error: ${errorMessage}` : '',
      errorStack ? `Stack:\n${errorStack}` : ''
    ].filter(Boolean).join('\n\n');

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  // Preset copy based on error type
  const config = {
    '404': {
      title: title || 'Page Not Found',
      message: message || "The page you are looking for doesn't exist, was removed, or the link has changed.",
      badge: '404',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      )
    },
    'profile': {
      title: title || 'Profile Unavailable',
      message: message || 'Your login credentials are valid, but your gym member profile could not be located.',
      badge: 'Profile Missing',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
          <line x1="18" y1="8" x2="22" y2="12" />
          <line x1="22" y1="8" x2="18" y2="12" />
        </svg>
      )
    },
    'network': {
      title: title || 'Connection Problem',
      message: message || 'Unable to connect to the gym server. Please check your internet connection and try again.',
      badge: 'Offline',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      )
    },
    'error': {
      title: title || 'Something Went Wrong',
      message: message || 'An unexpected issue occurred while processing this page. The system caught this error safely.',
      badge: 'Error',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    }
  }[type] || {
    title: title || 'Error Found',
    message: message || 'An unexpected problem occurred.',
    badge: 'Notice',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    )
  };

  return (
    <div
      className={`${inline ? 'error-container-inline' : 'error-screen'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="error-card">
        {/* Brand Header */}
        <div className="brand">
          Roxy <span>GYM</span>
        </div>
        <div className="brand-sub">Member management</div>

        {/* Visual Error Icon & Badge */}
        <div className={`error-icon-wrapper error-type-${type}`}>
          <div className="error-icon-circle">
            {config.icon}
          </div>
          <span className="error-badge">{config.badge}</span>
        </div>

        {/* Error Headline and Description */}
        <h1 className="error-title">{config.title}</h1>
        <p className="error-description">{config.message}</p>

        {/* Action Buttons */}
        <div className="error-actions">
          {type !== '404' && (
            <button
              type="button"
              className="primary-btn error-action-btn"
              onClick={handleReload}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              Try Again
            </button>
          )}

          <button
            type="button"
            className={`${type === '404' ? 'primary-btn' : 'secondary-btn'} error-action-btn`}
            onClick={handleGoHome}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go to Dashboard
          </button>
        </div>

        {/* Technical Details Accordion (for debugging) */}
        {(errorMessage || errorStack) && (
          <details className="error-details-collapsible">
            <summary className="error-details-summary">
              <span>View Technical Details</span>
              <span className="error-details-arrow">›</span>
            </summary>
            <div className="error-details-content">
              {errorMessage && (
                <div className="error-details-row">
                  <span className="error-details-label">Error Message:</span>
                  <code className="error-code-block">{errorMessage}</code>
                </div>
              )}
              {errorStack && (
                <div className="error-details-row">
                  <span className="error-details-label">Stack Trace:</span>
                  <pre className="error-stack-block">{errorStack}</pre>
                </div>
              )}
              <button
                type="button"
                className="text-btn copy-error-btn"
                onClick={copyDiagnosticInfo}
              >
                {copied ? '✓ Error Copied to Clipboard' : '📋 Copy Error Details'}
              </button>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
