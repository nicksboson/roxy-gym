import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { compressImage } from '../utils';

// Shim navigator.mediaDevices.getUserMedia
if (typeof navigator !== 'undefined') {
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      const getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
      }

      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }
}

function CameraCapture({ onPhotoChange, initialPhoto = '' }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [preview, setPreview] = useState(initialPhoto || '');
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const activeReqRef = useRef(0);

  // Sync external initialPhoto updates
  useEffect(() => {
    setPreview(initialPhoto || '');
  }, [initialPhoto]);

  // Turn off hardware tracks and release webcam
  const turnOffCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
        video.srcObject = null;
      } catch {
        // ignore
      }
    }
    setIsReady(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      turnOffCamera();
    };
  }, [turnOffCamera]);

  // Stream lifecycle when isCapturing is true
  useEffect(() => {
    if (!isCapturing) {
      turnOffCamera();
      return;
    }

    const currentReq = ++activeReqRef.current;
    setError('');
    setIsReady(false);

    let isCancelled = false;

    const startCamera = async () => {
      // Release any prior stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
          try {
            t.stop();
          } catch {
            // ignore
          }
        });
        streamRef.current = null;
      }

      const modeConstraint = facingMode === 'environment' ? { ideal: 'environment' } : 'user';

      const tiers = [
        {
          audio: false,
          video: {
            facingMode: modeConstraint,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        {
          audio: false,
          video: {
            facingMode: modeConstraint
          }
        },
        {
          audio: false,
          video: true
        },
        {
          video: true
        }
      ];

      let stream = null;
      let lastError = null;

      for (const c of tiers) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(c);
          if (stream) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (isCancelled || activeReqRef.current !== currentReq) {
        if (stream) stream.getTracks().forEach(t => t.stop());
        return;
      }

      if (!stream) {
        console.warn('Camera stream failed:', lastError);
        setError(lastError?.message || 'Camera permission denied or camera device is unavailable.');
        return;
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('autoplay', '');
        video.srcObject = stream;

        const p = video.play();
        if (p !== undefined && typeof p.then === 'function') {
          p.then(() => {
            if (!isCancelled) setIsReady(true);
          }).catch(err => {
            console.warn('Autoplay waiting for ready/frame:', err);
          });
        }
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      turnOffCamera();
    };
  }, [isCapturing, facingMode, turnOffCamera]);

  // Capture photo from video feed
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const vw = video.videoWidth || video.clientWidth || 640;
    const vh = video.videoHeight || video.clientHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');

    // Mirror image if front camera so saved photo matches the user's mirror view
    if (facingMode === 'user') {
      ctx.translate(vw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, vw, vh);

    canvas.toBlob(
      blob => {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setPreview(dataUrl);
        onPhotoChange(blob || dataUrl, dataUrl);
        turnOffCamera();
        setIsCapturing(false);
      },
      'image/jpeg',
      0.92
    );
  };

  // Flip camera between front and rear
  const flipCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  // Cancel live camera and return to preview
  const cancelCamera = () => {
    turnOffCamera();
    setIsCapturing(false);
    setError('');
  };

  // Remove photo
  const removePhoto = () => {
    setPreview('');
    onPhotoChange(null, '');
  };

  // Upload photo from device files
  const chooseFile = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    try {
      const { blob, dataUrl } = await compressImage(file, 500, 500, 0.85);
      setPreview(dataUrl);
      onPhotoChange(blob, dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target.result;
        setPreview(dataUrl);
        onPhotoChange(file, dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="camera-capture">
      {/* Live In-Form Camera Viewfinder Mode */}
      {isCapturing ? (
        <div className="camera-live-box">
          <div
            className="camera-live-viewfinder"
            onClick={() => {
              const v = videoRef.current;
              if (v && v.paused) {
                v.play().then(() => setIsReady(true)).catch(() => {});
              }
            }}
            title="Live camera view"
          >
            {/* Live badge */}
            <span className="camera-live-badge">
              ● Live Camera
            </span>

            {/* Subtle face positioning guide */}
            <div className="camera-face-guide" />

            {/* Video element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onCanPlay={() => setIsReady(true)}
              onLoadedData={() => setIsReady(true)}
              onPlaying={() => setIsReady(true)}
              className={facingMode === 'user' ? 'camera-mirrored' : ''}
            />

            {/* Loading placeholder while camera hardware turns on */}
            {!isReady && !error && (
              <div className="camera-live-loading">
                <div className="camera-spinner" />
                <span>Starting camera...</span>
              </div>
            )}

            {/* Error display if camera blocked */}
            {error && (
              <div className="camera-live-error">
                <div className="camera-error-icon">📷⚠️</div>
                <strong>Camera Unavailable</strong>
                <p>{error}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    className="camera-btn-capture"
                    onClick={() => {
                      setError('');
                      setFacingMode(prev => prev);
                    }}
                  >
                    Try Again
                  </button>
                  <label className="camera-btn-cancel file-button">
                    Upload File
                    <input type="file" accept="image/*" onChange={e => { chooseFile(e); cancelCamera(); }} />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons under live viewfinder */}
          {!error && (
            <div className="camera-live-actions">
              <button
                type="button"
                className="camera-btn-cancel"
                onClick={cancelCamera}
                title="Cancel camera and keep previous photo"
              >
                ✕ Cancel
              </button>

              <button
                type="button"
                className="camera-btn-capture"
                onClick={capturePhoto}
                disabled={!isReady}
                title={isReady ? 'Capture photo' : 'Waiting for camera feed...'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>{isReady ? 'Capture Photo' : 'Connecting...'}</span>
              </button>

              <button
                type="button"
                className="camera-btn-flip"
                onClick={flipCamera}
                title="Flip between front and back camera"
                aria-label="Flip camera"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>Flip</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Normal State: Photo Avatar Frame & Buttons */
        <>
          <div className="photo-avatar-frame">
            {preview ? (
              <div className="photo-avatar-wrap">
                <img className="photo-avatar" src={preview} alt="Member photo preview" />
                <span className="photo-avatar-badge" title="Photo selected">✓</span>
              </div>
            ) : (
              <div
                className="photo-avatar-empty"
                onClick={() => setIsCapturing(true)}
                role="button"
                tabIndex={0}
                title="Click to take member photo"
              >
                <div className="photo-avatar-empty-inner">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Take Photo</span>
                </div>
              </div>
            )}
          </div>

          <div className="camera-form-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => setIsCapturing(true)}
              title="Open camera to take member photo"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>{preview ? 'Retake Photo' : 'Take Photo'}</span>
            </button>

            <label className="outline-btn file-button" title="Choose photo from files">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{preview ? 'Change Photo' : 'Upload Photo'}</span>
              <input type="file" accept="image/*" onChange={chooseFile} />
            </label>

            {preview && (
              <button
                type="button"
                className="text-btn danger-text"
                onClick={removePhoto}
                title="Remove current photo"
                style={{ fontSize: 13, padding: '4px 8px' }}
              >
                ✕ Remove
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default memo(CameraCapture);
