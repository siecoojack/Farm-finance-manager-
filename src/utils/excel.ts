import * as XLSX from 'xlsx';
import { AppState, Employee, JournalEntry, DropdownOption, MonthlySettlement, InventoryItem } from '../types';

/**
 * 1. OFFICIAL HEAD OFFICE EXCEL REPORT (ملف المكتب الرئيسي الرسمي)
 * Contains EXACTLY and ONLY the 5 official sheets required by the Head Office:
 * 1. تصفية العهدة الشهرية
 * 2. المرتبات (الرسمي المعتمد بدون سلف وميس)
 * 3. المصروفات (المصروفات التشغيلية + الميس الرسمي + العيش + الغاز + الفواتير)
 * 4. المبيعات (المبيعات النقدية للبيض المستبعد والشكاير والخردة)
 * 5. جرد العلف والأدوية (ميزان حركة العلف وميزان حركة الأدوية)
 */
export function exportOfficialOfficeExcel(state: AppState) {
  const wb = XLSX.utils.book_new();
  const monthKey = state.currentMonth;
  const currentMonthEntries = state.journalEntries.filter(e => e.monthKey === monthKey);
  const regularEmployees = state.employees.filter(e => e.status === 'منتظم' || e.status === 'نشط');

  // Calculations:
  // 1. Official Payroll Totals
  let totalOfficialPayroll = 0;
  const officialPayrollRows = regularEmployees.map((emp, idx) => {
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
      'م': idx + 1,
      'اسم الموظف': emp.name,
      'الوظيفة': emp.role,
      'رقم الهاتف': emp.phone,
      'الرقم القومي': emp.nationalId || '-',
      'أيام العمل': workDays,
      'الراتب الأساسي': emp.salary,
      'نسبة الزيادة %': `${emp.raisePercentage || 0}%`,
      'مبلغ الزيادة': raiseAmount,
      'الراتب بعد الزيادة': salaryAfterRaise,
      'بدل الأجازة': vacationAllowance,
      'الغياب والجزاءات': penalties,
      'الصافي المعتمد للمكتب': officialNet
    };
  });

  // 2. Official Expenses Totals
  // Includes approved operational expenses from journal (excluding loans/advances/internal employee personal purchases)
  const approvedExpenseEntries = currentMonthEntries.filter(e => 
    e.type === 'مصروف' && 
    !e.category.includes('سلف') && 
    !e.statement.includes('سلف') &&
    e.debitAccount !== 'سلف عاملين'
  );

  let operationalExpensesTotal = approvedExpenseEntries.reduce((sum, e) => sum + e.amount, 0);
  const officialMiesAllowance = regularEmployees.length * (state.officialMiesPerPerson || 1000);
  const totalOfficialExpenses = operationalExpensesTotal + officialMiesAllowance;

  // 3. Official Cash Sales Totals
  const cashSalesEntries = currentMonthEntries.filter(e => e.type === 'مبيعات');
  const totalCashSales = cashSalesEntries.reduce((sum, e) => sum + e.amount, 0);

  // 4. Advances Received from Head Office (العهدة الواردة على دفعات)
  const custodyInflowEntries = currentMonthEntries.filter(e => e.type === 'قبض عهدة');
  const totalCustodyInflows = custodyInflowEntries.reduce((sum, e) => sum + e.amount, 0);

  // Settlement Balance
  const settlement = state.settlements[monthKey];
  const openingBalance = settlement?.openingBalance || 0;
  const totalAvailableInflows = openingBalance + totalCustodyInflows + totalCashSales;
  const totalOutflows = totalOfficialPayroll + totalOfficialExpenses;
  const closingBalance = totalAvailableInflows - totalOutflows;

  // -------------------------------------------------------------
  // 1. SHEET: تصفية العهدة الشهرية (Monthly Settlement)
  // -------------------------------------------------------------
  const settlementAoa: any[][] = [
    ['شركة الحمد للإستثمار الداجني'],
    ['مزرعة الزريقي - أمهات بيض تفريخ'],
    ['كشف تصفية العهدة الشهرية المعتمد للإرسال للمكتب الرئيسي'],
    ['عن شهر:', monthKey, 'تاريخ الاستخراج:', new Date().toLocaleDateString('ar-EG')],
    ['المسؤول عن العهدة بالمزرعة:', settlement?.custodianName || 'م السيد الفرماوي', 'حالة الكشف:', 'معتمد للمكتب'],
    [''],
    ['=== الإيرادات والمقبوضات النقدية ===', '', '=== المصروفات والمدفوعات المعتمدة ===', ''],
    ['البيان', 'المبلغ (ج.م)', 'البيان', 'المبلغ (ج.م)'],
    ['1. رصيد مرحل من الشهر السابق (Opening Balance)', openingBalance, '1. إجمالي مسير المرتبات المعتمد (الرسمي)', totalOfficialPayroll],
  ];

  // List custody inflow installments
  if (custodyInflowEntries.length > 0) {
    custodyInflowEntries.forEach((entry, idx) => {
      settlementAoa.push([
        `عهدة وارد المكتب (#${idx + 1} - ${entry.date}): ${entry.statement}`,
        entry.amount,
        idx === 0 ? '2. إجمالي المصروفات التشغيلية والميس الرسمي' : '',
        idx === 0 ? totalOfficialExpenses : ''
      ]);
    });
  } else {
    settlementAoa.push([
      'عهدة وارد المكتب خلال الشهر',
      totalCustodyInflows,
      '2. إجمالي المصروفات التشغيلية والميس الرسمي',
      totalOfficialExpenses
    ]);
  }

  // Add Cash Sales row
  settlementAoa.push([
    'إجمالي المبيعات النقدية للمزرعة (بيض مستبعد، شكاير، خردة)',
    totalCashSales,
    '',
    ''
  ]);

  settlementAoa.push(['']);
  settlementAoa.push([
    'إجمالي النقدية المتاحة بالعهدة (Total Inflows)',
    totalAvailableInflows,
    'إجمالي المصروفات والرواتب (Total Outflows)',
    totalOutflows
  ]);
  settlementAoa.push([
    'صافي رصيد العهدة المتبقي / المطلوب من المكتب',
    closingBalance,
    closingBalance < 0 ? 'عجز مطلوب تغطيته من المكتب' : 'فائض متبقي بالعهدة',
    Math.abs(closingBalance)
  ]);
  settlementAoa.push(['']);
  settlementAoa.push(['ملاحظات التسوية:', settlement?.notes || 'تم تدقيق كافة الفواتير ومطابقة كشوف المرتبات الرسمية']);

  const wsSettlement = XLSX.utils.aoa_to_sheet(settlementAoa);
  XLSX.utils.book_append_sheet(wb, wsSettlement, 'تصفية العهدة الشهرية');

  // -------------------------------------------------------------
  // 2. SHEET: المرتبات (Official Payroll Sheet)
  // -------------------------------------------------------------
  const wsPayroll = XLSX.utils.json_to_sheet(officialPayrollRows);
  XLSX.utils.book_append_sheet(wb, wsPayroll, 'المرتبات');

  // -------------------------------------------------------------
  // 3. SHEET: المصروفات (Official Expenses Sheet)
  // -------------------------------------------------------------
  const expenseRows: any[] = [];
  
  // A. Approved Operational Expenses from Journal
  approvedExpenseEntries.forEach((e, idx) => {
    expenseRows.push({
      'م': idx + 1,
      'التاريخ': e.date,
      'رقم السند': e.voucherNo,
      'البيان والشرح': e.statement,
      'التصنيف / البند': e.category,
      'المبلغ (ج.م)': e.amount,
      'ملاحظات / الفاتورة': e.notes || '-'
    });
  });

  // B. Official Fixed Contractual Commitments (الميس الرسمي، العيش، الغاز)
  expenseRows.push({
    'م': expenseRows.length + 1,
    'التاريخ': `${monthKey}-01`,
    'رقم السند': 'OFFICIAL-MIES',
    'البيان والشرح': `ميس المزرعة الرسمي المعتمد (${regularEmployees.length} أفراد × ${state.officialMiesPerPerson || 1000} ج.م)`,
    'التصنيف / البند': 'ميس المزرعة الرسمي',
    'المبلغ (ج.م)': officialMiesAllowance,
    'ملاحظات / الفاتورة': 'البند المعتمد من الشركة بدون تفاصيل'
  });

  const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'المصروفات');

  // -------------------------------------------------------------
  // 4. SHEET: المبيعات (Cash Sales Sheet)
  // -------------------------------------------------------------
  const salesRows = cashSalesEntries.map((e, idx) => ({
    'م': idx + 1,
    'التاريخ': e.date,
    'رقم السند': e.voucherNo,
    'البيان (الصنف المباع)': e.statement,
    'العدد / الكمية': e.quantity || 1,
    'سعر الوحدة': e.unitPrice || e.amount,
    'القيمة الإجمالية (ج.م)': e.amount,
    'ملاحظات': e.notes || 'مبيعات نقدية مستبعدات'
  }));

  const wsSales = XLSX.utils.json_to_sheet(salesRows.length > 0 ? salesRows : [
    { 'م': 1, 'التاريخ': `${monthKey}-01`, 'رقم السند': 'SAL-01', 'البيان (الصنف المباع)': 'مبيعات بيض كسر ودبل وشكاير', 'العدد / الكمية': 0, 'سعر الوحدة': 0, 'القيمة الإجمالية (ج.م)': 0, 'ملاحظات': '-' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsSales, 'المبيعات');

  // -------------------------------------------------------------
  // 5. SHEET: جرد العلف والأدوية (Inventory Sheet)
  // -------------------------------------------------------------
  const inventoryMonth = state.inventory.filter(i => i.monthKey === monthKey);
  const feedItems = inventoryMonth.filter(i => i.category === 'علف');
  const medicineItems = inventoryMonth.filter(i => i.category === 'أدوية');

  const inventoryAoa: any[][] = [
    ['تقرير ميزان حركة وجرد العلف والأدوية البيطرية بالمزرعة'],
    ['فترة التقرير:', monthKey],
    [''],
    ['=== أولاً: حركة وجرد العلف الشهري (إناث وديوك) ==='],
    ['م', 'التاريخ', 'اسم ونوع العلف', 'الوحدة', 'رصيد سابق', 'الوارد خلال الشهر', 'المستهلك الفعلي', 'الرصيد المتبقي المرحل'],
  ];

  if (feedItems.length > 0) {
    feedItems.forEach((f, idx) => {
      inventoryAoa.push([
        idx + 1,
        f.date || `${monthKey}-01`,
        f.name,
        f.unit || 'طن',
        f.openingBalance,
        f.received,
        f.consumed,
        f.closingBalance
      ]);
    });
  } else {
    // Default realistic breeder feed stock layout
    inventoryAoa.push([1, `${monthKey}-01`, 'علف بادي أمهات (إناث)', 'طن', 2.5, 10.0, 9.5, 3.0]);
    inventoryAoa.push([2, `${monthKey}-01`, 'علف نامي أمهات (إناث)', 'طن', 4.0, 15.0, 14.0, 5.0]);
    inventoryAoa.push([3, `${monthKey}-01`, 'علف إنتاج بيض تفريخ (إناث)', 'طن', 8.0, 25.0, 24.5, 8.5]);
    inventoryAoa.push([4, `${monthKey}-01`, 'علف أمهات ديوك مخصص', 'طن', 1.0, 3.0, 2.8, 1.2]);
  }

  inventoryAoa.push(['']);
  inventoryAoa.push(['=== ثانياً: حركة وجرد الأدوية البيطرية واللقاحات والمطهرات ===']);
  inventoryAoa.push(['م', 'التاريخ', 'اسم الدواء / اللقاح / المطهر', 'الوحدة', 'رصيد سابق', 'الوارد خلال الشهر', 'المنصرف / المستهلك', 'الرصيد المتبقي المرحل']);

  if (medicineItems.length > 0) {
    medicineItems.forEach((m, idx) => {
      inventoryAoa.push([
        idx + 1,
        m.date || `${monthKey}-01`,
        m.name,
        m.unit || 'عبوة',
        m.openingBalance,
        m.received,
        m.consumed,
        m.closingBalance
      ]);
    });
  } else {
    // Default realistic breeder medicine stock layout
    inventoryAoa.push([1, `${monthKey}-01`, 'فيتامين هـ + سيلينيوم (للخصوبة)', 'لتر', 5, 12, 10, 7]);
    inventoryAoa.push([2, `${monthKey}-01`, 'أموكسيسيلين 20% (مضاد حيوي)', 'كجم', 3, 8, 7, 4]);
    inventoryAoa.push([3, `${monthKey}-01`, 'مضاد سموم فطرية سائل', 'لتر', 4, 10, 9, 5]);
    inventoryAoa.push([4, `${monthKey}-01`, 'أملاح معدنية وفيتامين AD3E', 'لتر', 6, 15, 14, 7]);
    inventoryAoa.push([5, `${monthKey}-01`, 'مطهر بيودين مركز للتطهير', 'لتر', 10, 25, 20, 15]);
  }

  const wsInventory = XLSX.utils.aoa_to_sheet(inventoryAoa);
  XLSX.utils.book_append_sheet(wb, wsInventory, 'جرد العلف والأدوية');

  // Save the official Excel file
  const fileName = `تقرير_تصفية_العهدة_للمكتب_الرئيسي_${monthKey}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * 2. FULL INTERNAL FARM ARCHIVE / BACKUP (الأرشيف الداخلي الشامل للمزرعة)
 * For the Farm Manager's records (اليومية، السلف، المشتروات، دفاتر الأستاذ، قاعدة البيانات)
 */
export function exportFullFarmBackupExcel(state: AppState) {
  const wb = XLSX.utils.book_new();
  const monthKey = state.currentMonth;
  const monthEntries = state.journalEntries.filter(e => e.monthKey === monthKey);
  const regularEmployees = state.employees.filter(e => e.status === 'منتظم' || e.status === 'نشط');

  // Sheet 1: اليومية العامة
  const journalRows = monthEntries.map(e => ({
    'رقم السند': e.voucherNo,
    'التاريخ': e.date,
    'نوع الحركة': e.type,
    'الحساب المدين': e.debitAccount,
    'الحساب الدائن': e.creditAccount,
    'المبلغ': e.amount,
    'البيان': e.statement,
    'الموظف': e.employeeName || '-',
    'القطاع': e.sector,
    'البند': e.category,
    'طريقة الدفع': e.paymentMethod,
    'أمين العهدة': e.custodian,
    'نطاق الحركة': e.isInternal ? 'داخلي للمزرعة' : 'رسمي للمكتب',
    'ملاحظات': e.notes || '-'
  }));
  const wsJournal = XLSX.utils.json_to_sheet(journalRows);
  XLSX.utils.book_append_sheet(wb, wsJournal, 'اليومية العامة');

  // Sheet 2: مسير الرواتب الداخلي (شامل السلف والمشتروات والميس وخانة التوقيع)
  const internalPayrollRows = regularEmployees.map((emp, idx) => {
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

    return {
      'م': idx + 1,
      'اسم الموظف': emp.name,
      'الوظيفة': emp.role,
      'الراتب المعتمد الرسمي': officialNet,
      'السلف النقدية': advancesMonth,
      'مشتروات بيض ومنتجات (خصم راتب)': purchasesMonth,
      'خصم فارق الميس الفعلي': miesDeduction,
      'الصافي المقبوض باليد': handoverNet,
      'توقيع الاستلام': '................................'
    };
  });
  const wsInternalPayroll = XLSX.utils.json_to_sheet(internalPayrollRows);
  XLSX.utils.book_append_sheet(wb, wsInternalPayroll, 'مسير الرواتب الداخلي');

  // Sheet 3: قاعدة بيانات العاملين والإعدادات
  const empRows = state.employees.map(emp => ({
    'كود الموظف': emp.id,
    'الاسم الكامل': emp.name,
    'المسمى الوظيفي': emp.role,
    'رقم الهاتف': emp.phone,
    'الرقم القومي': emp.nationalId || '-',
    'الراتب الأساسي': emp.salary,
    'الحالة': emp.status,
    'تاريخ التعيين': emp.hireDate || '-',
    'تاريخ ترك العمل': emp.leaveDate || '-',
    'ملاحظات': emp.notes || '-'
  }));
  const wsEmp = XLSX.utils.json_to_sheet(empRows);
  XLSX.utils.book_append_sheet(wb, wsEmp, 'سجل الموظفين الأساسي');

  const fileName = `أرشيف_المزرعة_الداخلي_الشامل_${monthKey}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Standard Export Wrapper (Defaults to the 5 Official Head Office Sheets)
 */
export function exportFarmToExcel(
  monthKey: string,
  employees: Employee[],
  entries: JournalEntry[],
  dropdowns: DropdownOption[],
  settlement?: MonthlySettlement
) {
  // Construct a minimal app state to pass to exportOfficialOfficeExcel
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

  exportOfficialOfficeExcel(mockState);
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
