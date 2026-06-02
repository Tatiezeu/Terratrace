import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/**
 * GlobalLoadingBar - Premium top-of-screen progress bar.
 * Activates automatically whenever any TanStack Query fetch or mutation is in-flight.
 * Mimics the loading bar pattern used by GitHub, YouTube, and Linear.
 */
export function GlobalLoadingBar() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isActive = isFetching > 0 || isMutating > 0;

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    let timer;
    let progressTimer;

    if (isActive) {
      setVisible(true);
      setCompleting(false);
      setProgress(10);

      // Simulate progress: ramp up to ~85% while request is in-flight
      progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressTimer);
            return 85;
          }
          // Decelerate as we approach 85%
          const increment = Math.max(1, (85 - prev) * 0.08);
          return Math.min(85, prev + increment);
        });
      }, 150);
    } else {
      // Request completed — race to 100% then fade out
      setProgress(100);
      setCompleting(true);
      timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
        setCompleting(false);
      }, 400); // Match the CSS transition duration
    }

    return () => {
      clearInterval(progressTimer);
      clearTimeout(timer);
    };
  }, [isActive]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: '3px',
        background: 'transparent',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)',
          boxShadow: '0 0 12px rgba(16, 185, 129, 0.7)',
          transition: completing
            ? 'width 0.3s ease-in-out, opacity 0.1s ease'
            : 'width 0.15s ease-out',
          opacity: completing && progress >= 100 ? 0 : 1,
          borderRadius: '0 4px 4px 0',
        }}
      />
    </div>
  );
}
