import { useState, useEffect, useRef } from 'react';

export function usePullToRefresh(onRefresh, threshold = 80) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const onRefreshRef = useRef(onRefresh);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(false);

  // Always keep latest callback without re-running the effect
  useEffect(() => { onRefreshRef.current = onRefresh; });

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!pulling.current || window.scrollY > 0) return;
      const distance = Math.max(0, e.touches[0].clientY - startY.current);
      pullDistanceRef.current = Math.min(distance, threshold * 1.5);
      setPullDistance(pullDistanceRef.current);
    };

    const handleTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;

      if (pullDistanceRef.current >= threshold && !refreshingRef.current) {
        setRefreshing(true);
        refreshingRef.current = true;
        setPullDistance(0);
        pullDistanceRef.current = 0;
        try {
          await onRefreshRef.current();
        } finally {
          setRefreshing(false);
          refreshingRef.current = false;
        }
      } else {
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [threshold]);

  return { refreshing, pullDistance };
}