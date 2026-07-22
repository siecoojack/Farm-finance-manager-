import React, { useState } from 'react';
import { BookOpen, Calculator, Layers, UserCheck, ShieldCheck, ArrowUpRight, ArrowDownLeft, Info } from 'lucide-react';
import { AppState, JournalEntry } from '../../types';

interface LedgerTabProps {
  state: AppState;
}

export const LedgerTab: React.FC<LedgerTabProps> = ({ state }) => {
  const currentMonthEntries = state.journalEntries.filter(e => e.monthKey === state.currentMonth);

  // Ledger Filter Types
  const [ledgerMode, setLedgerMode] = useState<'category' | 'sector' | 'employee' | 'custodian'>('category');
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');

  // Get available list for selected mode
  let accountOptions: string[] = [];
  if (ledgerMode === 'category') {
    accountOptions = Array.from(new Set(state.dropdowns.filter(d => d.type === 'category').map(d => d.name)));
  } else if (ledgerMode === 'sector') {
    accountOptions = Array.from(new Set(state.dropdowns.filter(d => d.type === 'sector').map(d => d.name)));
  } else if (ledgerMode === 'employee') {
    accountOptions = state.employees.map(emp => emp.name);
  } else if (ledgerMode === 'custodian') {
    accountOptions = Array.from(new Set(state.dropdowns.filter(d => d.type === 'custodian').map(d => d.name)));
  }

  // Filter entries for selected ledger account
  const ledgerEntries = currentMonthEntries.filter(e => {
    if (selectedAccount === 'ALL') return true;
    if (ledgerMode === 'category') return e.category === selectedAccount;
    if (ledgerMode === 'sector') return e.sector === selectedAccount;
    if (ledgerMode === 'employee') return e.employeeName === selectedAccount;
    if (ledgerMode === 'custodian') return e.custodian === selectedAccount;
    return true;
  });

  // Calculate totals for ledger
  let totalDebit = 0; // المصروفات (مدين)
  let totalCredit = 0; // المقبوضات/العهد (دائن)

  let runningBalance = 0;
  const rowsWithRunningBalance = ledgerEntries.map(e => {
    const isCredit = e.type === 'قبض عهدة';
    const isDebit = e.type === 'مصروف' || e.type === 'راتب';

    const debitAmount = isDebit ? e.amount : 0;
    const creditAmount = isCredit ? e.amount : 0;

    totalDebit += debitAmount;
    totalCredit += creditAmount;

    // Running Balance: Credit (Inflow) - Debit (Outflow)
    runningBalance += (creditAmount - debitAmount);

    return {
      ...e,
      debitAmount,
      creditAmount,
      balanceAfter: runningBalance
    };
  });

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Explanation Banner: Posting Logic */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
          <Calculator className="w-5 h-5" />
          <span>منطق معادلات الترحيل التلقائي من اليومية إلى دفتر الأستاذ (General Ledger Logic)</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed">
          يقوم دفتر الأستاذ بسحب الحركات تلقائياً من اليومية العامة بناءً على حساب البند أو القطاع المحدد، مع تطبيق معادلات الرصيد التراكمي:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          <div className="bg-emerald-950/80 p-3 rounded-lg border border-emerald-700/50">
            <span className="text-emerald-300 font-bold block mb-1">1. إجمالي المدين (المنصرف)</span>
            <code className="text-[11px] text-emerald-200 font-mono">SUMIF(اليومية, "مصروف", المبلغ)</code>
          </div>
          <div className="bg-emerald-950/80 p-3 rounded-lg border border-emerald-700/50">
            <span className="text-emerald-300 font-bold block mb-1">2. إجمالي الدائن (المقبوض)</span>
            <code className="text-[11px] text-emerald-200 font-mono">SUMIF(اليومية, "قبض عهدة", المبلغ)</code>
          </div>
          <div className="bg-emerald-950/80 p-3 rounded-lg border border-emerald-700/50">
            <span className="text-emerald-300 font-bold block mb-1">3. الرصيد التراكمي الحالي</span>
            <code className="text-[11px] text-emerald-200 font-mono">الرصيد السابق + دائن - مدين</code>
          </div>
        </div>
      </div>

      {/* Ledger Account Switcher Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Ledger Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => { setLedgerMode('category'); setSelectedAccount('ALL'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              ledgerMode === 'category' ? 'bg-emerald-700 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>حسب بنود المصروفات</span>
          </button>

          <button
            onClick={() => { setLedgerMode('sector'); setSelectedAccount('ALL'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              ledgerMode === 'sector' ? 'bg-emerald-700 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>حسب قطاعات المزرعة</span>
          </button>

          <button
            onClick={() => { setLedgerMode('employee'); setSelectedAccount('ALL'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              ledgerMode === 'employee' ? 'bg-emerald-700 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>حسب حسابات الموظفين والعمال</span>
          </button>

          <button
            onClick={() => { setLedgerMode('custodian'); setSelectedAccount('ALL'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              ledgerMode === 'custodian' ? 'bg-emerald-700 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>حسب حسابات العهد وأمناء الصندوق</span>
          </button>
        </div>

        {/* Dropdown Selection for Specific Account */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-bold text-slate-700 whitespace-nowrap">اختر الحساب المطلوب:</span>
            <select
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              className="w-full sm:w-80 bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">-- جميع الحسابات لهذا القسم --</option>
              {accountOptions.map((acc, idx) => (
                <option key={idx} value={acc}>{acc}</option>
              ))}
            </select>
          </div>

          <div className="text-slate-500 text-[11px] font-medium">
            الحساب النشط: <span className="font-bold text-emerald-800">{selectedAccount === 'ALL' ? 'كافة الحسابات' : selectedAccount}</span>
          </div>
        </div>

      </div>

      {/* Account Totals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي المدين (المصروفات المسحوبة)</p>
            <h3 className="text-xl font-black text-rose-600 mt-1">
              {totalDebit.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
            </h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي الدائن (العهدة/المقبوضات)</p>
            <h3 className="text-xl font-black text-emerald-700 mt-1">
              {totalCredit.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl shadow flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-300">صافي رصيد الحساب الحالي</p>
            <h3 className="text-xl font-black text-emerald-300 mt-1">
              {runningBalance.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
            </h3>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-800" />
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
              تفاصيل حركة دفتر الأستاذ للحساب: [{selectedAccount === 'ALL' ? 'جميع الحسابات' : selectedAccount}]
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">عدد الحركات: {rowsWithRunningBalance.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                <th className="p-3">التاريخ</th>
                <th className="p-3">السند</th>
                <th className="p-3">البيان والتفاصيل</th>
                <th className="p-3">القطاع / البند</th>
                <th className="p-3 text-rose-700">مدين (مصروفات)</th>
                <th className="p-3 text-emerald-700">دائن (عهدة/مقبوض)</th>
                <th className="p-3 text-slate-900">الرصيد التراكمي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {rowsWithRunningBalance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>لا توجد حركات مسجلة لهذا الحساب في الشهر الحالي.</p>
                  </td>
                </tr>
              ) : (
                rowsWithRunningBalance.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono whitespace-nowrap">{row.date}</td>
                    <td className="p-3 font-mono font-bold text-emerald-800 whitespace-nowrap">{row.voucherNo}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{row.statement}</div>
                      {row.employeeName && <div className="text-[10px] text-emerald-700">👤 {row.employeeName}</div>}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{row.category}</div>
                      <div className="text-[10px] text-slate-500">{row.sector}</div>
                    </td>
                    <td className="p-3 font-bold text-rose-600">
                      {row.debitAmount > 0 ? row.debitAmount.toLocaleString('ar-EG') : '-'}
                    </td>
                    <td className="p-3 font-bold text-emerald-700">
                      {row.creditAmount > 0 ? row.creditAmount.toLocaleString('ar-EG') : '-'}
                    </td>
                    <td className="p-3 font-black bg-slate-50/80 text-slate-900 whitespace-nowrap">
                      {row.balanceAfter.toLocaleString('ar-EG')} ج.م
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
