import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('roxy_gym_theme');
      if (saved === 'dark') return 'dark';
      return 'light'; // Default: White & Black plain
    } catch {
      return 'light';
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const setTheme = (newThemeId) => {
    const valid = newThemeId === 'dark' ? 'dark' : 'light';
    setThemeState(valid);
    try {
      localStorage.setItem('roxy_gym_theme', valid);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);
  const openSidebar = () => setSidebarOpen(true);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        closeSidebar,
        openSidebar,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
