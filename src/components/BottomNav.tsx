import React, { useState, useEffect } from 'react';
import { 
  ReceiptText, 
  BookOpen, 
  FileText, 
  Users, 
  Settings, 
  Sparkles,
  SlidersVertical,
  Maximize2,
  Minimize2,
  Check,
  EyeOff,
  WifiOff
} from 'lucide-react';
import { AppState } from '../types';
import { useOnlineStatus } from './OfflineIndicator';

interface BottomNavProps {
  activeTab: AppState['activeTab'];
  onTabChange: (tab: AppState['activeTab']) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const isOnline = useOnlineStatus();
  // Lift level state to avoid Android 3-button navigation overlay:
  // 'elevated' (default 48px lift for Android 3-button bar), 'high' (64px), 'compact' (12px)
  const [liftLevel, setLiftLevel] = useState<'elevated' | 'high' | 'compact'>(() => {
    return (localStorage.getItem('farm_bottom_lift') as any) || 'elevated';
  });
  const [showLiftControl, setShowLiftControl] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Monitor fullscreen state
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        const el = document.documentElement as any;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        }
      } else {
        const doc = document as any;
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.log('Fullscreen error:', err);
    }
  };

  const handleSetLift = (level: 'elevated' | 'high' | 'compact') => {
    setLiftLevel(level);
    localStorage.setItem('farm_bottom_lift', level);
    setShowLiftControl(false);
  };

  // Synchronize storage event across tabs
  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem('farm_bottom_lift');
      if (stored && (stored === 'elevated' || stored === 'high' || stored === 'compact')) {
        setLiftLevel(stored);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const getPaddingBottom = () => {
    // If fullscreen is active, Android automatically hides system navigation buttons
    if (isFullscreen) {
      return 'calc(env(safe-area-inset-bottom, 0px) + 12px)';
    }

    switch (liftLevel) {
      case 'high':
        return 'calc(env(safe-area-inset-bottom, 0px) + 64px)';
      case 'compact':
        return 'calc(env(safe-area-inset-bottom, 0px) + 12px)';
      case 'elevated':
      default:
        // 48px lift clears Android 3-button navigation bar (Square, Circle, Triangle)
        return 'calc(env(safe-area-inset-bottom, 0px) + 48px)';
    }
  };

  return (
    <>
      {/* Quick In-Bar Lift Adjuster Popup */}
      {showLiftControl && (
        <div className="fixed bottom-28 inset-x-4 max-w-sm mx-auto z-50 bg-slate-900 text-white p-4 rounded-2xl border border-slate-700 shadow-2xl text-right animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <SlidersVertical className="w-3.5 h-3.5" />
              التحكم بأزرار أندرويد وشريط التطبيق
            </span>
            <button 
              onClick={() => setShowLiftControl(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800"
            >
              إغلاق
            </button>
          </div>

          {/* Option 1: Immersive Fullscreen Mode */}
          <div className="mb-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-2">
            <div>
              <span className="block text-xs font-bold text-white flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                إخفاء أزرار أندرويد تلقائياً
              </span>
              <span className="block text-[10px] text-slate-400">
                (تظهر فقط عند السحب لأعلى من الأسفل)
              </span>
            </div>
            <button
              onClick={toggleFullscreen}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                isFullscreen 
                  ? 'bg-amber-500 text-slate-950 shadow' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>مُفعل</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>تفعيل</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
            أو اختر ارتفاع شريط التطبيق لتجاوز أزرار الهاتف:
          </p>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <button
              onClick={() => handleSetLift('compact')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                liftLevel === 'compact'
                  ? 'border-emerald-500 bg-emerald-950/80 text-emerald-200 font-bold'
                  : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>عادي</span>
              <span className="text-[10px] text-slate-400">بدون أزرار</span>
              {liftLevel === 'compact' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={() => handleSetLift('elevated')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                liftLevel === 'elevated'
                  ? 'border-emerald-500 bg-emerald-950/80 text-emerald-200 font-bold'
                  : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>مرتفع (موصى به)</span>
              <span className="text-[10px] text-slate-400">لأزرار أندرويد</span>
              {liftLevel === 'elevated' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={() => handleSetLift('high')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                liftLevel === 'high'
                  ? 'border-emerald-500 bg-emerald-950/80 text-emerald-200 font-bold'
                  : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>مرتفع جداً</span>
              <span className="text-[10px] text-slate-400">أزرار كبيرة</span>
              {liftLevel === 'high' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 text-slate-400 pt-1.5 px-2 print:hidden shadow-2xl transition-all duration-200"
        style={{ paddingBottom: getPaddingBottom() }}
        dir="rtl"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-1">
          
          {/* 6 Tabs */}
          <div className="flex-1 grid grid-cols-6 gap-1 text-center">
            {/* 1. اليومية */}
            <button
              onClick={() => onTabChange('journal')}
              className={`min-h-[44px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
                activeTab === 'journal' 
                  ? 'text-emerald-400 bg-slate-900 font-bold shadow-inner' 
                  : 'hover:text-slate-200'
              }`}
            >
              <ReceiptText className="w-4 h-4 shrink-0" />
              <span className="text-[10px] leading-tight">اليومية</span>
            </button>

            {/* 2. دفاتر الأستاذ */}
            <button
              onClick={() => onTabChange('ledger')}
              className={`min-h-[44px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
                activeTab === 'ledger' 
                  ? 'text-emerald-400 bg-slate-900 font-bold shadow-inner' 
                  : 'hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="text-[10px] leading-tight">الأستاذ</span>
            </button>

            {/* 3. العهدة */}
            <button
              onClick={() => onTabChange('settlement')}
              className={`min-h-[44px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
                activeTab === 'settlement' 
                  ? 'text-emerald-400 bg-slate-900 font-bold shadow-inner' 
                  : 'hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="text-[10px] leading-tight">العهدة</span>
            </button>

            {/* 4. الموظفون */}
            <button
              onClick={() => onTabChange('employees')}
              className={`min-h-[44px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
                activeTab === 'employees' 
                  ? 'text-emerald-400 bg-slate-900 font-bold shadow-inner' 
                  : 'hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="text-[10px] leading-tight">الموظفون</span>
            </button>

            {/* 5. الإعدادات */}
            <button
              onClick={() => onTabChange('settings')}
              className={`min-h-[44px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
                activeTab === 'settings' 
                  ? 'text-emerald-400 bg-slate-900 font-bold shadow-inner' 
                  : 'hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="text-[10px] leading-tight">الإعدادات</span>
            </button>

            {/* 6. استيراد وتصدير أكسيل */}
            <button
              onClick={() => onTabChange('import_export')}
              className={`min-h-[44px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
                activeTab === 'import_export' 
                  ? 'text-emerald-400 bg-slate-900 font-bold shadow-inner' 
                  : 'hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[10px] leading-tight">أكسيل</span>
            </button>
          </div>

          {/* Quick Controls: Fullscreen / Lift Adjuster / Offline Dot */}
          <div className="flex items-center gap-0.5 shrink-0 pr-1 border-r border-slate-800">
            {!isOnline && (
              <div 
                className="p-1 text-amber-400 bg-amber-950/80 border border-amber-500/50 rounded-lg flex flex-col items-center animate-pulse"
                title="أنت في وضع عدم الاتصال"
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[7px] font-bold text-amber-300 leading-none mt-0.5">أوفلاين</span>
              </div>
            )}

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'الخروج من الشاشة الكاملة' : 'إخفاء أزرار أندرويد (ملء الشاشة)'}
              className={`p-1.5 rounded-lg transition flex flex-col items-center ${
                isFullscreen ? 'text-amber-400 bg-amber-950/60' : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-900'
              }`}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="text-[8px] leading-none mt-0.5">{isFullscreen ? 'إظهار' : 'إخفاء'}</span>
            </button>

            <button
              onClick={() => setShowLiftControl(prev => !prev)}
              title="تعديل ارتفاع شريط أندرويد"
              className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-900 transition flex flex-col items-center"
            >
              <SlidersVertical className="w-3.5 h-3.5" />
              <span className="text-[8px] leading-none mt-0.5">ضبط</span>
            </button>
          </div>

        </div>
      </nav>
    </>
  );
};
