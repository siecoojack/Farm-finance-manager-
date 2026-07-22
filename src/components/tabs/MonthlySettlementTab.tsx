import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Share2, 
  Download, 
  CheckCircle, 
  Building2, 
  UserCheck, 
  PieChart, 
  Save, 
  MessageSquare
} from 'lucide-react';
import { AppState } from '../../types';
import { buildWhatsAppReportMessage, shareViaWhatsApp, shareViaEmail, triggerPrintReport } from '../../utils/sharing';
import { exportFarmToExcel } from '../../utils/excel';

interface MonthlySettlementTabProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const MonthlySettlementTab: React.FC<MonthlySettlementTabProps> = ({ state, setState }) => {
  const currentMonth = state.currentMonth;
  const settlement = state.settlements[currentMonth] || {
    monthKey: currentMonth,
    monthName: currentMonth,
    custodianName: 'مهندس أحمد علي الخولي',
    openingBalance: 0,
    totalAdvancesReceived: 0,
    totalExpenses: 0,
    totalSalaries: 0,
    closingBalance: 0,
    status: 'مسودة',
    updatedAt: new Date().toISOString()
  };

  const currentMonthEntries = state.journalEntries.filter(e => e.monthKey === currentMonth);

  // Calculate Advances & Expenses
  const calculatedAdvances = currentMonthEntries
    .filter(e => e.type === 'قبض عهدة')
    .reduce((sum, e) => sum + e.amount, 0);

  const calculatedExpenses = currentMonthEntries
    .filter(e => e.type === 'مصروف')
    .reduce((sum, e) => sum + e.amount, 0);

  const calculatedSalaries = currentMonthEntries
    .filter(e => e.type === 'راتب')
    .reduce((sum, e) => sum + e.amount, 0);

  const openingBal = settlement.openingBalance || 0;
  const totalAvailable = openingBal + calculatedAdvances;
  const totalOutflows = calculatedExpenses + calculatedSalaries;
  const closingBal = totalAvailable - totalOutflows;

  // Form State
  const [custodianName, setCustodianName] = useState(settlement.custodianName || 'مهندس أحمد علي الخولي');
  const [openingBalance, setOpeningBalance] = useState<number>(openingBal);
  const [reportStatus, setReportStatus] = useState<any>(settlement.status || 'مسودة');
  const [reportNotes, setReportNotes] = useState<string>(settlement.notes || '');

  // Category breakdown for percentage visualizer
  const categoryMap: Record<string, number> = {};
  currentMonthEntries.forEach(e => {
    if (e.type === 'مصروف' || e.type === 'راتب') {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    }
  });

  const categoryBreakdown = Object.entries(categoryMap).map(([cat, amt]) => ({
    category: cat,
    amount: amt,
    percentage: calculatedExpenses > 0 ? ((amt / calculatedExpenses) * 100).toFixed(1) : '0'
  })).sort((a, b) => b.amount - a.amount);

  const handleSaveSettlement = () => {
    const updatedSettlement = {
      monthKey: currentMonth,
      monthName: settlement.monthName || currentMonth,
      custodianName,
      openingBalance: Number(openingBalance),
      totalAdvancesReceived: calculatedAdvances,
      totalExpenses: calculatedExpenses,
      totalSalaries: calculatedSalaries,
      closingBalance: Number(openingBalance) + calculatedAdvances - (calculatedExpenses + calculatedSalaries),
      notes: reportNotes,
      status: reportStatus,
      updatedAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      settlements: {
        ...prev.settlements,
        [currentMonth]: updatedSettlement
      }
    }));

    alert('تم حفظ كشف تسوية العهدة بنجاح.');
  };

  const handleWhatsApp = () => {
    const msg = buildWhatsAppReportMessage(currentMonth, {
      ...settlement,
      custodianName,
      openingBalance,
      totalAdvancesReceived: calculatedAdvances,
      totalExpenses: calculatedExpenses,
      closingBalance: closingBal,
      notes: reportNotes
    }, currentMonthEntries.length);

    shareViaWhatsApp(msg);
  };

  const handleEmail = () => {
    const msg = buildWhatsAppReportMessage(currentMonth, {
      ...settlement,
      custodianName,
      openingBalance,
      totalAdvancesReceived: calculatedAdvances,
      totalExpenses: calculatedExpenses,
      closingBalance: closingBal,
      notes: reportNotes
    }, currentMonthEntries.length);

    shareViaEmail(`تقرير تسوية العهدة المالية للمزرعة - لشهر ${currentMonth}`, msg);
  };

  const handleExcelExport = () => {
    exportFarmToExcel(
      currentMonth,
      state.employees,
      state.journalEntries,
      state.dropdowns,
      {
        ...settlement,
        custodianName,
        openingBalance,
        totalAdvancesReceived: calculatedAdvances,
        totalExpenses: calculatedExpenses,
        totalSalaries: calculatedSalaries,
        closingBalance: closingBal,
        notes: reportNotes,
        status: reportStatus,
        updatedAt: new Date().toISOString()
      }
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Top Banner & Quick Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-800" />
            <h2 className="text-lg font-bold text-slate-900">تقرير تسوية العهدة الشهرية للمكتب الرئيسي</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            كشف مطابقة العهد الميدانية، المقبوضات والمصروفات للتسليم والإعتماد الإداري.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSaveSettlement}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الكشف</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
            title="إرسال عبر الواتساب"
          >
            <MessageSquare className="w-4 h-4" />
            <span>إرسال واتساب</span>
          </button>

          <button
            onClick={handleEmail}
            className="bg-sky-700 hover:bg-sky-800 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            title="إرسال عبر البريد الإلكتروني"
          >
            <Share2 className="w-4 h-4" />
            <span>إيميل</span>
          </button>

          <button
            onClick={handleExcelExport}
            className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            title="تصدير أكسيل"
          >
            <Download className="w-4 h-4" />
            <span>أكسيل</span>
          </button>

          <button
            onClick={triggerPrintReport}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition"
            title="طباعة التقرير"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* Printable Official Report Document Container */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border-2 border-slate-200 shadow-md space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-center justify-between text-slate-900 gap-4">
          <div className="text-right">
            <h1 className="text-2xl font-black tracking-tight text-emerald-950">إدارة مزارع الإنتاج الزراعي</h1>
            <p className="text-xs font-bold text-slate-600">قسم الحسابات والإدارة المالية — المكتب الرئيسي</p>
            <p className="text-xs text-slate-500">كشف تسوية العهدة النقدية والمصروفات</p>
          </div>

          <div className="text-left bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs space-y-1">
            <div><span className="font-bold text-slate-700">فترة التقرير:</span> {currentMonth}</div>
            <div><span className="font-bold text-slate-700">تاريخ الإصدار:</span> {new Date().toLocaleDateString('ar-EG')}</div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-700">حالة التقرير:</span> 
              <span className="bg-emerald-700 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                {reportStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Report Controls (Editable fields in edit mode, printable text in print) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:p-0 print:border-none">
          <div>
            <label className="block text-slate-700 font-bold mb-1 print:hidden">اسم أمين العهدة / المهندس المسؤول:</label>
            <div className="hidden print:block font-bold">أمين العهدة: {custodianName}</div>
            <input
              type="text"
              value={custodianName}
              onChange={e => setCustodianName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800 print:hidden"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 print:hidden">الرصيد المرحل من الشهر السابق (ج.م):</label>
            <div className="hidden print:block font-bold">الرصيد السابق: {openingBalance} ج.م</div>
            <input
              type="number"
              value={openingBalance}
              onChange={e => setOpeningBalance(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800 print:hidden"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 print:hidden">حالة التقرير:</label>
            <select
              value={reportStatus}
              onChange={e => setReportStatus(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800 print:hidden"
            >
              <option value="مسودة">مسودة (قيد التجميع)</option>
              <option value="معتمد من المزرعة">معتمد من مهندس المزرعة</option>
              <option value="مكتم ومعتمد للمكتب الرئيسي">مكتمل ومرحل للمكتب الرئيسي</option>
            </select>
          </div>
        </div>

        {/* Financial Reconciliation Summary Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-800" />
            <span>جدول المطابقة المالي وتسوية الحساب</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-emerald-900 text-white font-bold">
                  <th className="p-3 border border-emerald-800">البيان والتفاصيل المالية</th>
                  <th className="p-3 border border-emerald-800 text-left w-48">المبلغ (ج.م)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-900">
                <tr>
                  <td className="p-3 font-semibold">1. الرصيد المرحل من الفترة السابقة (Opening Balance)</td>
                  <td className="p-3 text-left font-bold font-mono">{openingBal.toLocaleString('ar-EG')} ج.م</td>
                </tr>
                <tr className="bg-emerald-50/50">
                  <td className="p-3 font-semibold text-emerald-900">2. زائد: إجمالي مقبوضات وتدفوعات العهدة الواردة (Advances Received)</td>
                  <td className="p-3 text-left font-bold font-mono text-emerald-800">+{calculatedAdvances.toLocaleString('ar-EG')} ج.م</td>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <td className="p-3">3. إجمالي النقدية المتاحة بالعهدة (1 + 2)</td>
                  <td className="p-3 text-left font-black font-mono text-slate-900">{totalAvailable.toLocaleString('ar-EG')} ج.م</td>
                </tr>
                <tr className="bg-rose-50/50">
                  <td className="p-3 font-semibold text-rose-900">4. يخصم: إجمالي المصروفات التشغيلية للمزرعة (Expenses)</td>
                  <td className="p-3 text-left font-bold font-mono text-rose-700">-{calculatedExpenses.toLocaleString('ar-EG')} ج.م</td>
                </tr>
                {calculatedSalaries > 0 && (
                  <tr className="bg-blue-50/50">
                    <td className="p-3 font-semibold text-blue-900">5. يخصم: إجمالي مسيرات الرواتب المدفوعة (Salaries Paid)</td>
                    <td className="p-3 text-left font-bold font-mono text-blue-700">-{calculatedSalaries.toLocaleString('ar-EG')} ج.م</td>
                  </tr>
                )}
                <tr className="bg-emerald-900 text-white font-black text-sm">
                  <td className="p-3">صافي الرصيد المتبقي بالعهدة للفترة القادمة (Closing Balance)</td>
                  <td className="p-3 text-left font-mono">{closingBal.toLocaleString('ar-EG')} ج.م</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Category Visual & Breakdown */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-800" />
            <span>توزيع المصروفات حسب البنود المعتمدة</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>{cat.category}</span>
                  <span className="font-mono text-emerald-800">{cat.amount.toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${Math.min(Number(cat.percentage), 100)}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 text-left">{cat.percentage}% من إجمالي المصاريف</div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes for Main Office */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-slate-800">ملاحظات وتسويات أمين العهدة للمكتب الرئيسي:</label>
          <textarea
            rows={3}
            value={reportNotes}
            onChange={e => setReportNotes(e.target.value)}
            placeholder="اكتب أي ملاحظات أو فواتير آتر معلقة..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 print:bg-white print:border-none print:p-0"
          ></textarea>
        </div>

        {/* Signatures & Approvals Section */}
        <div className="pt-8 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-8">
            <div>
              <p className="font-bold text-slate-800">إعداد / أمين العهدة والمهندس</p>
              <p className="text-[11px] text-slate-500 mt-1">{custodianName}</p>
            </div>
            <div className="border-b border-dashed border-slate-400 w-32 mx-auto pt-4"></div>
            <p className="text-[10px] text-slate-400">التوقيع والتاريخ</p>
          </div>

          <div className="space-y-8">
            <div>
              <p className="font-bold text-slate-800">مراجعة / المحاسب المالي</p>
              <p className="text-[11px] text-slate-500 mt-1">قسم المراجعة والتدقيق</p>
            </div>
            <div className="border-b border-dashed border-slate-400 w-32 mx-auto pt-4"></div>
            <p className="text-[10px] text-slate-400">التوقيع والتاريخ</p>
          </div>

          <div className="space-y-8">
            <div>
              <p className="font-bold text-slate-800">اعتماد / مدير المكتب الرئيسي</p>
              <p className="text-[11px] text-slate-500 mt-1">الإدارة العامة للمزارع</p>
            </div>
            <div className="border-b border-dashed border-slate-400 w-32 mx-auto pt-4"></div>
            <p className="text-[10px] text-slate-400">التوقيع والتاريخ</p>
          </div>
        </div>

      </div>

    </div>
  );
};
