import React from 'react';
import { 
  ReceiptText, 
  BookOpen, 
  FileText, 
  Users, 
  Settings, 
  Sparkles 
} from 'lucide-react';
import { AppState } from '../types';

interface BottomNavProps {
  activeTab: AppState['activeTab'];
  onTabChange: (tab: AppState['activeTab']) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav 
      className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 text-slate-400 py-1.5 px-2 print:hidden shadow-2xl"
      dir="rtl"
    >
      <div className="max-w-xl mx-auto grid grid-cols-6 gap-1 text-center">
        
        {/* 1. اليومية */}
        <button
          onClick={() => onTabChange('journal')}
          className={`py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
            activeTab === 'journal' 
              ? 'text-emerald-400 bg-slate-900 font-bold shadow-inner' 
              : 'hover:text-slate-200'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          <span className="text-[10px] leading-tight">اليومية</span>
        </button>

        {/* 2. دفاتر الأستاذ */}
        <button
          onClick={() => onTabChange('ledger')}
          className={`py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
            activeTab === 'ledger' 
              ? 'text-emerald-400 bg-slate-900 font-bold shadow-inner' 
              : 'hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px] leading-tight">الأستاذ</span>
        </button>

        {/* 3. العهدة */}
        <button
          onClick={() => onTabChange('settlement')}
          className={`py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
            activeTab === 'settlement' 
              ? 'text-emerald-400 bg-slate-900 font-bold shadow-inner' 
              : 'hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-[10px] leading-tight">العهدة</span>
        </button>

        {/* 4. الموظفون */}
        <button
          onClick={() => onTabChange('employees')}
          className={`py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
            activeTab === 'employees' 
              ? 'text-emerald-400 bg-slate-900 font-bold shadow-inner' 
              : 'hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px] leading-tight">الموظفون</span>
        </button>

        {/* 5. الإعدادات */}
        <button
          onClick={() => onTabChange('settings')}
          className={`py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
            activeTab === 'settings' 
              ? 'text-emerald-400 bg-slate-900 font-bold shadow-inner' 
              : 'hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="text-[10px] leading-tight">الإعدادات</span>
        </button>

        {/* 6. استيراد وتصدير أكسيل */}
        <button
          onClick={() => onTabChange('import_export')}
          className={`py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
            activeTab === 'import_export' 
              ? 'text-emerald-400 bg-slate-900 font-bold shadow-inner' 
              : 'hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] leading-tight">أكسيل</span>
        </button>

      </div>
    </nav>
  );
};
