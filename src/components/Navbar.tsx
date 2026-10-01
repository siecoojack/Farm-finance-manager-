import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  BookOpen, 
  ReceiptText, 
  FileText, 
  Settings, 
  Users,
  Smartphone, 
  Monitor, 
  Share2, 
  Printer, 
  Download, 
  Plus, 
  Calendar,
  Sparkles,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { AppState } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onExportExcel: () => void;
  onOpenShare: () => void;
  onPrint: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  setState,
  onExportExcel,
  onOpenShare,
  onPrint
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFs = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

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
    if (!monthsList.includes(newMonthKey)) {
      monthsList.unshift(newMonthKey);
    }
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
    <header className="bg-emerald-900 text-white shadow-lg border-b border-emerald-800 print:hidden" dir="rtl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <img 
              src="/icon-192.png" 
              alt="أيقونة مزرعة الدواجن" 
              className="w-11 h-11 rounded-xl shadow-md border border-emerald-400/40 object-cover bg-emerald-950" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-emerald-50">النظام المالي لإدارة المزرعة</h1>
                <span className="bg-emerald-700/80 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-medium border border-emerald-600">
                  نسخة الأكسيل المتقدمة
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">اليومية العامة • دفاتر الأستاذ • تسوية العهدة للمكتب الرئيسي</p>
            </div>
          </div>

          {/* Month Selector & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Active Month Dropdown */}
            <div className="flex items-center bg-emerald-800/90 border border-emerald-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-100">
              <Calendar className="w-4 h-4 text-emerald-300 ml-1.5" />
              <span className="ml-1 font-semibold text-emerald-300">الشهر:</span>
              <select
                value={state.currentMonth}
                onChange={(e) => setState(prev => ({ ...prev, currentMonth: e.target.value }))}
                className="bg-transparent text-white font-bold cursor-pointer outline-none focus:ring-0 text-xs"
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
                className="mr-2 text-emerald-300 hover:text-white p-1 hover:bg-emerald-700 rounded transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <PWAInstallButton />

              <button
                onClick={toggleFullscreen}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  isFullscreen ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-200'
                }`}
                title={isFullscreen ? 'الخروج من الشاشة الكاملة' : 'ملء الشاشة وإخفاء أزرار أندرويد'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden lg:inline">{isFullscreen ? 'شاشة عادية' : 'ملء الشاشة'}</span>
              </button>

              <button
                onClick={onExportExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
                title="تصدير ملف أكسيل كاملاً"
              >
                <Download className="w-4 h-4" />
                <span>تصدير أكسيل</span>
              </button>

              <button
                onClick={onOpenShare}
                className="bg-emerald-700 hover:bg-emerald-600 text-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                title="مشاركة عبر الواتساب والإيميل"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة</span>
              </button>

              <button
                onClick={onPrint}
                className="bg-emerald-800 hover:bg-emerald-700 text-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                title="طباعة التقرير"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">طباعة</span>
              </button>
            </div>

          </div>
        </div>

        {/* Navigation Horizontal Scrolling Tabs Bar */}
        <nav className="mt-3 flex space-x-1.5 space-x-reverse border-t border-emerald-800/80 pt-2.5 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setState(prev => ({ ...prev, activeTab: 'journal' }))}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg flex items-center gap-1.5 border-b-2 transition whitespace-nowrap shrink-0 ${
              state.activeTab === 'journal'
                ? 'bg-emerald-800 text-emerald-50 border-emerald-400 shadow-sm'
                : 'text-emerald-200/90 hover:text-white hover:bg-emerald-800/40 border-transparent'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>اليومية العامة (المصاريف)</span>
          </button>

          <button
            onClick={() => setState(prev => ({ ...prev, activeTab: 'ledger' }))}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg flex items-center gap-1.5 border-b-2 transition whitespace-nowrap shrink-0 ${
              state.activeTab === 'ledger'
                ? 'bg-emerald-800 text-emerald-50 border-emerald-400 shadow-sm'
                : 'text-emerald-200/90 hover:text-white hover:bg-emerald-800/40 border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>دفاتر الأستاذ</span>
          </button>

          <button
            onClick={() => setState(prev => ({ ...prev, activeTab: 'settlement' }))}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg flex items-center gap-1.5 border-b-2 transition whitespace-nowrap shrink-0 ${
              state.activeTab === 'settlement'
                ? 'bg-emerald-800 text-emerald-50 border-emerald-400 shadow-sm'
                : 'text-emerald-200/90 hover:text-white hover:bg-emerald-800/40 border-transparent'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>تسوية العهدة الشهرية</span>
          </button>

          <button
            onClick={() => setState(prev => ({ ...prev, activeTab: 'employees' }))}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg flex items-center gap-1.5 border-b-2 transition whitespace-nowrap shrink-0 ${
              state.activeTab === 'employees'
                ? 'bg-emerald-800 text-emerald-50 border-emerald-400 shadow-sm'
                : 'text-emerald-200/90 hover:text-white hover:bg-emerald-800/40 border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الموظفون والرواتب</span>
          </button>

          <button
            onClick={() => setState(prev => ({ ...prev, activeTab: 'settings' }))}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg flex items-center gap-1.5 border-b-2 transition whitespace-nowrap shrink-0 ${
              state.activeTab === 'settings'
                ? 'bg-emerald-800 text-emerald-50 border-emerald-400 shadow-sm'
                : 'text-emerald-200/90 hover:text-white hover:bg-emerald-800/40 border-transparent'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>الإعدادات وجداول القوائم</span>
          </button>

          <button
            onClick={() => setState(prev => ({ ...prev, activeTab: 'import_export' }))}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg flex items-center gap-1.5 border-b-2 transition whitespace-nowrap shrink-0 ${
              state.activeTab === 'import_export'
                ? 'bg-emerald-800 text-emerald-50 border-emerald-400 shadow-sm'
                : 'text-emerald-200/90 hover:text-white hover:bg-emerald-800/40 border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>تصدير واستيراد أكسيل</span>
          </button>
        </nav>

      </div>
    </header>
  );
};
