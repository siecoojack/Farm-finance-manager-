import React from 'react';
import { Wifi, BatteryMedium, Signal, ChevronLeft, Square, Circle } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: any) => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTab,
  onTabChange
}) => {
  const currentTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="py-6 flex justify-center bg-slate-900 min-h-screen text-slate-100 font-sans" dir="rtl">
      {/* Phone Outer Shell */}
      <div className="w-full max-w-[420px] bg-slate-950 rounded-[42px] p-3 shadow-2xl border-4 border-slate-700 relative flex flex-col h-[880px] overflow-hidden my-auto">
        
        {/* Android Top Status Bar */}
        <div className="bg-slate-900 text-slate-200 px-5 pt-2 pb-1.5 flex items-center justify-between text-xs font-semibold rounded-t-[32px] select-none border-b border-slate-800">
          <div className="flex items-center gap-1 text-[11px]">
            <span>{currentTime}</span>
          </div>

          {/* Camera Notch Punch hole */}
          <div className="w-4 h-4 bg-black rounded-full border border-slate-800 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px]">98%</span>
              <BatteryMedium className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Android App Header */}
        <div className="bg-emerald-800 text-white px-4 py-2.5 flex items-center justify-between border-b border-emerald-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs text-emerald-100 shadow">
              🌾
            </div>
            <div>
              <h2 className="text-xs font-bold leading-tight">مالية المزرعة (أندرويد)</h2>
              <p className="text-[10px] text-emerald-200">إدخال المصاريف والعهد الميدانية</p>
            </div>
          </div>
          <span className="bg-emerald-900 text-emerald-200 text-[10px] px-2 py-0.5 rounded font-mono">
            v1.2 Mobile
          </span>
        </div>

        {/* Screen Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 p-2 text-xs">
          {children}
        </div>

        {/* Android App Bottom Tab Bar */}
        <div className="bg-slate-900 border-t border-slate-800 grid grid-cols-4 gap-1 p-1.5 text-center text-[10px] text-slate-400">
          <button
            onClick={() => onTabChange('journal')}
            className={`py-1.5 rounded flex flex-col items-center gap-1 transition ${
              activeTab === 'journal' ? 'text-emerald-400 bg-slate-800 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <span className="text-sm">📝</span>
            <span>اليومية</span>
          </button>

          <button
            onClick={() => onTabChange('ledger')}
            className={`py-1.5 rounded flex flex-col items-center gap-1 transition ${
              activeTab === 'ledger' ? 'text-emerald-400 bg-slate-800 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <span className="text-sm">📖</span>
            <span>الأستاذ</span>
          </button>

          <button
            onClick={() => onTabChange('settlement')}
            className={`py-1.5 rounded flex flex-col items-center gap-1 transition ${
              activeTab === 'settlement' ? 'text-emerald-400 bg-slate-800 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <span className="text-sm">📊</span>
            <span>العهدة</span>
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`py-1.5 rounded flex flex-col items-center gap-1 transition ${
              activeTab === 'settings' ? 'text-emerald-400 bg-slate-800 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <span className="text-sm">⚙️</span>
            <span>الإعدادات</span>
          </button>
        </div>

        {/* Android Native Bottom Navigation Bar */}
        <div className="bg-slate-950 py-2 px-8 flex items-center justify-around border-t border-slate-800 rounded-b-[32px] text-slate-500">
          <button className="hover:text-slate-300 p-1">
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
          <button className="hover:text-slate-300 p-1">
            <Circle className="w-3.5 h-3.5" />
          </button>
          <button className="hover:text-slate-300 p-1">
            <Square className="w-3.5 h-3.5 rounded-sm" />
          </button>
        </div>

      </div>
    </div>
  );
};
