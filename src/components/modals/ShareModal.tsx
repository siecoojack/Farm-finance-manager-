import React, { useState } from 'react';
import { X, MessageSquare, Mail, Share2, Printer, Check, Copy } from 'lucide-react';
import { AppState } from '../../types';
import { buildWhatsAppReportMessage, shareViaWhatsApp, shareViaEmail, triggerPrintReport } from '../../utils/sharing';

interface ShareModalProps {
  state: AppState;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ state, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState('');

  const currentSettlement = state.settlements[state.currentMonth];
  const monthEntries = state.journalEntries.filter(e => e.monthKey === state.currentMonth);

  const reportText = buildWhatsAppReportMessage(state.currentMonth, currentSettlement, monthEntries.length);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    shareViaWhatsApp(reportText, phone);
  };

  const handleEmail = () => {
    shareViaEmail(`تقرير الإدارة المالية للمزرعة - ${state.currentMonth}`, reportText);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative space-y-5">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-800 text-sm">مشاركة تقرير شهر ({state.currentMonth})</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Preview */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">معاينة نص الملخص المالي:</label>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {reportText}
          </div>
        </div>

        {/* Phone Input */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">رقم الهاتف لإرسال الواتس اب مباشر (اختياري):</label>
          <input
            type="text"
            placeholder="مثال: 0501234567"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-mono"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-2">
          <button
            onClick={handleWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>إرسال واتساب</span>
          </button>

          <button
            onClick={handleEmail}
            className="bg-sky-700 hover:bg-sky-800 text-white p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition"
          >
            <Mail className="w-4 h-4" />
            <span>إرسال إيميل</span>
          </button>

          <button
            onClick={handleCopy}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
          </button>

          <button
            onClick={triggerPrintReport}
            className="bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>

      </div>
    </div>
  );
};
