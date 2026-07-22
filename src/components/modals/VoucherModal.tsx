import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { JournalEntry } from '../../types';

interface VoucherModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({ entry, onClose }) => {
  if (!entry) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative space-y-6">
        
        {/* Modal Controls (Hidden during print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-800 text-sm">معاينة سند اليومية ({entry.voucherNo})</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE VOUCHER TICKET LAYOUT */}
        <div className="border-2 border-slate-900 p-6 rounded-xl space-y-6 text-slate-900 font-sans">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h2 className="text-xl font-black text-emerald-950">إدارة المزرعة — الحسابات والعهد</h2>
              <p className="text-xs text-slate-600 font-bold">سند {entry.type === 'قبض عهدة' ? 'قبض وإيداع عهدة' : 'صرف ونفقات تشغيلية'}</p>
            </div>

            <div className="text-left font-mono text-xs space-y-1">
              <div className="bg-slate-100 px-3 py-1 rounded font-bold border border-slate-300">
                رقم السند: <span className="text-emerald-800">{entry.voucherNo}</span>
              </div>
              <div className="text-slate-500">التاريخ: {entry.date}</div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-emerald-50 border-2 border-emerald-800 p-4 rounded-xl text-center">
            <span className="text-xs font-bold text-emerald-900 block">المبلغ المرقوم</span>
            <div className="text-3xl font-black text-emerald-950 font-mono mt-1">
              {entry.amount.toLocaleString('ar-EG')} <span className="text-sm">جنيه مصري (ج.م)</span>
            </div>
          </div>

          {/* Voucher Details Table */}
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-600">نوع الحركة:</span>
              <span className="col-span-2 font-bold">{entry.type}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-600">قطاع المزرعة:</span>
              <span className="col-span-2 font-bold">{entry.sector}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-600">البند الفرعي:</span>
              <span className="col-span-2 font-bold">{entry.category}</span>
            </div>

            {entry.employeeName && (
              <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-600">المستلم / الموظف:</span>
                <span className="col-span-2 font-bold text-emerald-900">{entry.employeeName}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-600">البيان والشرح:</span>
              <span className="col-span-2 text-slate-800 font-medium leading-relaxed">{entry.statement}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-600">طريقة الدفع/العهدة:</span>
              <span className="col-span-2">{entry.paymentMethod} ({entry.custodian})</span>
            </div>

            {entry.notes && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-bold text-slate-600">رقم الفاتورة/ملاحظات:</span>
                <span className="col-span-2 text-slate-600">{entry.notes}</span>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <p className="font-bold">المستلم</p>
              <div className="border-b border-dashed border-slate-400 w-24 mx-auto pt-6"></div>
            </div>
            <div>
              <p className="font-bold">أمين العهدة</p>
              <div className="border-b border-dashed border-slate-400 w-24 mx-auto pt-6"></div>
            </div>
            <div>
              <p className="font-bold">اعتماد المهندس</p>
              <div className="border-b border-dashed border-slate-400 w-24 mx-auto pt-6"></div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
