import React, { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';

/**
 * Hook to track browser online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * The yellow/amber floating toast indicator
 * Starts fading out after 8.5 seconds and completely hides after 10 seconds.
 */
export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    let fadeTimer: NodeJS.Timeout;
    let hideTimer: NodeJS.Timeout;

    const startDismissTimer = () => {
      setIsVisible(true);
      setIsFading(false);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);

      // Start fade-out animation after 8.5 seconds
      fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, 8500);

      // Completely remove and hide after 10 seconds
      hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setIsVisible(false);
      setIsFading(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      startDismissTimer();
    };

    // If starting the app in offline mode
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      startDismissTimer();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline || !isVisible) return null;

  return (
    <div
      dir="rtl"
      className={`fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-3 max-w-[92vw] sm:max-w-md bg-amber-600/95 backdrop-blur-sm text-white px-3.5 py-2 rounded-2xl shadow-2xl border border-amber-400/80 transition-all duration-1000 ease-in-out ${
        isFading ? 'opacity-0 translate-y-3 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className="p-1 bg-amber-700/80 rounded-full shrink-0">
          <WifiOff className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
        </span>
        <span className="leading-tight">
          وضع عدم الاتصال — يمكنك الاستمرار بالعمل وحفظ البيانات محلياً.
        </span>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        title="إغلاق التنبيه"
        className="p-1 text-amber-200 hover:text-white hover:bg-amber-700/60 rounded-full transition shrink-0 active:scale-90"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
