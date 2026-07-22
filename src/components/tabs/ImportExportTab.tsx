import React, { useRef, useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Share2, 
  Printer, 
  MessageSquare, 
  Mail, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles 
} from 'lucide-react';
import { AppState } from '../../types';
import { parseExcelUpload, exportFarmToExcel } from '../../utils/excel';
import { shareViaWhatsApp, shareViaEmail, buildWhatsAppReportMessage, triggerPrintReport, shareViaWebShareAPI } from '../../utils/sharing';
import { resetAppStateToDefaults } from '../../utils/storage';

interface ImportExportTabProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const ImportExportTab: React.FC<ImportExportTabProps> = ({ state, setState }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setImportSuccess(null);

    try {
      const parsed = await parseExcelUpload(file);
      
      let empCount = 0;
      let jrnCount = 0;
      let drpCount = 0;

      setState(prev => {
        const updatedEmps = parsed.employees.length > 0 ? parsed.employees : prev.employees;
        const updatedJrns = parsed.journalEntries.length > 0 ? [...parsed.journalEntries, ...prev.journalEntries] : prev.journalEntries;
        const updatedDropdowns = parsed.dropdowns.length > 0 ? [...parsed.dropdowns, ...prev.dropdowns] : prev.dropdowns;

        empCount = parsed.employees.length;
        jrnCount = parsed.journalEntries.length;
        drpCount = parsed.dropdowns.length;

        return {
          ...prev,
          employees: updatedEmps,
          journalEntries: updatedJrns,
          dropdowns: updatedDropdowns
        };
      });

      setImportSuccess(`تم استيراد الملف بنجاح! تم استخراج (${empCount}) موظف، (${jrnCount}) حركة يومية، و (${drpCount}) عناصر إعدادات.`);
    } catch (err) {
      alert('حدث خطأ أثناء قراءة ملف الأكسيل. يرجى التأكد من أن الملف بصيغة xlsx أو csv سليمة.');
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportFullExcel = () => {
    const currentSettlement = state.settlements[state.currentMonth];
    exportFarmToExcel(
      state.currentMonth,
      state.employees,
      state.journalEntries,
      state.dropdowns,
      currentSettlement
    );
  };

  const handleWhatsAppShare = () => {
    const currentSettlement = state.settlements[state.currentMonth];
    const monthEntries = state.journalEntries.filter(e => e.monthKey === state.currentMonth);
    const msg = buildWhatsAppReportMessage(state.currentMonth, currentSettlement, monthEntries.length);
    shareViaWhatsApp(msg, whatsappPhone);
  };

  const handleEmailShare = () => {
    const currentSettlement = state.settlements[state.currentMonth];
    const monthEntries = state.journalEntries.filter(e => e.monthKey === state.currentMonth);
    const msg = buildWhatsAppReportMessage(state.currentMonth, currentSettlement, monthEntries.length);
    shareViaEmail(`تقرير الإدارة المالية للمزرعة - ${state.currentMonth}`, msg);
  };

  const handleNativeShare = async () => {
    const currentSettlement = state.settlements[state.currentMonth];
    const monthEntries = state.journalEntries.filter(e => e.monthKey === state.currentMonth);
    const msg = buildWhatsAppReportMessage(state.currentMonth, currentSettlement, monthEntries.length);
    const shared = await shareViaWebShareAPI(`تقرير المزرعة - ${state.currentMonth}`, msg);
    if (!shared) {
      alert('ميزة المشاركة المباشرة عبر النظام غير مدعومة بالمتصفح الحالي. يرجى استخدام زر الواتساب أو الإيميل.');
    }
  };

  const handleResetData = () => {
    if (confirm('هل أنت متأكد من إعادة ضبط جميع البيانات للقيم الافتراضية الأولية؟ سيفقد أي تعديل غير محفوظ.')) {
      const reset = resetAppStateToDefaults();
      setState(reset);
      alert('تمت إعادة ضبط البيانات بنجاح.');
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* EXCEL IMPORT SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-base border-b border-slate-100 pb-3">
          <Upload className="w-5 h-5 text-emerald-700" />
          <h3>استيراد ملف أكسيل المزرعة (Excel File Import)</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          يمكنك رفع ملف أكسيل (`.xlsx`, `.xls`, `.csv`) يحتوي أوراق العمل الخاصة بمزرعتك (صفحة "الإعدادات"، صفحة "اليومية"، أو صفحة "الموظفين"). وسيتم قراءة البيانات وتحويلها تلقائياً إلى قاعدة بيانات التطبيق!
        </p>

        {/* Drag & Drop Upload Zone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-100/50 p-8 rounded-2xl text-center cursor-pointer transition space-y-3"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <div className="w-12 h-12 bg-emerald-700 text-white rounded-full flex items-center justify-center mx-auto shadow">
            <FileSpreadsheet className="w-6 h-6" />
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm">اضغط هنا أو اسحب ملف الأكسيل لرفعه</h4>
            <p className="text-xs text-slate-500 mt-1">يدعم ملفات .xlsx, .xls, .csv</p>
          </div>

          {uploading && (
            <div className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>جاري تحليل ملف الأكسيل واستخراج الجداول...</span>
            </div>
          )}
        </div>

        {importSuccess && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{importSuccess}</span>
          </div>
        )}
      </div>

      {/* EXCEL EXPORT SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-base border-b border-slate-100 pb-3">
          <Download className="w-5 h-5 text-emerald-700" />
          <h3>تصدير أوراق العمل إلى ملف أكسيل جديد (Excel Export)</h3>
        </div>

        <p className="text-xs text-slate-600">
          تصدير جميع سجلات اليومية العامة، دفاتر الأستاذ، كشف الموظفين، وتقارير تسوية العهدة الشهرية في مصنف أكسيل متكامل متعدد الصفحات.
        </p>

        <button
          onClick={handleExportFullExcel}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>تنزيل ملف أكسيل لشهر ({state.currentMonth})</span>
        </button>
      </div>

      {/* SHARE & MULTI-APP DISPATCH SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-base border-b border-slate-100 pb-3">
          <Share2 className="w-5 h-5 text-emerald-700" />
          <h3>مشاركة تقرير المزرعة المالي عبر التطبيقات المتاحة (WhatsApp, Email, Print)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* WhatsApp Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <MessageSquare className="w-5 h-5" />
              <span>مشاركة عبر الواتس اب (WhatsApp)</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              إرسال ملخص تسوية العهدة مع التفاصيل إلى مدير المزرعة أو المكتب الرئيسي.
            </p>
            <input
              type="text"
              placeholder="رقم الهاتف اختياري (مثل: 96650xxxxxxx)"
              value={whatsappPhone}
              onChange={e => setWhatsappPhone(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
            />
            <button
              onClick={handleWhatsAppShare}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>فتح الواتس اب وإرسال</span>
            </button>
          </div>

          {/* Email Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-sky-700 font-bold">
              <Mail className="w-5 h-5" />
              <span>مشاركة عبر البريد الإلكتروني</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              إنشاء مسودة إيميل رسمية تتضمن تقرير العهدة الشهري بضغطة زر.
            </p>
            <button
              onClick={handleEmailShare}
              className="w-full bg-sky-700 hover:bg-sky-800 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition mt-auto"
            >
              <Mail className="w-4 h-4" />
              <span>إرسال إيميل رسمي</span>
            </button>
          </div>

          {/* Print & Mobile Native Share */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Printer className="w-5 h-5" />
              <span>الطباعة والمشاركة الشاملة</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              طباعة كشف تسوية العهدة مباشرة أو مشاركتها عبر تطبيقات الأندرويد.
            </p>
            <div className="space-y-2">
              <button
                onClick={triggerPrintReport}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة التقرير / حفظ PDF</span>
              </button>

              <button
                onClick={handleNativeShare}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة عبر تطبيقات الجوال</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* RESET SYSTEM DATA */}
      <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-200 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-rose-900 text-xs sm:text-sm">إعادة ضبط واستعادة البيانات التجريبية الأولية</h4>
          <p className="text-xs text-rose-700/80 mt-0.5">استعادة جدول الموظفين المسجل والبيانات الافتراضية.</p>
        </div>
        <button
          onClick={handleResetData}
          className="bg-rose-700 hover:bg-rose-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          <span>إعادة الضبط</span>
        </button>
      </div>

    </div>
  );
};
