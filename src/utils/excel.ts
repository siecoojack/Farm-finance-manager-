import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { AppState, Employee, JournalEntry, DropdownOption, MonthlySettlement } from '../types';

/**
 * -------------------------------------------------------------
 * COLOR PALETTE & DESIGN SYSTEM (طراز الهوية البصرية للمزرعة)
 * -------------------------------------------------------------
 */
const PALETTE = {
  farmDarkGreen: 'FF064E3B',    // أخضر زمردي داكن فخم (العناوين والترويسات الرئيسية)
  farmTeal: 'FF0F766E',         // أخضر عشبي / تيل (العناوين الفرعية والأقسام)
  farmLightGreen: 'FFD1FAE5',    // أخضر ناعم مريح للعين (التمييز والوفر)
  slateHeader: 'FF1E293B',      // رمادي داكن ناعم (رؤوس أعمدة الجداول)
  slateDark: 'FF0F172A',        // كحلي داكن جداً (سطور الإجماليات)
  slateLight: 'FFF8FAFC',       // رمادي فاتح جداً (صفوف الزيبرا بالتناوب)
  borderGray: 'FFCBD5E1',       // إطارات الخلايا (رمادي متناسق ومريح)
  deficitAmberBg: 'FFFEF3C7',   // خلفية العجز المالي
  deficitAmberText: 'FF92400E', // خط العجز المالي
  surplusGreenBg: 'FFDCFCE7',   // خلفية الوفر المالي
  surplusGreenText: 'FF166534', // خط الوفر المالي
  totalRowBg: 'FFF1F5F9',       // رمادي فاتح مخصص لصفوف الإجماليات
  white: 'FFFFFFFF',            // أبيض
  textDark: 'FF0F172A',         // لون النصوص الداكنة
};

/**
 * Helper to download a configured ExcelJS Workbook in the browser
 */
async function downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Setup standard RTL view and base properties for a worksheet
 */
function setupWorksheetRTL(ws: ExcelJS.Worksheet): void {
  ws.views = [{ rightToLeft: true } as any];
  ws.properties.defaultRowHeight = 22;
}

/**
 * Apply cell style helper
 */
function styleCell(
  cell: ExcelJS.Cell,
  options: {
    bg?: string;
    color?: string;
    bold?: boolean;
    size?: number;
    align?: 'center' | 'right' | 'left';
    numFmt?: string;
    borderTop?: 'thin' | 'double' | 'medium';
    borderBottom?: 'thin' | 'double' | 'medium';
  }
) {
  cell.font = {
    name: 'Calibri',
    size: options.size || 11,
    bold: options.bold || false,
    color: { argb: options.color || PALETTE.textDark }
  };

  if (options.bg) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: options.bg }
    };
  }

  cell.alignment = {
    vertical: 'middle',
    horizontal: options.align || 'center',
    wrapText: true
  };

  cell.border = {
    top: { style: options.borderTop || 'thin', color: { argb: PALETTE.borderGray } },
    left: { style: 'thin', color: { argb: PALETTE.borderGray } },
    bottom: { style: options.borderBottom || 'thin', color: { argb: PALETTE.borderGray } },
    right: { style: 'thin', color: { argb: PALETTE.borderGray } }
  };

  if (options.numFmt) {
    cell.numFmt = options.numFmt;
  }
}

/**
 * -------------------------------------------------------------
 * 1. OFFICIAL HEAD OFFICE EXCEL REPORT (ملف المكتب الرئيسي الرسمي)
 * Contains EXACTLY and ONLY the 5 official sheets required by the Head Office:
 * 1. تصفية العهدة الشهرية
 * 2. المرتبات (الرسمي المعتمد بدون سلف وميس)
 * 3. المصروفات (المصروفات التشغيلية + الميس الرسمي + العيش + الغاز + الفواتير)
 * 4. المبيعات (المبيعات النقدية للبيض المستبعد والشكاير والخردة)
 * 5. جرد العلف والأدوية (ميزان حركة العلف وميزان حركة الأدوية)
 * -------------------------------------------------------------
 */
export async function exportOfficialOfficeExcel(state: AppState): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'نظام الإدارة المالية لمزرعة الدواجن';
  wb.created = new Date();

  const monthKey = state.currentMonth;
  const currentMonthEntries = state.journalEntries.filter(e => e.monthKey === monthKey);
  const regularEmployees = state.employees.filter(e => e.status === 'منتظم' || e.status === 'نشط');

  // Core Calculations:
  // 1. Official Payroll Totals
  let totalOfficialPayroll = 0;
  const officialPayrollData = regularEmployees.map((emp, idx) => {
    const workDays = emp.workDays !== undefined ? emp.workDays : 30;
    const raiseAmount = Math.floor(emp.salary * ((emp.raisePercentage || 0) / 100));
    const salaryAfterRaise = emp.salary + raiseAmount;
    const isWorker = emp.role.includes('عامل');
    const vacationAllowance = emp.vacationAllowanceOverride !== undefined 
      ? emp.vacationAllowanceOverride 
      : (isWorker ? Math.floor(Math.floor(workDays / 7) * (salaryAfterRaise / 30) / 5) * 5 : 0);
    const penalties = emp.penalties || 0;
    const officialNet = Math.round((salaryAfterRaise + vacationAllowance - penalties) / 5) * 5;
    totalOfficialPayroll += officialNet;

    return {
      index: idx + 1,
      empId: emp.id,
      name: emp.name,
      role: emp.role,
      status: emp.status,
      workDays,
      salary: emp.salary,
      raisePercent: `${emp.raisePercentage || 0}%`,
      raiseAmount,
      salaryAfterRaise,
      vacationAllowance,
      penalties,
      officialNet
    };
  });

  // 2. Official Expenses Totals
  const approvedExpenseEntries = currentMonthEntries.filter(e => 
    e.type === 'مصروف' && 
    !e.category.includes('سلف') && 
    !e.statement.includes('سلف') &&
    e.debitAccount !== 'سلف عاملين'
  );
  const operationalExpensesTotal = approvedExpenseEntries.reduce((sum, e) => sum + e.amount, 0);
  const officialMiesAllowance = regularEmployees.length * (state.officialMiesPerPerson || 1000);
  const totalOfficialExpenses = operationalExpensesTotal + officialMiesAllowance;

  // 3. Official Cash Sales (Journal + Sales Tab)
  const journalSales = currentMonthEntries.filter(e => e.type === 'مبيعات');
  const tabSales = (state.salesEntries || [])
    .filter(s => s.monthKey === monthKey && !s.isGift)
    .map(s => ({
      id: s.id,
      date: s.date,
      voucherNo: `SALE-${s.id.slice(-4)}`,
      category: 'مبيعات بيض ومنتجات',
      sector: 'المبيعات',
      amount: s.total,
      type: 'مبيعات' as const,
      paymentMethod: 'نقداً',
      debitAccount: 'النقدية',
      creditAccount: 'المبيعات',
      custodian: 'أمين العهدة',
      statement: s.statement,
      quantity: s.quantity,
      unitPrice: s.unitPrice,
      notes: s.recipient ? `العميل: ${s.recipient}` : '',
      monthKey: s.monthKey,
      createdAt: new Date().toISOString(),
      isInternal: false
    }));
  const cashSalesEntries = [...journalSales, ...tabSales];
  const totalCashSales = cashSalesEntries.reduce((sum, e) => sum + e.amount, 0);

  // 4. Advances Received from Head Office (العهدة الواردة من المكتب)
  const advancesReceivedEntries = currentMonthEntries.filter(e => 
    e.type === 'قبض عهدة' || 
    e.category.includes('توريد') || 
    e.creditAccount.includes('محولة من الشركة') ||
    e.creditAccount.includes('تحويل بنكي')
  );
  const totalAdvancesReceived = advancesReceivedEntries.reduce((sum, e) => sum + e.amount, 0);

  // 5. Settlement Record
  const settlement = state.settlements[monthKey] || {
    monthKey,
    monthName: monthKey,
    custodianName: 'مهندس أحمد علي الخولي',
    openingBalance: 0,
    totalAdvancesReceived,
    totalExpenses: totalOfficialExpenses,
    totalSalaries: totalOfficialPayroll,
    closingBalance: 0,
    status: 'مسودة',
    updatedAt: new Date().toISOString()
  };

  const openingBalance = settlement.openingBalance || 0;
  const totalAvailableFunds = openingBalance + totalAdvancesReceived + totalCashSales;
  const closingBalance = totalAvailableFunds - totalOfficialExpenses;

  // =============================================================
  // SHEET 1: تصفية العهدة الشهرية (Settlement Overview)
  // =============================================================
  const ws1 = wb.addWorksheet('تصفية العهدة الشهرية');
  setupWorksheetRTL(ws1);

  // Column Widths
  ws1.columns = [
    { key: 'colA', width: 8 },
    { key: 'colB', width: 44 },
    { key: 'colC', width: 28 },
    { key: 'colD', width: 24 },
  ];

  // Title Banner
  ws1.mergeCells('A1:D1');
  const title1 = ws1.getCell('A1');
  title1.value = 'مزرعة الزريقي لجدود وأمهات التسمين - كشف تصفية وتسوية العهدة الشهرية';
  styleCell(title1, { bg: PALETTE.farmDarkGreen, color: PALETTE.white, bold: true, size: 14 });
  ws1.getRow(1).height = 36;

  // Subtitle Banner
  ws1.mergeCells('A2:B2');
  const sub1A = ws1.getCell('A2');
  sub1A.value = `فترة التقرير: شهر (${monthKey})`;
  styleCell(sub1A, { bg: PALETTE.farmTeal, color: PALETTE.white, bold: true, size: 11 });

  ws1.mergeCells('C2:D2');
  const sub1B = ws1.getCell('C2');
  sub1B.value = `أمين العهدة المسؤول: ${settlement.custodianName || 'مهندس أحمد علي الخولي'}`;
  styleCell(sub1B, { bg: PALETTE.farmTeal, color: PALETTE.white, bold: true, size: 11 });
  ws1.getRow(2).height = 26;

  let r = 4;

  // Section A Header
  ws1.mergeCells(`A${r}:D${r}`);
  const secA = ws1.getCell(`A${r}`);
  secA.value = 'أولاً: المصروفات التشغيلية المعتمدة وميس المزرعة الرسمي (Approved Expenses)';
  styleCell(secA, { bg: PALETTE.slateHeader, color: PALETTE.white, bold: true, size: 11, align: 'right' });
  ws1.getRow(r).height = 24;
  r++;

  // Section A Columns
  const secACols = ['م', 'البيان والتفاصيل', 'التصنيف / البند', 'المبلغ المعتمد (ج.م)'];
  secACols.forEach((colName, cIdx) => {
    const c = ws1.getCell(r, cIdx + 1);
    c.value = colName;
    styleCell(c, { bg: 'FFE2E8F0', bold: true, color: PALETTE.textDark });
  });
  ws1.getRow(r).height = 22;
  r++;

  // Operational Expenses Rows
  approvedExpenseEntries.forEach((entry, idx) => {
    ws1.getCell(r, 1).value = idx + 1;
    ws1.getCell(r, 2).value = entry.statement;
    ws1.getCell(r, 3).value = entry.category;
    ws1.getCell(r, 4).value = entry.amount;

    styleCell(ws1.getCell(r, 1), { align: 'center' });
    styleCell(ws1.getCell(r, 2), { align: 'right' });
    styleCell(ws1.getCell(r, 3), { align: 'right' });
    styleCell(ws1.getCell(r, 4), { align: 'center', numFmt: '#,##0 "ج.م"', bold: true });
    r++;
  });

  // Official Mies Fixed Allowance Line
  ws1.getCell(r, 1).value = approvedExpenseEntries.length + 1;
  ws1.getCell(r, 2).value = `ميس المزرعة الرسمي المعتمد من الشركة (${regularEmployees.length} عمال × ${state.officialMiesPerPerson || 1000} ج.م)`;
  ws1.getCell(r, 3).value = 'ميس المزرعة الرسمي';
  ws1.getCell(r, 4).value = officialMiesAllowance;

  styleCell(ws1.getCell(r, 1), { align: 'center' });
  styleCell(ws1.getCell(r, 2), { align: 'right', bold: true });
  styleCell(ws1.getCell(r, 3), { align: 'right' });
  styleCell(ws1.getCell(r, 4), { align: 'center', numFmt: '#,##0 "ج.م"', bold: true });
  r++;

  // Total Expenses Row
  ws1.mergeCells(`A${r}:C${r}`);
  const totExpLabel = ws1.getCell(`A${r}`);
  totExpLabel.value = 'إجمالي المصروفات المعتمدة شاملة الميس الرسمي (Total Expenses):';
  styleCell(totExpLabel, { bg: PALETTE.totalRowBg, bold: true, align: 'left', size: 11 });
  const totExpVal = ws1.getCell(`D${r}`);
  totExpVal.value = totalOfficialExpenses;
  styleCell(totExpVal, { bg: PALETTE.totalRowBg, bold: true, align: 'center', numFmt: '#,##0 "ج.م"', size: 12, borderBottom: 'double' });
  ws1.getRow(r).height = 26;
  r += 2;

  // Section B Header: Cash Sales
  ws1.mergeCells(`A${r}:D${r}`);
  const secB = ws1.getCell(`A${r}`);
  secB.value = 'ثانياً: المبيعات النقدية بالمزرعة (مستبعدات وبيض كسر وشكاير)';
  styleCell(secB, { bg: PALETTE.slateHeader, color: PALETTE.white, bold: true, size: 11, align: 'right' });
  ws1.getRow(r).height = 24;
  r++;

  const secBCols = ['م', 'البيان (الصنف المباع)', 'الكمية / السعر', 'القيمة الإجمالية (ج.م)'];
  secBCols.forEach((colName, cIdx) => {
    const c = ws1.getCell(r, cIdx + 1);
    c.value = colName;
    styleCell(c, { bg: 'FFE2E8F0', bold: true, color: PALETTE.textDark });
  });
  r++;

  if (cashSalesEntries.length === 0) {
    ws1.mergeCells(`A${r}:C${r}`);
    const emptySales = ws1.getCell(`A${r}`);
    emptySales.value = 'لا توجد مبيعات نقدية مسجلة لهذا الشهر';
    styleCell(emptySales, { align: 'center', color: 'FF64748B' });
    const emptyVal = ws1.getCell(`D${r}`);
    emptyVal.value = 0;
    styleCell(emptyVal, { align: 'center', numFmt: '#,##0 "ج.م"' });
    r++;
  } else {
    cashSalesEntries.forEach((sale, idx) => {
      ws1.getCell(r, 1).value = idx + 1;
      ws1.getCell(r, 2).value = sale.statement;
      ws1.getCell(r, 3).value = sale.quantity ? `${sale.quantity} عدد × ${sale.unitPrice || 0} ج.م` : '-';
      ws1.getCell(r, 4).value = sale.amount;

      styleCell(ws1.getCell(r, 1), { align: 'center' });
      styleCell(ws1.getCell(r, 2), { align: 'right' });
      styleCell(ws1.getCell(r, 3), { align: 'center' });
      styleCell(ws1.getCell(r, 4), { align: 'center', numFmt: '#,##0 "ج.م"', bold: true });
      r++;
    });
  }

  // Total Sales Row
  ws1.mergeCells(`A${r}:C${r}`);
  const totSalesLabel = ws1.getCell(`A${r}`);
  totSalesLabel.value = 'إجمالي المبيعات النقدية الموردة للعهدة (Total Cash Sales):';
  styleCell(totSalesLabel, { bg: PALETTE.totalRowBg, bold: true, align: 'left', size: 11 });
  const totSalesVal = ws1.getCell(`D${r}`);
  totSalesVal.value = totalCashSales;
  styleCell(totSalesVal, { bg: PALETTE.totalRowBg, bold: true, align: 'center', numFmt: '#,##0 "ج.م"', size: 12, borderBottom: 'double' });
  ws1.getRow(r).height = 26;
  r += 2;

  // Section C Header: Financial Summary & Final Balance
  ws1.mergeCells(`A${r}:D${r}`);
  const secC = ws1.getCell(`A${r}`);
  secC.value = 'ثالثاً: الخلاصة المحاسبية وموقف الرصيد النهائي للعهدة (Summary & Closing Balance)';
  styleCell(secC, { bg: PALETTE.farmDarkGreen, color: PALETTE.white, bold: true, size: 12, align: 'right' });
  ws1.getRow(r).height = 28;
  r++;

  const summaryRows = [
    { label: '(+) رصيد العهدة النقدي أول المدة (المرحل من الشهر السابق):', val: openingBalance, bg: 'FFFFFFFF', bold: true },
    { label: '(+) إجمالي دفعات العهدة النقدية المحولة من المكتب الرئيسي خلال الشهر:', val: totalAdvancesReceived, bg: 'FFFFFFFF', bold: false },
    { label: '(+) إجمالي المبيعات النقدية بالمزرعة خلال الشهر:', val: totalCashSales, bg: 'FFFFFFFF', bold: false },
    { label: '(=) إجمالي المقبوضات والسيولة النقدية المتاحة بالعهدة:', val: totalAvailableFunds, bg: 'FFF1F5F9', bold: true },
    { label: '(-) إجمالي المصروفات التشغيلية والميس المعتمد المنصرفة:', val: totalOfficialExpenses, bg: 'FFFFFFFF', bold: false },
    { label: '(=) صافي الرصيد الدفتري المتبقي المرحل للشهر القادم (Closing Balance):', val: closingBalance, bg: PALETTE.farmLightGreen, bold: true, isFinal: true },
  ];

  summaryRows.forEach(row => {
    ws1.mergeCells(`A${r}:C${r}`);
    const lbl = ws1.getCell(`A${r}`);
    lbl.value = row.label;
    styleCell(lbl, { bg: row.bg, bold: row.bold, align: 'right', size: row.isFinal ? 12 : 11 });

    const vl = ws1.getCell(`D${r}`);
    vl.value = row.val;
    styleCell(vl, { 
      bg: row.bg, 
      bold: true, 
      align: 'center', 
      numFmt: '#,##0 "ج.م"', 
      size: row.isFinal ? 13 : 11,
      borderBottom: row.isFinal ? 'double' : 'thin'
    });
    ws1.getRow(r).height = row.isFinal ? 30 : 24;
    r++;
  });

  r += 2;

  // Signatures Row
  ws1.getCell(`A${r}`).value = 'إعداد أمين العهدة:';
  ws1.getCell(`B${r}`).value = settlement.custodianName || 'مهندس أحمد علي الخولي';
  ws1.getCell(`C${r}`).value = 'مدير المزرعة:';
  ws1.getCell(`D${r}`).value = 'اعتماد الإدارة المالية:';
  [ws1.getCell(`A${r}`), ws1.getCell(`B${r}`), ws1.getCell(`C${r}`), ws1.getCell(`D${r}`)].forEach(c => {
    styleCell(c, { bold: true, align: 'center', size: 10, bg: 'FFF8FAFC' });
  });
  ws1.getRow(r).height = 30;

  // =============================================================
  // SHEET 2: مسير المرتبات (Official Payroll)
  // =============================================================
  const ws2 = wb.addWorksheet('مسير المرتبات');
  setupWorksheetRTL(ws2);

  ws2.columns = [
    { key: 'c1', width: 6 },   // م
    { key: 'c2', width: 12 },  // كود
    { key: 'c3', width: 28 },  // الاسم
    { key: 'c4', width: 18 },  // الوظيفة
    { key: 'c5', width: 12 },  // الحالة
    { key: 'c6', width: 12 },  // أيام العمل
    { key: 'c7', width: 16 },  // الراتب الأساسي
    { key: 'c8', width: 12 },  // العلاوة %
    { key: 'c9', width: 14 },  // مبلغ العلاوة
    { key: 'c10', width: 16 }, // الراتب بعد العلاوة
    { key: 'c11', width: 16 }, // بدل الراحات
    { key: 'c12', width: 14 }, // الجزاءات
    { key: 'c13', width: 20 }, // الصافي المعتمد
    { key: 'c14', width: 22 }, // توقيع الاستلام
  ];

  // Header Banner
  ws2.mergeCells('A1:N1');
  const t2 = ws2.getCell('A1');
  t2.value = `كشف مسير رواتب وبدلات العاملين المعتمد للمكتب الرئيسي - شهر (${monthKey})`;
  styleCell(t2, { bg: PALETTE.farmDarkGreen, color: PALETTE.white, bold: true, size: 13 });
  ws2.getRow(1).height = 36;

  // Table Columns
  const pCols = [
    'م', 'كود الموظف', 'اسم الموظف الكامل', 'المسمى الوظيفي', 'الحالة', 'أيام العمل', 
    'الراتب الأساسي', 'العلاوة %', 'مبلغ العلاوة', 'الراتب بعد العلاوة', 
    'بدل الراحات', 'الجزاءات والغياب', 'الصافي المعتمد للمكتب (ج.م)', 'توقيع أو بصمة الاستلام'
  ];

  pCols.forEach((colName, idx) => {
    const c = ws2.getCell(2, idx + 1);
    c.value = colName;
    styleCell(c, { bg: PALETTE.slateHeader, color: PALETTE.white, bold: true, size: 10 });
  });
  ws2.getRow(2).height = 26;

  let pr = 3;
  officialPayrollData.forEach(row => {
    const isZebra = pr % 2 === 0;
    const bg = isZebra ? PALETTE.slateLight : PALETTE.white;

    ws2.getCell(pr, 1).value = row.index;
    ws2.getCell(pr, 2).value = row.empId;
    ws2.getCell(pr, 3).value = row.name;
    ws2.getCell(pr, 4).value = row.role;
    ws2.getCell(pr, 5).value = row.status;
    ws2.getCell(pr, 6).value = row.workDays;
    ws2.getCell(pr, 7).value = row.salary;
    ws2.getCell(pr, 8).value = row.raisePercent;
    ws2.getCell(pr, 9).value = row.raiseAmount;
    ws2.getCell(pr, 10).value = row.salaryAfterRaise;
    ws2.getCell(pr, 11).value = row.vacationAllowance;
    ws2.getCell(pr, 12).value = row.penalties;
    ws2.getCell(pr, 13).value = row.officialNet;
    ws2.getCell(pr, 14).value = '...............................';

    styleCell(ws2.getCell(pr, 1), { bg, align: 'center' });
    styleCell(ws2.getCell(pr, 2), { bg, align: 'center' });
    styleCell(ws2.getCell(pr, 3), { bg, align: 'right', bold: true });
    styleCell(ws2.getCell(pr, 4), { bg, align: 'right' });
    styleCell(ws2.getCell(pr, 5), { bg, align: 'center' });
    styleCell(ws2.getCell(pr, 6), { bg, align: 'center' });
    styleCell(ws2.getCell(pr, 7), { bg, align: 'center', numFmt: '#,##0' });
    styleCell(ws2.getCell(pr, 8), { bg, align: 'center' });
    styleCell(ws2.getCell(pr, 9), { bg, align: 'center', numFmt: '#,##0' });
    styleCell(ws2.getCell(pr, 10), { bg, align: 'center', numFmt: '#,##0' });
    styleCell(ws2.getCell(pr, 11), { bg, align: 'center', numFmt: '#,##0' });
    styleCell(ws2.getCell(pr, 12), { bg, align: 'center', numFmt: '#,##0' });
    styleCell(ws2.getCell(pr, 13), { bg: PALETTE.farmLightGreen, align: 'center', numFmt: '#,##0 "ج.م"', bold: true, size: 11 });
    styleCell(ws2.getCell(pr, 14), { bg, align: 'center', color: 'FF94A3B8' });

    ws2.getRow(pr).height = 24;
    pr++;
  });

  // Payroll Total Row
  ws2.mergeCells(`A${pr}:L${pr}`);
  const totPayLabel = ws2.getCell(`A${pr}`);
  totPayLabel.value = 'إجمالي مسير الرواتب الرسمي المعتمد للمكتب (Total Official Payroll):';
  styleCell(totPayLabel, { bg: PALETTE.slateDark, color: PALETTE.white, bold: true, align: 'left', size: 11 });

  const totPayVal = ws2.getCell(`M${pr}`);
  totPayVal.value = totalOfficialPayroll;
  styleCell(totPayVal, { bg: PALETTE.slateDark, color: 'FF34D399', bold: true, align: 'center', numFmt: '#,##0 "ج.م"', size: 12, borderBottom: 'double' });

  ws2.getCell(`N${pr}`).value = 'معتمد';
  styleCell(ws2.getCell(`N${pr}`), { bg: PALETTE.slateDark, color: PALETTE.white, align: 'center', bold: true });
  ws2.getRow(pr).height = 28;

  // =============================================================
  // SHEET 3: المصروفات (Approved Operational Expenses)
  // =============================================================
  const ws3 = wb.addWorksheet('المصروفات');
  setupWorksheetRTL(ws3);

  ws3.columns = [
    { key: 'm1', width: 6 },   // م
    { key: 'm2', width: 14 },  // التاريخ
    { key: 'm3', width: 16 },  // السند
    { key: 'm4', width: 38 },  // البيان
    { key: 'm5', width: 22 },  // البند
    { key: 'm6', width: 22 },  // القطاع
    { key: 'm7', width: 20 },  // طريقة السداد
    { key: 'm8', width: 18 },  // المبلغ
    { key: 'm9', width: 25 },  // ملاحظات
  ];

  // Header Banner
  ws3.mergeCells('A1:I1');
  const t3 = ws3.getCell('A1');
  t3.value = `سجل المصروفات التشغيلية المعتمدة للمزرعة - شهر (${monthKey})`;
  styleCell(t3, { bg: PALETTE.farmDarkGreen, color: PALETTE.white, bold: true, size: 13 });
  ws3.getRow(1).height = 36;

  const expCols = ['م', 'التاريخ', 'رقم السند', 'البيان والشرح التفصيلي', 'التصنيف / البند', 'القطاع / القسم', 'طريقة السداد', 'المبلغ (ج.م)', 'ملاحظات / الفاتورة'];
  expCols.forEach((colName, idx) => {
    const c = ws3.getCell(2, idx + 1);
    c.value = colName;
    styleCell(c, { bg: PALETTE.slateHeader, color: PALETTE.white, bold: true, size: 10 });
  });
  ws3.getRow(2).height = 26;

  let er = 3;
  approvedExpenseEntries.forEach((e, idx) => {
    const isZebra = er % 2 === 0;
    const bg = isZebra ? PALETTE.slateLight : PALETTE.white;

    ws3.getCell(er, 1).value = idx + 1;
    ws3.getCell(er, 2).value = e.date;
    ws3.getCell(er, 3).value = e.voucherNo;
    ws3.getCell(er, 4).value = e.statement;
    ws3.getCell(er, 5).value = e.category;
    ws3.getCell(er, 6).value = e.sector;
    ws3.getCell(er, 7).value = e.paymentMethod;
    ws3.getCell(er, 8).value = e.amount;
    ws3.getCell(er, 9).value = e.notes || '-';

    styleCell(ws3.getCell(er, 1), { bg, align: 'center' });
    styleCell(ws3.getCell(er, 2), { bg, align: 'center' });
    styleCell(ws3.getCell(er, 3), { bg, align: 'center', bold: true });
    styleCell(ws3.getCell(er, 4), { bg, align: 'right' });
    styleCell(ws3.getCell(er, 5), { bg, align: 'right' });
    styleCell(ws3.getCell(er, 6), { bg, align: 'right' });
    styleCell(ws3.getCell(er, 7), { bg, align: 'center' });
    styleCell(ws3.getCell(er, 8), { bg, align: 'center', numFmt: '#,##0 "ج.م"', bold: true });
    styleCell(ws3.getCell(er, 9), { bg, align: 'right' });

    ws3.getRow(er).height = 24;
    er++;
  });

  // Official Mies Line in Expenses
  ws3.getCell(er, 1).value = approvedExpenseEntries.length + 1;
  ws3.getCell(er, 2).value = `${monthKey}-01`;
  ws3.getCell(er, 3).value = 'OFFICIAL-MIES';
  ws3.getCell(er, 4).value = `ميس المزرعة الرسمي المعتمد (${regularEmployees.length} أفراد × ${state.officialMiesPerPerson || 1000} ج.م)`;
  ws3.getCell(er, 5).value = 'ميس المزرعة الرسمي';
  ws3.getCell(er, 6).value = 'الإدارة والعمالة';
  ws3.getCell(er, 7).value = 'مخصص شهري معتمد';
  ws3.getCell(er, 8).value = officialMiesAllowance;
  ws3.getCell(er, 9).value = 'المخصص المعتمد من الشركة بدون تفاصيل فواتير';

  [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(cIdx => {
    styleCell(ws3.getCell(er, cIdx), { bg: 'FEF3C7', bold: true, align: cIdx === 4 ? 'right' : 'center' });
  });
  ws3.getCell(er, 8).numFmt = '#,##0 "ج.م"';
  ws3.getRow(er).height = 26;
  er++;

  // Expenses Total Row
  ws3.mergeCells(`A${er}:G${er}`);
  const totExpL = ws3.getCell(`A${er}`);
  totExpL.value = 'إجمالي المصروفات المعتمدة شاملة الميس الرسمي (Total):';
  styleCell(totExpL, { bg: PALETTE.slateDark, color: PALETTE.white, bold: true, align: 'left', size: 11 });

  const totExpV = ws3.getCell(`H${er}`);
  totExpV.value = totalOfficialExpenses;
  styleCell(totExpV, { bg: PALETTE.slateDark, color: 'FFF87171', bold: true, align: 'center', numFmt: '#,##0 "ج.م"', size: 12, borderBottom: 'double' });

  ws3.getCell(`I${er}`).value = 'شامل الميس';
  styleCell(ws3.getCell(`I${er}`), { bg: PALETTE.slateDark, color: PALETTE.white, align: 'center', bold: true });
  ws3.getRow(er).height = 28;

  // =============================================================
  // SHEET 4: المبيعات (Cash Sales)
  // =============================================================
  const ws4 = wb.addWorksheet('المبيعات');
  setupWorksheetRTL(ws4);

  ws4.columns = [
    { key: 's1', width: 6 },   // م
    { key: 's2', width: 14 },  // التاريخ
    { key: 's3', width: 16 },  // رقم السند
    { key: 's4', width: 35 },  // البيان
    { key: 's5', width: 16 },  // الكمية
    { key: 's6', width: 16 },  // سعر الوحدة
    { key: 's7', width: 20 },  // القيمة الإجمالية
    { key: 's8', width: 25 },  // ملاحظات
  ];

  // Header Banner
  ws4.mergeCells('A1:H1');
  const t4 = ws4.getCell('A1');
  t4.value = `سجل المبيعات النقدية بالمزرعة (مستبعدات وبيض وشكاير) - شهر (${monthKey})`;
  styleCell(t4, { bg: PALETTE.farmDarkGreen, color: PALETTE.white, bold: true, size: 13 });
  ws4.getRow(1).height = 36;

  const salesCols = ['م', 'التاريخ', 'رقم السند', 'البيان (الصنف المباع)', 'العدد / الكمية', 'سعر الوحدة (ج.م)', 'القيمة الإجمالية (ج.م)', 'ملاحظات / العميل'];
  salesCols.forEach((colName, idx) => {
    const c = ws4.getCell(2, idx + 1);
    c.value = colName;
    styleCell(c, { bg: PALETTE.slateHeader, color: PALETTE.white, bold: true, size: 10 });
  });
  ws4.getRow(2).height = 26;

  let sr = 3;
  if (cashSalesEntries.length === 0) {
    ws4.mergeCells('A3:H3');
    const emptyRow = ws4.getCell('A3');
    emptyRow.value = 'لا توجد مبيعات نقدية مسجلة لهذا الشهر';
    styleCell(emptyRow, { align: 'center', color: 'FF64748B', size: 11 });
    ws4.getRow(3).height = 30;
    sr = 4;
  } else {
    cashSalesEntries.forEach((sale, idx) => {
      const isZebra = sr % 2 === 0;
      const bg = isZebra ? PALETTE.slateLight : PALETTE.white;

      ws4.getCell(sr, 1).value = idx + 1;
      ws4.getCell(sr, 2).value = sale.date;
      ws4.getCell(sr, 3).value = sale.voucherNo;
      ws4.getCell(sr, 4).value = sale.statement;
      ws4.getCell(sr, 5).value = sale.quantity || 1;
      ws4.getCell(sr, 6).value = sale.unitPrice || (sale.quantity ? Math.round(sale.amount / sale.quantity) : sale.amount);
      ws4.getCell(sr, 7).value = sale.amount;
      ws4.getCell(sr, 8).value = sale.notes || 'مبيعات نقدية';

      styleCell(ws4.getCell(sr, 1), { bg, align: 'center' });
      styleCell(ws4.getCell(sr, 2), { bg, align: 'center' });
      styleCell(ws4.getCell(sr, 3), { bg, align: 'center', bold: true });
      styleCell(ws4.getCell(sr, 4), { bg, align: 'right', bold: true });
      styleCell(ws4.getCell(sr, 5), { bg, align: 'center', numFmt: '#,##0' });
      styleCell(ws4.getCell(sr, 6), { bg, align: 'center', numFmt: '#,##0.00' });
      styleCell(ws4.getCell(sr, 7), { bg: PALETTE.farmLightGreen, align: 'center', numFmt: '#,##0 "ج.م"', bold: true });
      styleCell(ws4.getCell(sr, 8), { bg, align: 'right' });

      ws4.getRow(sr).height = 24;
      sr++;
    });
  }

  // Sales Total Row
  ws4.mergeCells(`A${sr}:F${sr}`);
  const totSalesL = ws4.getCell(`A${sr}`);
  totSalesL.value = 'إجمالي المبيعات النقدية الموردة للعهدة (Total Sales):';
  styleCell(totSalesL, { bg: PALETTE.slateDark, color: PALETTE.white, bold: true, align: 'left', size: 11 });

  const totSalesV = ws4.getCell(`G${sr}`);
  totSalesV.value = totalCashSales;
  styleCell(totSalesV, { bg: PALETTE.slateDark, color: 'FF34D399', bold: true, align: 'center', numFmt: '#,##0 "ج.م"', size: 12, borderBottom: 'double' });

  ws4.getCell(`H${sr}`).value = 'نقداً بالخزينة';
  styleCell(ws4.getCell(`H${sr}`), { bg: PALETTE.slateDark, color: PALETTE.white, align: 'center', bold: true });
  ws4.getRow(sr).height = 28;

  // =============================================================
  // SHEET 5: جرد العلف والأدوية (Inventory Balance Sheet)
  // =============================================================
  const ws5 = wb.addWorksheet('جرد العلف والأدوية');
  setupWorksheetRTL(ws5);

  ws5.columns = [
    { key: 'i1', width: 6 },   // م
    { key: 'i2', width: 14 },  // التاريخ
    { key: 'i3', width: 34 },  // اسم الصنف
    { key: 'i4', width: 12 },  // الوحدة
    { key: 'i5', width: 16 },  // رصيد سابق
    { key: 'i6', width: 18 },  // الوارد
    { key: 'i7', width: 18 },  // المستهلك
    { key: 'i8', width: 20 },  // الرصيد المتبقي
  ];

  // Header Banner
  ws5.mergeCells('A1:H1');
  const t5 = ws5.getCell('A1');
  t5.value = `تقرير ميزان حركة وجرد العلف والأدوية البيطرية بالمزرعة - شهر (${monthKey})`;
  styleCell(t5, { bg: PALETTE.farmDarkGreen, color: PALETTE.white, bold: true, size: 13 });
  ws5.getRow(1).height = 36;

  let ir = 3;

  // 1. Feed Section
  ws5.mergeCells(`A${ir}:H${ir}`);
  const secFeed = ws5.getCell(`A${ir}`);
  secFeed.value = '=== أولاً: حركة وجرد العلف الشهري (إناث وديوك) ===';
  styleCell(secFeed, { bg: PALETTE.farmTeal, color: PALETTE.white, bold: true, size: 11, align: 'right' });
  ws5.getRow(ir).height = 26;
  ir++;

  const invCols = ['م', 'التاريخ', 'اسم ونوع العلف / الصنف', 'الوحدة', 'رصيد سابق', 'الوارد خلال الشهر', 'المستهلك الفعلي', 'الرصيد المتبقي المرحل'];
  invCols.forEach((colName, idx) => {
    const c = ws5.getCell(ir, idx + 1);
    c.value = colName;
    styleCell(c, { bg: 'FFE2E8F0', bold: true, color: PALETTE.textDark });
  });
  ws5.getRow(ir).height = 24;
  ir++;

  const inventoryMonth = state.inventory.filter(i => i.monthKey === monthKey);
  const feedItems = inventoryMonth.filter(i => i.category === 'علف');
  const medicineItems = inventoryMonth.filter(i => i.category === 'أدوية');

  if (feedItems.length === 0) {
    ws5.mergeCells(`A${ir}:H${ir}`);
    const emptyFeed = ws5.getCell(`A${ir}`);
    emptyFeed.value = 'لا توجد حركات علف مسجلة لهذا الشهر';
    styleCell(emptyFeed, { align: 'center', color: 'FF64748B' });
    ws5.getRow(ir).height = 26;
    ir++;
  } else {
    feedItems.forEach((f, idx) => {
      ws5.getCell(ir, 1).value = idx + 1;
      ws5.getCell(ir, 2).value = f.date || `${monthKey}-01`;
      ws5.getCell(ir, 3).value = f.name;
      ws5.getCell(ir, 4).value = f.unit || 'طن';
      ws5.getCell(ir, 5).value = f.openingBalance;
      ws5.getCell(ir, 6).value = f.received;
      ws5.getCell(ir, 7).value = f.consumed;
      ws5.getCell(ir, 8).value = f.closingBalance;

      [1, 2, 3, 4, 5, 6, 7, 8].forEach(cIdx => {
        styleCell(ws5.getCell(ir, cIdx), {
          align: cIdx === 3 ? 'right' : 'center',
          bold: cIdx === 3 || cIdx === 8,
          bg: cIdx === 8 ? PALETTE.farmLightGreen : PALETTE.white,
          numFmt: cIdx >= 5 ? '#,##0.00' : undefined
        });
      });
      ws5.getRow(ir).height = 24;
      ir++;
    });
  }

  ir++;

  // 2. Medicine Section
  ws5.mergeCells(`A${ir}:H${ir}`);
  const secMed = ws5.getCell(`A${ir}`);
  secMed.value = '=== ثانياً: حركة وجرد الأدوية البيطرية واللقاحات والمطهرات ===';
  styleCell(secMed, { bg: PALETTE.farmTeal, color: PALETTE.white, bold: true, size: 11, align: 'right' });
  ws5.getRow(ir).height = 26;
  ir++;

  const medCols = ['م', 'التاريخ', 'اسم الدواء / اللقاح / المطهر', 'الوحدة', 'رصيد سابق', 'الوارد خلال الشهر', 'المنصرف / المستهلك', 'الرصيد المتبقي المرحل'];
  medCols.forEach((colName, idx) => {
    const c = ws5.getCell(ir, idx + 1);
    c.value = colName;
    styleCell(c, { bg: 'FFE2E8F0', bold: true, color: PALETTE.textDark });
  });
  ws5.getRow(ir).height = 24;
  ir++;

  if (medicineItems.length === 0) {
    ws5.mergeCells(`A${ir}:H${ir}`);
    const emptyMed = ws5.getCell(`A${ir}`);
    emptyMed.value = 'لا توجد حركات أدوية مسجلة لهذا الشهر';
    styleCell(emptyMed, { align: 'center', color: 'FF64748B' });
    ws5.getRow(ir).height = 26;
    ir++;
  } else {
    medicineItems.forEach((m, idx) => {
      ws5.getCell(ir, 1).value = idx + 1;
      ws5.getCell(ir, 2).value = m.date || `${monthKey}-01`;
      ws5.getCell(ir, 3).value = m.name;
      ws5.getCell(ir, 4).value = m.unit || 'عبوة';
      ws5.getCell(ir, 5).value = m.openingBalance;
      ws5.getCell(ir, 6).value = m.received;
      ws5.getCell(ir, 7).value = m.consumed;
      ws5.getCell(ir, 8).value = m.closingBalance;

      [1, 2, 3, 4, 5, 6, 7, 8].forEach(cIdx => {
        styleCell(ws5.getCell(ir, cIdx), {
          align: cIdx === 3 ? 'right' : 'center',
          bold: cIdx === 3 || cIdx === 8,
          bg: cIdx === 8 ? PALETTE.farmLightGreen : PALETTE.white,
          numFmt: cIdx >= 5 ? '#,##0.00' : undefined
        });
      });
      ws5.getRow(ir).height = 24;
      ir++;
    });
  }

  // Trigger styled download in browser
  await downloadWorkbook(wb, `تقرير_تصفية_العهدة_للمكتب_الرئيسي_${monthKey}.xlsx`);
}

/**
 * -------------------------------------------------------------
 * 2. STANDALONE MESS EXPENSES EXCEL EXPORT (كشف مصروفات الميس الفعلي)
 * -------------------------------------------------------------
 */
export async function exportMessExpensesExcel(
  monthKey: string,
  messEntries: JournalEntry[],
  regularEmployeesCount: number,
  officialMiesPerPerson: number
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'نظام الإدارة المالية لمزرعة الدواجن';
  const ws = wb.addWorksheet('مصروفات الميس الفعلي');
  setupWorksheetRTL(ws);

  ws.columns = [
    { key: 'c1', width: 6 },   // م
    { key: 'c2', width: 14 },  // التاريخ
    { key: 'c3', width: 16 },  // السند
    { key: 'c4', width: 38 },  // البيان
    { key: 'c5', width: 16 },  // الكمية
    { key: 'c6', width: 16 },  // سعر الوحدة
    { key: 'c7', width: 22 },  // القيمة الإجمالية
    { key: 'c8', width: 28 },  // القائم بالشراء / ملاحظات
  ];

  // Header Banner
  ws.mergeCells('A1:H1');
  const t = ws.getCell('A1');
  t.value = `كشف تحليلي بمصروفات الميس الفعلي وإعاشة العاملين - مزرعة الزريقي (شهر ${monthKey})`;
  styleCell(t, { bg: 'FF881337', color: PALETTE.white, bold: true, size: 13 });
  ws.getRow(1).height = 36;

  // Regulatory notice
  ws.mergeCells('A2:H2');
  const notice = ws.getCell('A2');
  notice.value = '⚠️ كشف داخلي رقابي لإدارة المزرعة وشئون العاملين لحساب فرق الميس الفعلي - لا يذهب للمكتب الرئيسي';
  styleCell(notice, { bg: 'FFFFF1F2', color: 'FF9F1239', bold: true, size: 10 });
  ws.getRow(2).height = 22;

  // Table Columns
  const cols = ['م', 'التاريخ', 'رقم السند', 'البيان وتفاصيل المشتروات', 'العدد / الكمية', 'سعر الوحدة (ج.م)', 'القيمة الإجمالية (ج.م)', 'القائم بالشراء / ملاحظات'];
  cols.forEach((colName, idx) => {
    const c = ws.getCell(3, idx + 1);
    c.value = colName;
    styleCell(c, { bg: PALETTE.slateHeader, color: PALETTE.white, bold: true, size: 10 });
  });
  ws.getRow(3).height = 26;

  let r = 4;
  const totalSpent = messEntries.reduce((sum, e) => sum + e.amount, 0);
  const officialBudget = regularEmployeesCount * (officialMiesPerPerson || 1000);
  const diff = totalSpent - officialBudget;

  if (messEntries.length === 0) {
    ws.mergeCells('A4:H4');
    const empty = ws.getCell('A4');
    empty.value = 'لا توجد مصروفات ميس مسجلة لهذا الشهر';
    styleCell(empty, { align: 'center', color: 'FF64748B' });
    ws.getRow(4).height = 30;
    r = 5;
  } else {
    messEntries.forEach((e, idx) => {
      const isZebra = r % 2 === 0;
      const bg = isZebra ? PALETTE.slateLight : PALETTE.white;

      ws.getCell(r, 1).value = idx + 1;
      ws.getCell(r, 2).value = e.date;
      ws.getCell(r, 3).value = e.voucherNo;
      ws.getCell(r, 4).value = e.statement;
      ws.getCell(r, 5).value = (e.quantity && e.quantity > 0) ? e.quantity : '-';
      ws.getCell(r, 6).value = (e.unitPrice && e.unitPrice > 0) ? e.unitPrice : ((e.quantity && e.quantity > 0) ? Math.round(e.amount / e.quantity) : '-');
      ws.getCell(r, 7).value = e.amount;
      ws.getCell(r, 8).value = e.notes || e.employeeName || e.custodian || '-';

      styleCell(ws.getCell(r, 1), { bg, align: 'center' });
      styleCell(ws.getCell(r, 2), { bg, align: 'center' });
      styleCell(ws.getCell(r, 3), { bg, align: 'center', bold: true });
      styleCell(ws.getCell(r, 4), { bg, align: 'right', bold: true });
      styleCell(ws.getCell(r, 5), { bg, align: 'center' });
      styleCell(ws.getCell(r, 6), { bg, align: 'center' });
      styleCell(ws.getCell(r, 7), { bg: 'FFFFF1F2', align: 'center', numFmt: '#,##0 "ج.م"', bold: true });
      styleCell(ws.getCell(r, 8), { bg, align: 'right' });

      ws.getRow(r).height = 24;
      r++;
    });
  }

  // Summary Totals at bottom
  // 1. Total Actual Spent
  ws.mergeCells(`A${r}:F${r}`);
  const t1 = ws.getCell(`A${r}`);
  t1.value = '1. إجمالي المنصرف الفعلي على الميس (Total Actual Mess Expenses):';
  styleCell(t1, { bg: PALETTE.slateDark, color: PALETTE.white, bold: true, align: 'left' });
  const v1 = ws.getCell(`G${r}`);
  v1.value = totalSpent;
  styleCell(v1, { bg: PALETTE.slateDark, color: 'FFF87171', bold: true, align: 'center', numFmt: '#,##0 "ج.م"', size: 12 });
  ws.getCell(`H${r}`).value = 'المصروف الفعلي';
  styleCell(ws.getCell(`H${r}`), { bg: PALETTE.slateDark, color: PALETTE.white, align: 'center' });
  ws.getRow(r).height = 26;
  r++;

  // 2. Official Allowance
  ws.mergeCells(`A${r}:F${r}`);
  const t2 = ws.getCell(`A${r}`);
  t2.value = `2. الميس الرسمي المعتمد من الشركة (${regularEmployeesCount} أفراد × ${officialMiesPerPerson || 1000} ج.م):`;
  styleCell(t2, { bg: 'FF064E3B', color: PALETTE.white, bold: true, align: 'left' });
  const v2 = ws.getCell(`G${r}`);
  v2.value = officialBudget;
  styleCell(v2, { bg: 'FF064E3B', color: 'FF34D399', bold: true, align: 'center', numFmt: '#,##0 "ج.م"', size: 12 });
  ws.getCell(`H${r}`).value = 'مخصص الشركة';
  styleCell(ws.getCell(`H${r}`), { bg: 'FF064E3B', color: PALETTE.white, align: 'center' });
  ws.getRow(r).height = 26;
  r++;

  // 3. Difference (Deficit or Surplus)
  const isDeficit = diff > 0;
  ws.mergeCells(`A${r}:F${r}`);
  const t3 = ws.getCell(`A${r}`);
  t3.value = isDeficit 
    ? `3. عجز الميس الفعلي (يخصم على العاملين بواقع ${regularEmployeesCount > 0 ? Math.round(diff / regularEmployeesCount) : 0} ج.م/فرد بالمسير الداخلي):`
    : '3. وفر مالي في ميزانية الميس (ضمن حدود المخصص المعتمد):';
  styleCell(t3, { bg: isDeficit ? PALETTE.deficitAmberBg : PALETTE.surplusGreenBg, color: isDeficit ? PALETTE.deficitAmberText : PALETTE.surplusGreenText, bold: true, align: 'left' });
  const v3 = ws.getCell(`G${r}`);
  v3.value = Math.abs(diff);
  styleCell(v3, { 
    bg: isDeficit ? PALETTE.deficitAmberBg : PALETTE.surplusGreenBg, 
    color: isDeficit ? PALETTE.deficitAmberText : PALETTE.surplusGreenText, 
    bold: true, 
    align: 'center', 
    numFmt: '#,##0 "ج.م"', 
    size: 13,
    borderBottom: 'double'
  });
  ws.getCell(`H${r}`).value = isDeficit ? 'عجز يتحمله العمال' : 'وفر للمزرعة';
  styleCell(ws.getCell(`H${r}`), { bg: isDeficit ? PALETTE.deficitAmberBg : PALETTE.surplusGreenBg, color: isDeficit ? PALETTE.deficitAmberText : PALETTE.surplusGreenText, align: 'center', bold: true });
  ws.getRow(r).height = 28;

  await downloadWorkbook(wb, `كشف_مصروفات_الميس_الفعلي_${monthKey}.xlsx`);
}

/**
 * -------------------------------------------------------------
 * 3. FULL INTERNAL FARM BACKUP EXCEL REPORT (أرشيف المزرعة الداخلي الشامل)
 * -------------------------------------------------------------
 */
export async function exportFullFarmBackupExcel(state: AppState): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'نظام الإدارة المالية لمزرعة الدواجن';
  const monthKey = state.currentMonth;
  const monthEntries = state.journalEntries.filter(e => e.monthKey === monthKey);
  const regularEmployees = state.employees.filter(e => e.status === 'منتظم' || e.status === 'نشط');

  // Sheet 1: اليومية العامة الكاملة
  const ws1 = wb.addWorksheet('اليومية العامة');
  setupWorksheetRTL(ws1);
  ws1.columns = [
    { key: 'j1', width: 6 },
    { key: 'j2', width: 14 },
    { key: 'j3', width: 16 },
    { key: 'j4', width: 14 },
    { key: 'j5', width: 22 },
    { key: 'j6', width: 22 },
    { key: 'j7', width: 18 },
    { key: 'j8', width: 38 },
    { key: 'j9', width: 20 },
    { key: 'j10', width: 18 },
    { key: 'j11', width: 25 },
  ];

  ws1.mergeCells('A1:K1');
  const t1 = ws1.getCell('A1');
  t1.value = `الأرشيف الداخلي الشامل - قيود اليومية العامة الكاملة للمزرعة (${monthKey})`;
  styleCell(t1, { bg: PALETTE.farmDarkGreen, color: PALETTE.white, bold: true, size: 13 });
  ws1.getRow(1).height = 36;

  const jCols = ['م', 'التاريخ', 'رقم السند', 'نوع الحركة', 'التصنيف / البند', 'القطاع', 'المبلغ (ج.م)', 'البيان والشرح', 'طريقة الدفع', 'أمين العهدة', 'ملاحظات'];
  jCols.forEach((colName, idx) => {
    const c = ws1.getCell(2, idx + 1);
    c.value = colName;
    styleCell(c, { bg: PALETTE.slateHeader, color: PALETTE.white, bold: true, size: 10 });
  });
  ws1.getRow(2).height = 26;

  let jr = 3;
  monthEntries.forEach((e, idx) => {
    const isZebra = jr % 2 === 0;
    const bg = isZebra ? PALETTE.slateLight : PALETTE.white;

    ws1.getCell(jr, 1).value = idx + 1;
    ws1.getCell(jr, 2).value = e.date;
    ws1.getCell(jr, 3).value = e.voucherNo;
    ws1.getCell(jr, 4).value = e.type;
    ws1.getCell(jr, 5).value = e.category;
    ws1.getCell(jr, 6).value = e.sector;
    ws1.getCell(jr, 7).value = e.amount;
    ws1.getCell(jr, 8).value = e.statement;
    ws1.getCell(jr, 9).value = e.paymentMethod;
    ws1.getCell(jr, 10).value = e.custodian || '-';
    ws1.getCell(jr, 11).value = e.notes || '-';

    styleCell(ws1.getCell(jr, 1), { bg, align: 'center' });
    styleCell(ws1.getCell(jr, 2), { bg, align: 'center' });
    styleCell(ws1.getCell(jr, 3), { bg, align: 'center', bold: true });
    styleCell(ws1.getCell(jr, 4), { bg, align: 'center' });
    styleCell(ws1.getCell(jr, 5), { bg, align: 'right' });
    styleCell(ws1.getCell(jr, 6), { bg, align: 'right' });
    styleCell(ws1.getCell(jr, 7), { bg, align: 'center', numFmt: '#,##0 "ج.م"', bold: true });
    styleCell(ws1.getCell(jr, 8), { bg, align: 'right' });
    styleCell(ws1.getCell(jr, 9), { bg, align: 'center' });
    styleCell(ws1.getCell(jr, 10), { bg, align: 'right' });
    styleCell(ws1.getCell(jr, 11), { bg, align: 'right' });

    ws1.getRow(jr).height = 24;
    jr++;
  });

  // Sheet 2: مسير الرواتب الداخلي (Internal Payroll)
  const ws2 = wb.addWorksheet('مسير الرواتب الداخلي');
  setupWorksheetRTL(ws2);
  ws2.columns = [
    { key: 'p1', width: 6 },
    { key: 'p2', width: 28 },
    { key: 'p3', width: 18 },
    { key: 'p4', width: 18 },
    { key: 'p5', width: 16 },
    { key: 'p6', width: 18 },
    { key: 'p7', width: 16 },
    { key: 'p8', width: 20 },
    { key: 'p9', width: 24 },
  ];

  ws2.mergeCells('A1:I1');
  const t2 = ws2.getCell('A1');
  t2.value = `مسير الرواتب الداخلي للمزرعة وتصفية مستحقات العمال (شهر ${monthKey})`;
  styleCell(t2, { bg: PALETTE.farmDarkGreen, color: PALETTE.white, bold: true, size: 13 });
  ws2.getRow(1).height = 36;

  const intCols = ['م', 'اسم الموظف', 'الوظيفة', 'الراتب المعتمد الرسمي', 'السلف النقدية', 'مشتروات بيض بالآجل', 'خصم فارق الميس', 'الصافي المقبوض باليد', 'توقيع أو بصمة الاستلام'];
  intCols.forEach((colName, idx) => {
    const c = ws2.getCell(2, idx + 1);
    c.value = colName;
    styleCell(c, { bg: PALETTE.slateHeader, color: PALETTE.white, bold: true, size: 10 });
  });
  ws2.getRow(2).height = 26;

  let ir = 3;
  let totHandover = 0;
  regularEmployees.forEach((emp, idx) => {
    const workDays = emp.workDays !== undefined ? emp.workDays : 30;
    const raiseAmount = Math.floor(emp.salary * ((emp.raisePercentage || 0) / 100));
    const salaryAfterRaise = emp.salary + raiseAmount;
    const isWorker = emp.role.includes('عامل');
    const vacationAllowance = emp.vacationAllowanceOverride !== undefined 
      ? emp.vacationAllowanceOverride 
      : (isWorker ? Math.floor(Math.floor(workDays / 7) * (salaryAfterRaise / 30) / 5) * 5 : 0);
    const penalties = emp.penalties || 0;
    const officialNet = Math.round((salaryAfterRaise + vacationAllowance - penalties) / 5) * 5;

    const advancesMonth = monthEntries
      .filter(e => (e.employeeId === emp.id || e.employeeName === emp.name) && (e.category.includes('سلف') || e.debitAccount === 'سلف عاملين'))
      .reduce((sum, e) => sum + e.amount, 0);

    const purchasesMonth = monthEntries
      .filter(e => (e.employeeId === emp.id || e.employeeName === emp.name) && (e.paymentMethod.includes('آجل') || e.debitAccount.includes('مشتروات') || (e.type === 'مبيعات' && e.employeeId)))
      .reduce((sum, e) => sum + e.amount, 0);

    const miesDeduction = emp.miesDeduction || 0;
    const handoverNet = Math.max(0, officialNet - advancesMonth - purchasesMonth - miesDeduction);
    totHandover += handoverNet;

    const isZebra = ir % 2 === 0;
    const bg = isZebra ? PALETTE.slateLight : PALETTE.white;

    ws2.getCell(ir, 1).value = idx + 1;
    ws2.getCell(ir, 2).value = emp.name;
    ws2.getCell(ir, 3).value = emp.role;
    ws2.getCell(ir, 4).value = officialNet;
    ws2.getCell(ir, 5).value = advancesMonth > 0 ? -advancesMonth : 0;
    ws2.getCell(ir, 6).value = purchasesMonth > 0 ? -purchasesMonth : 0;
    ws2.getCell(ir, 7).value = miesDeduction > 0 ? -miesDeduction : 0;
    ws2.getCell(ir, 8).value = handoverNet;
    ws2.getCell(ir, 9).value = '...............................';

    styleCell(ws2.getCell(ir, 1), { bg, align: 'center' });
    styleCell(ws2.getCell(ir, 2), { bg, align: 'right', bold: true });
    styleCell(ws2.getCell(ir, 3), { bg, align: 'right' });
    styleCell(ws2.getCell(ir, 4), { bg, align: 'center', numFmt: '#,##0' });
    styleCell(ws2.getCell(ir, 5), { bg, align: 'center', numFmt: '#,##0', color: 'FFDC2626' });
    styleCell(ws2.getCell(ir, 6), { bg, align: 'center', numFmt: '#,##0', color: 'FF2563EB' });
    styleCell(ws2.getCell(ir, 7), { bg, align: 'center', numFmt: '#,##0', color: 'FFD97706' });
    styleCell(ws2.getCell(ir, 8), { bg: PALETTE.farmLightGreen, align: 'center', numFmt: '#,##0 "ج.م"', bold: true, size: 11 });
    styleCell(ws2.getCell(ir, 9), { bg, align: 'center', color: 'FF94A3B8' });

    ws2.getRow(ir).height = 24;
    ir++;
  });

  // Internal Total Row
  ws2.mergeCells(`A${ir}:G${ir}`);
  const totIntL = ws2.getCell(`A${ir}`);
  totIntL.value = 'إجمالي النقدية الصافية المصروفة باليد للعمال (Total Cash Handover):';
  styleCell(totIntL, { bg: PALETTE.slateDark, color: PALETTE.white, bold: true, align: 'left', size: 11 });

  const totIntV = ws2.getCell(`H${ir}`);
  totIntV.value = totHandover;
  styleCell(totIntV, { bg: PALETTE.slateDark, color: 'FF34D399', bold: true, align: 'center', numFmt: '#,##0 "ج.م"', size: 12, borderBottom: 'double' });

  ws2.getCell(`I${ir}`).value = 'جاهز للتوقيع';
  styleCell(ws2.getCell(`I${ir}`), { bg: PALETTE.slateDark, color: PALETTE.white, align: 'center', bold: true });
  ws2.getRow(ir).height = 28;

  // Sheet 3: قاعدة بيانات العاملين
  const ws3 = wb.addWorksheet('سجل الموظفين الأساسي');
  setupWorksheetRTL(ws3);
  ws3.columns = [
    { key: 'e1', width: 12 },
    { key: 'e2', width: 28 },
    { key: 'e3', width: 18 },
    { key: 'e4', width: 16 },
    { key: 'e5', width: 20 },
    { key: 'e6', width: 16 },
    { key: 'e7', width: 14 },
    { key: 'e8', width: 16 },
    { key: 'e9', width: 25 },
  ];

  ws3.mergeCells('A1:I1');
  const t3 = ws3.getCell('A1');
  t3.value = 'قاعدة بيانات وسجل العاملين بالمزرعة';
  styleCell(t3, { bg: PALETTE.farmDarkGreen, color: PALETTE.white, bold: true, size: 13 });
  ws3.getRow(1).height = 36;

  const empCols = ['كود الموظف', 'الاسم الكامل', 'المسمى الوظيفي', 'رقم الهاتف', 'الرقم القومي', 'الراتب الأساسي', 'الحالة', 'تاريخ التعيين', 'ملاحظات'];
  empCols.forEach((colName, idx) => {
    const c = ws3.getCell(2, idx + 1);
    c.value = colName;
    styleCell(c, { bg: PALETTE.slateHeader, color: PALETTE.white, bold: true, size: 10 });
  });
  ws3.getRow(2).height = 26;

  let er = 3;
  state.employees.forEach(emp => {
    const isZebra = er % 2 === 0;
    const bg = isZebra ? PALETTE.slateLight : PALETTE.white;

    ws3.getCell(er, 1).value = emp.id;
    ws3.getCell(er, 2).value = emp.name;
    ws3.getCell(er, 3).value = emp.role;
    ws3.getCell(er, 4).value = emp.phone;
    ws3.getCell(er, 5).value = emp.nationalId || '-';
    ws3.getCell(er, 6).value = emp.salary;
    ws3.getCell(er, 7).value = emp.status;
    ws3.getCell(er, 8).value = emp.hireDate || '-';
    ws3.getCell(er, 9).value = emp.notes || '-';

    styleCell(ws3.getCell(er, 1), { bg, align: 'center' });
    styleCell(ws3.getCell(er, 2), { bg, align: 'right', bold: true });
    styleCell(ws3.getCell(er, 3), { bg, align: 'right' });
    styleCell(ws3.getCell(er, 4), { bg, align: 'center' });
    styleCell(ws3.getCell(er, 5), { bg, align: 'center' });
    styleCell(ws3.getCell(er, 6), { bg, align: 'center', numFmt: '#,##0 "ج.م"' });
    styleCell(ws3.getCell(er, 7), { bg, align: 'center' });
    styleCell(ws3.getCell(er, 8), { bg, align: 'center' });
    styleCell(ws3.getCell(er, 9), { bg, align: 'right' });

    ws3.getRow(er).height = 24;
    er++;
  });

  await downloadWorkbook(wb, `أرشيف_المزرعة_الداخلي_الشامل_${monthKey}.xlsx`);
}

/**
 * Standard Export Wrapper (Defaults to the 5 Official Head Office Sheets)
 */
export async function exportFarmToExcel(
  monthKey: string,
  employees: Employee[],
  entries: JournalEntry[],
  dropdowns: DropdownOption[],
  settlement?: MonthlySettlement
): Promise<void> {
  const mockState: AppState = {
    currentMonth: monthKey,
    employees,
    dropdowns,
    journalEntries: entries,
    salesEntries: [],
    settlements: settlement ? { [monthKey]: settlement } : {},
    inventory: [],
    officialMiesPerPerson: 1000,
    viewMode: 'desktop',
    activeTab: 'settlement'
  };

  await exportOfficialOfficeExcel(mockState);
}

/**
 * Import and parse user uploaded Excel file (.xlsx / .xls / .csv)
 */
export async function parseExcelUpload(file: File): Promise<{
  employees: Employee[];
  journalEntries: JournalEntry[];
  dropdowns: DropdownOption[];
  sheetNames: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetNames = workbook.SheetNames;

        const importedEmployees: Employee[] = [];
        const importedEntries: JournalEntry[] = [];
        const importedDropdowns: DropdownOption[] = [];

        sheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          const lowerSheet = sheetName.toLowerCase();

          // Employees
          if (lowerSheet.includes('موظف') || lowerSheet.includes('employee') || lowerSheet.includes('سجل') || lowerSheet.includes('المرتبات')) {
            json.forEach((row, idx) => {
              const name = row['الاسم الكامل'] || row['اسم الموظف'] || row['الاسم'] || row['Name'];
              if (name && String(name).trim() !== '') {
                importedEmployees.push({
                  id: String(row['كود الموظف'] || row['الكود'] || `EMP-IMP-${idx + 1}`),
                  name: String(name).trim(),
                  role: String(row['المسمى الوظيفي'] || row['الوظيفة'] || row['Role'] || 'عامل'),
                  phone: String(row['رقم الهاتف'] || row['الهاتف'] || row['Phone'] || ''),
                  nationalId: String(row['الرقم القومي'] || row['NationalId'] || ''),
                  salary: Number(row['الراتب الأساسي'] || row['الراتب'] || row['Salary'] || 0),
                  status: (row['الحالة'] === 'إجازة' || row['الحالة'] === 'ترك العمل') ? row['الحالة'] : 'منتظم',
                  notes: String(row['ملاحظات'] || '')
                });
              }
            });
          }

          // Daily Journal
          if (lowerSheet.includes('يومية') || lowerSheet.includes('مصاريف') || lowerSheet.includes('journal') || lowerSheet.includes('المصروفات')) {
            json.forEach((row, idx) => {
              const amount = Number(row['المبلغ'] || row['Amount'] || row['مصروف'] || 0);
              const dateVal = row['التاريخ'] || row['Date'] || new Date().toISOString().split('T')[0];
              const dateStr = String(dateVal).substring(0, 10);
              const monthKey = dateStr.length >= 7 ? dateStr.substring(0, 7) : '2026-07';

              if (amount > 0 || row['نوع الحركة'] || row['البيان']) {
                importedEntries.push({
                  id: `JRN-IMP-${Date.now()}-${idx}`,
                  date: dateStr,
                  voucherNo: String(row['رقم السند'] || row['السند'] || `V-IMP-${idx + 1}`),
                  category: String(row['البند / الفئة'] || row['البند'] || row['الفئة'] || 'مصاريف عامة'),
                  sector: String(row['القطاع / قسم المزرعة'] || row['القطاع'] || 'قسم عام'),
                  amount: Math.abs(amount),
                  type: String(row['نوع الحركة'] || 'مصروف') as any,
                  paymentMethod: String(row['طريقة الدفع'] || 'نقداً من العهدة النقدية'),
                  debitAccount: String(row['الحساب المدين'] || 'المصروفات'),
                  creditAccount: String(row['الحساب الدائن'] || 'العهدة'),
                  custodian: String(row['أمين العهدة'] || 'عهدة المزرعة'),
                  employeeName: row['الموظف المستلم'] || row['الموظف'] || '',
                  statement: String(row['البيان / الشرح التفصيلي'] || row['البيان'] || row['الشرح'] || 'مصروف مزرعة'),
                  notes: String(row['ملاحظات / الفاتورة'] || row['ملاحظات'] || ''),
                  monthKey,
                  createdAt: new Date().toISOString(),
                  isInternal: Boolean(row['داخلي'] || false)
                });
              }
            });
          }

          // Dropdowns
          if (lowerSheet.includes('قوائم') || lowerSheet.includes('منسدلة') || lowerSheet.includes('إعدادات')) {
            json.forEach((row, idx) => {
              const name = row['الاسم / المسمى'] || row['الاسم'] || row['Name'];
              if (name && String(name).trim()) {
                const typeVal = row['النوع'];
                let type: DropdownOption['type'] = 'category';
                if (typeVal?.includes('قطاع')) type = 'sector';
                else if (typeVal?.includes('طريقة')) type = 'payment_method';
                else if (typeVal?.includes('عهدة')) type = 'custodian';

                importedDropdowns.push({
                  id: `DRP-IMP-${idx}`,
                  type,
                  name: String(name).trim(),
                  description: String(row['الوصف'] || '')
                });
              }
            });
          }
        });

        resolve({
          employees: importedEmployees,
          journalEntries: importedEntries,
          dropdowns: importedDropdowns,
          sheetNames
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
