import React, { lazy, Suspense, useCallback, useMemo, useState, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { useMembers, usePlans } from '../hooks';
import { initials } from '../utils';
import { useTheme } from '../context/ThemeContext';
import OwnerSidebar from './OwnerSidebar';
import SwipeTabViews from './SwipeTabViews';

import LoadingPage from '../pages/LoadingPage';
import ErrorPage from '../pages/ErrorPage';
import ErrorBoundary from './ErrorBoundary';
import GlassBottomNav from './GlassBottomNav';

// Lazy-load route components to prevent loading all views on initial load
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const MembersListPage = lazy(() => import('../pages/MembersListPage'));
const PerformancePage = lazy(() => import('../pages/PerformancePage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const PlansPage = lazy(() => import('../pages/PlansPage'));
const CalendarPage = lazy(() => import('../pages/CalendarPage'));

function PageLoader() {
  return <LoadingPage inline message="Loading page..." subtext="Fetching page data..." />;
}

function Layout({ user, profile, activeTab = 0, onTabSelect, isSwipeRoute = false, children }) {
  const { toggleSidebar } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const ownerName = profile?.name ? profile.name.split(' ')[0] : (user?.email?.split('@')[0] || 'Owner');

  const adminTabs = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      title: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="tab-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      )
    },
    {
      id: 'performance',
      label: 'Insights',
      title: 'Insights',
      path: '/performance',
      icon: (
        <svg className="tab-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    }
  ], []);

  return (
    <div className="roxy-app">
      <div className={`app-shell ${isSwipeRoute ? 'swipe-layout' : ''}`}>
        <header className="topbar">
            <div onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
              <div className="brand">Roxy <span>GYM</span></div>
            <div className="brand-sub">Owner Management</div>
          </div>
          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => navigate('/register')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--surface-hover)', color: 'var(--ink)'
              }}
              aria-label="Register Member"
              title="Register New Member"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </button>
            <button
              type="button"
              className="owner-profile-btn"
              onClick={toggleSidebar}
              title="Gym Owner Settings & Theme"
              aria-label="Open owner menu"
            >
              <div className="owner-profile-avatar">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={ownerName} />
                ) : (
                  <span>{initials(profile?.name || user?.email || 'Owner')}</span>
                )}
              </div>
              <span className="owner-profile-name">{ownerName}</span>
              <svg className="owner-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </header>

        <div
          key={isSwipeRoute ? 'admin-swipe-view' : location.pathname}
          className={`route-content-wrap ${isSwipeRoute ? 'swipe-views-wrapper' : ''}`}
        >
          {children}
        </div>

        <GlassBottomNav
          tabs={adminTabs}
          activeTab={activeTab}
          onTabSelect={(index, tab) => {
            if (onTabSelect) {
              onTabSelect(index, tab.path);
            }
          }}
          useNavLinks={true}
          isSwipeRoute={isSwipeRoute}
        />

        <OwnerSidebar
          adminProfile={profile || { name: user?.email }}
        />
      </div>
    </div>
  );
}

export default function AppShell({ user, profile }) {
  const [memberLimit, setMemberLimit] = useState(50);
  const location = useLocation();
  const navigate = useNavigate();

  const TAB_PATHS = useMemo(() => ['/dashboard', '/performance'], []);
  const currentTabIndex = TAB_PATHS.indexOf(location.pathname);
  const isSwipeRoute = currentTabIndex !== -1 || location.pathname === '/';
  const activeTab = currentTabIndex !== -1 ? currentTabIndex : 0;

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleTabSelect = useCallback((index, path) => {
    if (location.pathname !== path) {
      navigate(path, { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleSwipeChange = useCallback((newIndex) => {
    const targetPath = TAB_PATHS[newIndex];
    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  }, [TAB_PATHS, location.pathname, navigate]);

  const { data: dbMembers, hasMore: hasMoreMembers, refetch: refetchMembers } = useMembers(true, profile?.uid, memberLimit);
  const dbPlans = usePlans().data;

  const members = dbMembers;
  const plans = dbPlans;

  // Refetch whenever we navigate back to /dashboard
  useEffect(() => {
    if (location.pathname === '/dashboard' || location.pathname === '/members') {
      refetchMembers();
    }
  }, [location.pathname, refetchMembers]);

  // Refetch when window regains focus (handles tab switching, screen unlock, etc.)
  useEffect(() => {
    const onFocus = () => refetchMembers();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetchMembers]);

  const data = { members, plans };

  return (
    <Layout
      user={user}
      profile={profile}
      activeTab={activeTab}
      onTabSelect={handleTabSelect}
      isSwipeRoute={isSwipeRoute}
    >
      <ErrorBoundary inline>
        <Suspense fallback={<PageLoader />}>
          {isSwipeRoute ? (
            <SwipeTabViews activeIndex={activeTab} onChangeTab={handleSwipeChange}>
              <DashboardPage {...data} />
              <PerformancePage {...data} />
              
            </SwipeTabViews>
          ) : (
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="/members" 
                element={
                  <MembersListPage 
                    {...data} 
                    hasMore={hasMoreMembers} 
                    onLoadMore={() => setMemberLimit(l => l + 50)} 
                  />
                } 
              />
              <Route path="/register" element={<RegisterPage plans={plans} />} />`n                <Route path="/plans" element={<PlansPage plans={plans} />} />
              <Route path="/calendar" element={<CalendarPage members={members} />} />
              <Route path="*" element={<ErrorPage type="404" inline />} />
            </Routes>
          )}
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}
