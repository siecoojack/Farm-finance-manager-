import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AndroidFrame } from './components/AndroidFrame';
import { JournalTab } from './components/tabs/JournalTab';
import { LedgerTab } from './components/tabs/LedgerTab';
import { MonthlySettlementTab } from './components/tabs/MonthlySettlementTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { ImportExportTab } from './components/tabs/ImportExportTab';
import { VoucherModal } from './components/modals/VoucherModal';
import { ShareModal } from './components/modals/ShareModal';
import { AppState, JournalEntry } from './types';
import { loadAppState, saveAppState } from './utils/storage';
import { exportFarmToExcel } from './utils/excel';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [selectedVoucher, setSelectedVoucher] = useState<JournalEntry | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Auto-save state changes to LocalStorage
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const handleExportExcel = () => {
    const currentSettlement = state.settlements[state.currentMonth];
    exportFarmToExcel(
      state.currentMonth,
      state.employees,
      state.journalEntries,
      state.dropdowns,
      currentSettlement
    );
  };

  const renderActiveTabContent = () => {
    switch (state.activeTab) {
      case 'journal':
        return (
          <JournalTab
            state={state}
            setState={setState}
            onOpenVoucher={(entry) => setSelectedVoucher(entry)}
          />
        );
      case 'ledger':
        return <LedgerTab state={state} />;
      case 'settlement':
        return <MonthlySettlementTab state={state} setState={setState} />;
      case 'settings':
        return <SettingsTab state={state} setState={setState} />;
      case 'import_export':
        return <ImportExportTab state={state} setState={setState} />;
      default:
        return (
          <JournalTab
            state={state}
            setState={setState}
            onOpenVoucher={(entry) => setSelectedVoucher(entry)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* Top Main Navigation Header Bar */}
      <Navbar
        state={state}
        setState={setState}
        onExportExcel={handleExportExcel}
        onOpenShare={() => setShowShareModal(true)}
        onPrint={() => window.print()}
      />

      {/* Main Body View (Desktop Full Layout vs Mobile Android Chassis Frame) */}
      {state.viewMode === 'android' ? (
        <AndroidFrame
          activeTab={state.activeTab}
          onTabChange={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}
        >
          {renderActiveTabContent()}
        </AndroidFrame>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
          {renderActiveTabContent()}
        </main>
      )}

      {/* Footer Banner */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-center text-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-slate-200">تطبيق الإدارة المالية المتقدم للمزرعة</span>
            <span>— معالج بيانات الأكسيل واليومية العامة</span>
          </div>
          <p className="text-slate-500">
            يدعم الاستيراد والتصدير لصيغة Excel (.xlsx) • مشاركة عبر WhatsApp & Email • حفظ قواعد البيانات الشهرية
          </p>
        </div>
      </footer>

      {/* Voucher Ticket Modal */}
      {selectedVoucher && (
        <VoucherModal
          entry={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          state={state}
          onClose={() => setShowShareModal(false)}
        />
      )}

    </div>
  );
}
