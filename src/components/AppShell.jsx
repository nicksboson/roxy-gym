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
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
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
  const ownerName = profile?.name ? profile.name.split(' ')[0] : (user?.email?.split('@')[0] || 'Owner');

  const adminTabs = useMemo(() => [
    {
      id: 'members',
      label: 'Members',
      title: 'Members',
      path: '/members',
      icon: (
        <svg className="tab-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    {
      id: 'performance',
      label: 'Overview',
      title: 'Overview',
      path: '/performance',
      icon: (
        <svg className="tab-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12M2 12h4M18 12h4" />
        </svg>
      )
    },
    {
      id: 'register',
      label: 'Register',
      title: 'Register',
      path: '/register',
      icon: (
        <svg className="tab-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      )
    }
  ], []);

  return (
    <div className="roxy-app">
      <div className={`app-shell ${isSwipeRoute ? 'swipe-layout' : ''}`}>
        <header className="topbar">
          <div>
            <div className="brand">Roxy <span>GYM</span></div>
            <div className="brand-sub">Owner Management</div>
          </div>
          <div className="topbar-actions">
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

  const TAB_PATHS = useMemo(() => ['/members', '/performance', '/register'], []);
  const currentTabIndex = TAB_PATHS.indexOf(location.pathname);
  const isSwipeRoute = currentTabIndex !== -1 || location.pathname === '/';
  const activeTab = currentTabIndex !== -1 ? currentTabIndex : 0;

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/members', { replace: true });
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

  const { data: dbMembers, hasMore: hasMoreMembers } = useMembers(true, profile?.uid, memberLimit);
  const dbPlans = usePlans().data;

  const members = dbMembers;
  const plans = dbPlans;

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
              <AdminDashboard
                {...data}
                hasMore={hasMoreMembers}
                onLoadMore={() => setMemberLimit(l => l + 50)}
              />
              <PerformancePage {...data} />
              <RegisterPage plans={plans} />
            </SwipeTabViews>
          ) : (
            <Routes>
              <Route path="/" element={<Navigate to="/members" replace />} />
              <Route path="/plans" element={<PlansPage plans={plans} />} />
              <Route path="/calendar" element={<CalendarPage members={members} />} />
              <Route path="*" element={<ErrorPage type="404" inline />} />
            </Routes>
          )}
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}
