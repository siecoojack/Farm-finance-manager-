import React from 'react';
import { CreditCard } from 'lucide-react';
import { AppState } from '../../types';

interface ExpensesTabProps {
  state: AppState;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({ state }) => {
  const expenses = state.journalEntries.filter(entry => entry.type === 'مصروف' && entry.monthKey === state.currentMonth);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-rose-800" />
          دفتر أستاذ المصروفات
        </h2>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-[800px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">التاريخ</th>
                <th className="p-3">المستند</th>
                <th className="p-3">البيان</th>
                <th className="p-3">التصنيف</th>
                <th className="p-3">القطاع</th>
                <th className="p-3">القيمة</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(entry => (
                <tr key={entry.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 whitespace-nowrap">{entry.date}</td>
                  <td className="p-3 whitespace-nowrap">{entry.voucherNo}</td>
                  <td className="p-3 font-bold">{entry.statement}</td>
                  <td className="p-3 whitespace-nowrap">{entry.category}</td>
                  <td className="p-3 whitespace-nowrap">{entry.sector}</td>
                  <td className="p-3 font-black text-rose-700 whitespace-nowrap">{entry.amount.toLocaleString()} ريال</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
