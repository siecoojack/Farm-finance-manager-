import React from 'react';
import { 
  Wifi, 
  BatteryMedium, 
  Signal, 
  ChevronLeft, 
  Square, 
  Circle, 
  Calendar, 
  Download, 
  Share2, 
  Printer, 
  Monitor, 
  Plus,
  ReceiptText,
  BookOpen,
  FileText,
  Settings,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { AppState } from '../types';

interface AndroidFrameProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onExportExcel: () => void;
  onOpenShare: () => void;
  onPrint: () => void;
  onExitAndroidMode: () => void;
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  state,
  setState,
  onExportExcel,
  onOpenShare,
  onPrint,
  onExitAndroidMode,
  children
}) => {
  const currentTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  const monthsList = [
    '2026-07', '2026-06', '2026-05', '2026-04', '2026-03', '2026-02', '2026-01'
  ];

  const formatMonthDisplay = (key: string) => {
    const [year, month] = key.split('-');
    const monthNames: Record<string, string> = {
      '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
      '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
      '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
    };
    return `${monthNames[month] || month} ${year}`;
  };

  const handleAddNewMonth = () => {
    const today = new Date();
    const newMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    setState(prev => ({
      ...prev,
      currentMonth: newMonthKey,
      settlements: {
        ...prev.settlements,
        [newMonthKey]: prev.settlements[newMonthKey] || {
          monthKey: newMonthKey,
          monthName: formatMonthDisplay(newMonthKey),
          custodianName: 'مهندس أحمد علي الخولي',
          openingBalance: 0,
          totalAdvancesReceived: 0,
          totalExpenses: 0,
          totalSalaries: 0,
          closingBalance: 0,
          status: 'مسودة',
          updatedAt: new Date().toISOString()
        }
      }
    }));
  };

  return (
    <div className="flex flex-col items-center justify-start bg-slate-900 min-h-screen text-slate-100 font-sans pb-10" dir="rtl">
      
      {/* Top Desktop Toolbar to Switch Back to Desktop */}
      <div className="w-full bg-slate-950/80 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs mb-4">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-white">معاينة واجهة الهاتف الذكي (أندرويد / PWA)</span>
          <span className="text-slate-500 hidden sm:inline">— جميع الميزات والترويسة مدمجة داخل إطار الهاتف</span>
        </div>
        <button
          onClick={onExitAndroidMode}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow transition"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>التبديل إلى وضع سطح المكتب</span>
        </button>
      </div>

      {/* Phone Outer Shell Container */}
      <div className="w-full max-w-[430px] sm:rounded-[42px] sm:p-3 sm:shadow-2xl sm:border-4 sm:border-slate-700 bg-slate-950 relative flex flex-col h-screen sm:h-[880px] overflow-hidden">
        
        {/* Android Top Status Bar */}
        <div className="bg-slate-900 text-slate-200 px-5 pt-2 pb-1.5 flex items-center justify-between text-xs font-semibold sm:rounded-t-[32px] select-none border-b border-slate-800">
          <div className="flex items-center gap-1 text-[11px]">
            <span>{currentTime}</span>
          </div>

          {/* Camera Notch Punch hole (shown in simulated chassis) */}
          <div className="hidden sm:flex w-4 h-4 bg-black rounded-full border border-slate-800 items-center justify-center">
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

        {/* 🌟 Authentic Green App Header (INSIDE THE PHONE) */}
        <div className="bg-emerald-800 text-white px-3.5 py-3 border-b border-emerald-700 shadow-md">
          {/* Header Top Row: Logo, Title, and Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xs font-bold text-emerald-50 leading-tight">مالية المزرعة</h1>
                <p className="text-[10px] text-emerald-200/90 leading-none">اليومية والعهد الميدانية</p>
              </div>
            </div>

            {/* Quick Actions (Share, Excel, Print) */}
            <div className="flex items-center gap-1">
              <button
                onClick={onExportExcel}
                className="bg-emerald-700 hover:bg-emerald-600 text-emerald-100 p-1.5 rounded-lg text-[11px] font-semibold transition"
                title="تصدير ملف أكسيل"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onOpenShare}
                className="bg-emerald-700 hover:bg-emerald-600 text-emerald-100 p-1.5 rounded-lg text-[11px] font-semibold transition"
                title="مشاركة التقرير عبر واتساب"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onPrint}
                className="bg-emerald-900/80 hover:bg-emerald-700 text-emerald-200 p-1.5 rounded-lg text-[11px] font-semibold transition"
                title="طباعة التقرير"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Header Bottom Row: Month Selector Dropdown */}
          <div className="mt-2.5 pt-2 border-t border-emerald-700/60 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-emerald-900/80 border border-emerald-700 rounded-lg px-2.5 py-1 w-full text-emerald-100">
              <Calendar className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="text-[11px] font-semibold text-emerald-300 shrink-0">الشهر:</span>
              <select
                value={state.currentMonth}
                onChange={(e) => setState(prev => ({ ...prev, currentMonth: e.target.value }))}
                className="bg-transparent text-white font-bold cursor-pointer outline-none focus:ring-0 text-[11px] w-full"
              >
                {monthsList.map(mKey => (
                  <option key={mKey} value={mKey} className="bg-emerald-900 text-white">
                    {formatMonthDisplay(mKey)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddNewMonth}
                title="إضافة شهر جديد"
                className="text-emerald-300 hover:text-white p-0.5 rounded transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Screen Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 p-2 text-xs">
          {children}
        </div>

        {/* 🌟 Mobile Bottom Tab Bar (All 5 Tabs) */}
        <div className="bg-slate-900 border-t border-slate-800 grid grid-cols-5 gap-0.5 p-1 text-center text-[10px] text-slate-400">
          <button
            onClick={() => setState(prev => ({ ...prev, activeTab: 'journal' }))}
            className={`py-1.5 px-0.5 rounded-lg flex flex-col items-center gap-0.5 transition ${
              state.activeTab === 'journal' ? 'text-emerald-400 bg-slate-800 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span className="text-[9px] leading-tight">اليومية</span>
          </button>

          <button
            onClick={() => setState(prev => ({ ...prev, activeTab: 'ledger' }))}
            className={`py-1.5 px-0.5 rounded-lg flex flex-col items-center gap-0.5 transition ${
              state.activeTab === 'ledger' ? 'text-emerald-400 bg-slate-800 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[9px] leading-tight">الأستاذ</span>
          </button>

          <button
            onClick={() => setState(prev => ({ ...prev, activeTab: 'settlement' }))}
            className={`py-1.5 px-0.5 rounded-lg flex flex-col items-center gap-0.5 transition ${
              state.activeTab === 'settlement' ? 'text-emerald-400 bg-slate-800 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-[9px] leading-tight">العهدة</span>
          </button>

          <button
            onClick={() => setState(prev => ({ ...prev, activeTab: 'settings' }))}
            className={`py-1.5 px-0.5 rounded-lg flex flex-col items-center gap-0.5 transition ${
              state.activeTab === 'settings' ? 'text-emerald-400 bg-slate-800 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-[9px] leading-tight">الموظفون</span>
          </button>

          <button
            onClick={() => setState(prev => ({ ...prev, activeTab: 'import_export' }))}
            className={`py-1.5 px-0.5 rounded-lg flex flex-col items-center gap-0.5 transition ${
              state.activeTab === 'import_export' ? 'text-emerald-400 bg-slate-800 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-[9px] leading-tight">أكسيل</span>
          </button>
        </div>

        {/* Android Native Bottom System Bar (shown in simulated chassis on desktop) */}
        <div className="hidden sm:flex bg-slate-950 py-2 px-8 items-center justify-around border-t border-slate-800 rounded-b-[32px] text-slate-500">
          <button className="hover:text-slate-300 p-1" title="رجوع">
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
          <button className="hover:text-slate-300 p-1" title="الرئيسية">
            <Circle className="w-3.5 h-3.5" />
          </button>
          <button className="hover:text-slate-300 p-1" title="التطبيقات">
            <Square className="w-3.5 h-3.5 rounded-sm" />
          </button>
        </div>

      </div>
    </div>
  );
};
