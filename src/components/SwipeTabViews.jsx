import React, { useCallback, useEffect, useRef } from 'react';

/**
 * SwipeTabViews
 * Lightweight horizontal swipe container using CSS scroll-snap.
 * Provides synchronized swipe navigation between tabs with full scroll position
 * and form state preservation.
 */
export default function SwipeTabViews({
  activeIndex = 0,
  onChangeTab,
  children
}) {
  const containerRef = useRef(null);
  const isProgrammaticScroll = useRef(false);
  const isDraggingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const activeIndexRef = useRef(activeIndex);
  const isMountedRef = useRef(false);

  activeIndexRef.current = activeIndex;

  const syncActiveFromScroll = useCallback(() => {
    if (isProgrammaticScroll.current || isDraggingRef.current || !containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    if (clientWidth <= 0) return;

    const newIndex = Math.round(scrollLeft / clientWidth);
    const totalTabs = React.Children.count(children);

    if (newIndex >= 0 && newIndex < totalTabs && newIndex !== activeIndexRef.current) {
      activeIndexRef.current = newIndex;
      if (onChangeTab) {
        onChangeTab(newIndex, 'swipe');
      }
    }
  }, [children, onChangeTab]);

  const scrollToTab = useCallback((index, behavior = 'smooth') => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    if (width > 0) {
      isProgrammaticScroll.current = true;
      containerRef.current.scrollTo({
        left: index * width,
        behavior
      });

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, behavior === 'smooth' ? 450 : 50);
    }
  }, []);

  // When activeIndex prop changes (e.g. bottom nav tapped)
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    if (width <= 0) return;

    if (!isMountedRef.current) {
      containerRef.current.scrollLeft = activeIndex * width;
      isMountedRef.current = true;
      return;
    }

    const currentScrollIndex = Math.round(containerRef.current.scrollLeft / width);
    if (currentScrollIndex !== activeIndex) {
      scrollToTab(activeIndex, 'smooth');
    }
  }, [activeIndex, scrollToTab]);

  // Initial positioning on mount
  useEffect(() => {
    const alignInitial = () => {
      if (containerRef.current && containerRef.current.clientWidth > 0) {
        containerRef.current.scrollLeft = activeIndexRef.current * containerRef.current.clientWidth;
        isMountedRef.current = true;
      }
    };
    alignInitial();
    const rafId = requestAnimationFrame(alignInitial);
    const timerId = setTimeout(alignInitial, 60);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, []);

  // Window resize & device orientation handler to keep snap centered
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && containerRef.current.clientWidth > 0) {
        containerRef.current.scrollLeft = activeIndexRef.current * containerRef.current.clientWidth;
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Touch tracking to avoid premature tab state flips during active drag
  const handleTouchStart = () => {
    isDraggingRef.current = true;
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      syncActiveFromScroll();
    }, 70);
  };

  // Scroll listener with debouncing for cross-browser fallback
  const handleScroll = () => {
    if (isProgrammaticScroll.current) return;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      syncActiveFromScroll();
    }, 60);
  };

  // Modern scrollend event listener (iOS Safari 17.4+, Chrome, Firefox)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScrollEnd = () => {
      if (isProgrammaticScroll.current) {
        isProgrammaticScroll.current = false;
        return;
      }
      isDraggingRef.current = false;
      syncActiveFromScroll();
    };

    container.addEventListener('scrollend', handleScrollEnd);
    return () => container.removeEventListener('scrollend', handleScrollEnd);
  }, [syncActiveFromScroll]);

  return (
    <div
      ref={containerRef}
      className="swipe-tabs-container"
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {React.Children.map(children, (child, index) => (
        <div className="swipe-tab-pane" key={index} data-pane-index={index}>
          {child}
        </div>
      ))}
    </div>
  );
}
