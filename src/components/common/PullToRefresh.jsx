import { useState, useRef, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";

export default function PullToRefresh({ onRefresh, children }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef(null);

  const threshold = 80; // Distance needed to trigger refresh

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (isRefreshing || window.scrollY > 0) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      if (distance > 0) {
        setIsPulling(true);
        setPullDistance(Math.min(distance, threshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      setIsPulling(false);
      setPullDistance(0);
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min((pullDistance / threshold) * 100, 100);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-10"
        style={{
          height: isPulling || isRefreshing ? "60px" : "0px",
          opacity: isPulling || isRefreshing ? 1 : 0,
          transform: `translateY(${Math.max(0, pullDistance - 60)}px)`
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
          {isRefreshing ? (
            <Loader2 className="w-6 h-6 text-teal-600 dark:text-teal-400 animate-spin" />
          ) : (
            <RefreshCw
              className="w-6 h-6 text-teal-600 dark:text-teal-400 transition-transform"
              style={{
                transform: `rotate(${progress * 3.6}deg)`
              }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${isPulling && !isRefreshing ? pullDistance * 0.5 : 0}px)`
        }}
      >
        {children}
      </div>
    </div>
  );
}