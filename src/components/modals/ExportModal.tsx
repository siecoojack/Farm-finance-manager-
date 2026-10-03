import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Building2, 
  Download, 
  CheckCircle2, 
  Calendar,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { AppState } from '../../types';
import { exportOfficialOfficeExcel, exportFullFarmBackupExcel } from '../../utils/excel';

interface ExportModalProps {
  state: AppState;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ state, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState(state.currentMonth);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  const monthsList = [
    '2026-07', '2026-06', '2026-05', '2026-04', '2026-03', '2026-02', '2026-01'
  ];

  const handleExportOffice = () => {
    exportOfficialOfficeExcel({ ...state, currentMonth: selectedMonth });
    setDownloadSuccessMsg(`تم بنجاح تنزيل ملف المكتب الرئيسي لشهر (${selectedMonth}) بالـ 5 ورقات الرسمية!`);
    setTimeout(() => setDownloadSuccessMsg(null), 4000);
  };

  const handleExportBackup = () => {
    exportFullFarmBackupExcel({ ...state, currentMonth: selectedMonth });
    setDownloadSuccessMsg(`تم بنجاح تنزيل الأرشيف الداخلي الكامل لشهر (${selectedMonth})!`);
    setTimeout(() => setDownloadSuccessMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800/80 rounded-xl text-emerald-300">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base">تصدير تقارير وبيانات المزرعة إلى Excel</h3>
              <p className="text-xs text-slate-300 mt-0.5">اختر نوع الملف المطلوب تصديره وفقاً لجهة الاستخدام</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-xl hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          
          {/* Month Selector Bar */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-slate-800 text-xs">حدد شهر التقرير المراد تصديره:</span>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
            >
              {monthsList.map(m => (
                <option key={m} value={m}>شهر: {m}</option>
              ))}
            </select>
          </div>

          {/* Success Banner */}
          {downloadSuccessMsg && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 p-3 rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>{downloadSuccessMsg}</span>
            </div>
          )}

          {/* Two Large Clear Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* OPTION 1: HEAD OFFICE OFFICIAL FILE (5 SHEETS ONLY) */}
            <div className="bg-emerald-50/50 border-2 border-emerald-600 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                  <Building2 className="w-5 h-5 text-emerald-700" />
                  <span>1. ملف المكتب الرئيسي الرسمي</span>
                </div>
                
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  يحتوي <strong className="text-emerald-900">حصرياً على الـ 5 ورقات الرسمية</strong> المعتمدة المطلوبة شهرياً لتصفية العهدة بدون أي بيانات داخلية:
                </p>

                <ul className="space-y-1.5 text-[11px] text-slate-700 font-semibold pr-1">
                  <li className="flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>ورقة تصفية العهدة الشهرية</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>كشف مسير المرتبات الرسمي</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>ورقة المصروفات (المصروفات + الميس الرسمي + العيش + الغاز)</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>ورقة المبيعات النقدية للفرزة والمستبعدات</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>ميزان حركة وجرد العلف والأدوية البيطرية</span>
                  </li>
                </ul>

                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200 text-[10px] text-slate-500">
                  🔒 مستبعد منها تماماً دفاتر الأستاذ، السلف، المشتروات، والرواتب الداخلية.
                </div>
              </div>

              <button
                onClick={handleExportOffice}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition text-xs"
              >
                <Download className="w-4 h-4" />
                <span>تحميل ملف المكتب الرئيسي (5 ورقات)</span>
              </button>
            </div>

            {/* OPTION 2: FULL INTERNAL FARM BACKUP */}
            <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                  <HardDrive className="w-5 h-5 text-slate-700" />
                  <span>2. أرشيف المزرعة الداخلي الشامل</span>
                </div>
                
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  نسخة احتياطية متكاملة لمدير المزرعة تضم كافة السجلات الداخلية والدفاتر:
                </p>

                <ul className="space-y-1.5 text-[11px] text-slate-700 font-semibold pr-1">
                  <li className="flex items-center gap-1.5 text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>اليومية العامة الشاملة (رسمي وداخلي)</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>مسير الرواتب الداخلي (سلف، مشتروات، ميس)</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>قاعدة بيانات العاملين والأرقام القومية</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>سجلات سلف العاملين ومشتروات البيض</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>جرد العلف والأدوية البيطرية</span>
                  </li>
                </ul>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[10px] text-slate-500">
                  📁 مخصص لأرشيف المدير وحفظ قاعدة البيانات محلياً.
                </div>
              </div>

              <button
                onClick={handleExportBackup}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition text-xs"
              >
                <Download className="w-4 h-4" />
                <span>تحميل الأرشيف الداخلي الشامل</span>
              </button>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 transition text-xs"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
