import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';

/**
 * GlassBottomNav
 * Authentic Apple-style floating frosted glass bottom navigation bar with a fluid
 * sliding glass pill capsule indicator that glides between buttons (Members, Overview, Register).
 */
export default function GlassBottomNav({
  tabs = [],
  activeTab = 0,
  onTabSelect,
  useNavLinks = false,
  isSwipeRoute = false,
  className = ''
}) {
  const navRef = useRef(null);
  const tabRefs = useRef([]);
  const isInitialMount = useRef(true);
  const [pillStyle, setPillStyle] = useState({
    left: 0,
    top: 5,
    width: 0,
    height: 0,
    ready: false,
    animate: false
  });

  const syncPill = useCallback(() => {
    const nav = navRef.current;
    const activeEl = tabRefs.current[activeTab];
    if (!nav || !activeEl) return;

    const navRect = nav.getBoundingClientRect();
    const tabRect = activeEl.getBoundingClientRect();

    const left = tabRect.left - navRect.left;
    const top = tabRect.top - navRect.top;
    const width = tabRect.width;
    const height = tabRect.height;

    if (width <= 0 || height <= 0) return;

    setPillStyle(prev => {
      if (
        prev.ready &&
        Math.abs(prev.left - left) < 0.5 &&
        Math.abs(prev.top - top) < 0.5 &&
        Math.abs(prev.width - width) < 0.5 &&
        Math.abs(prev.height - height) < 0.5
      ) {
        return prev;
      }

      return {
        left,
        top,
        width,
        height,
        ready: true,
        animate: !isInitialMount.current
      };
    });

    if (isInitialMount.current) {
      requestAnimationFrame(() => {
        isInitialMount.current = false;
        setPillStyle(prev => ({ ...prev, animate: true }));
      });
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    syncPill();
  }, [syncPill]);

  useEffect(() => {
    const handleResize = () => {
      setPillStyle(prev => ({ ...prev, animate: false }));
      syncPill();
      requestAnimationFrame(() => {
        setPillStyle(prev => ({ ...prev, animate: true }));
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    let ro;
    if (typeof ResizeObserver !== 'undefined' && navRef.current) {
      ro = new ResizeObserver(() => syncPill());
      ro.observe(navRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (ro) ro.disconnect();
    };
  }, [syncPill]);

  return (
    <nav
      ref={navRef}
      className={`dashboard-nav bottom-nav ${className}`.trim()}
      role="navigation"
      aria-label="Main Navigation"
    >
      {/* Apple Sliding Glass Capsule Indicator */}
      {tabs.length > 1 && (
        <div
          className={`glass-nav-pill ${pillStyle.animate ? 'is-animating' : ''}`}
          style={
            pillStyle.ready
              ? {
                  transform: `translate3d(${pillStyle.left}px, ${pillStyle.top}px, 0)`,
                  width: `${pillStyle.width}px`,
                  height: `${pillStyle.height}px`,
                  opacity: 1
                }
              : {
                  opacity: 0
                }
          }
          aria-hidden="true"
        >
          <div className="glass-pill-specular" />
          <div className="glass-pill-reflection" />
          <div className="glass-pill-glow" />
        </div>
      )}

      {/* Navigation Buttons */}
      {tabs.map((tab, idx) => {
        const isActive = activeTab === idx;

        if (useNavLinks && tab.path) {
          return (
            <NavLink
              key={tab.id || tab.path}
              ref={el => {
                tabRefs.current[idx] = el;
              }}
              to={tab.path}
              title={tab.title || tab.label}
              className={`tab ${isSwipeRoute ? (isActive ? 'active' : '') : ({ isActive: routeActive }) => (routeActive ? 'active' : '')}`}
              onClick={e => {
                if (onTabSelect) {
                  if (isSwipeRoute) e.preventDefault();
                  onTabSelect(idx, tab);
                }
              }}
            >
              {tab.icon}
              <span className="tab-label">{tab.label}</span>
            </NavLink>
          );
        }

        return (
          <button
            key={tab.id || tab.label}
            type="button"
            ref={el => {
              tabRefs.current[idx] = el;
            }}
            className={`tab ${isActive ? 'active' : ''}`}
            onClick={e => onTabSelect && onTabSelect(idx, tab, e)}
            title={tab.title || tab.label}
            aria-label={tab.label}
          >
            {tab.icon}
            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
