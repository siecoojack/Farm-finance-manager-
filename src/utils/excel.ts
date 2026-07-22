import * as XLSX from 'xlsx';
import { Employee, JournalEntry, DropdownOption, MonthlySettlement } from '../types';

/**
 * Export full farm financial database/sheets to Excel file
 */
export function exportFarmToExcel(
  monthKey: string,
  employees: Employee[],
  entries: JournalEntry[],
  dropdowns: DropdownOption[],
  settlement?: MonthlySettlement
) {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: تسوية العهدة (Monthly Settlement Report)
  const settlementData = [
    ['تقرير تسوية العهدة المالية للمزرعة للمكتب الرئيسي'],
    ['الشهر:', monthKey, 'تاريخ الاستخراج:', new Date().toLocaleDateString('ar-EG')],
    ['المسؤول عن العهدة:', settlement?.custodianName || 'مهندس أحمد علي'],
    ['حالة التقرير:', settlement?.status || 'مسودة'],
    [''],
    ['البيان / الحركة المالية', 'المبلغ (ج.م)'],
    ['1. الرصيد المرحل من الشهر السابق (Opening Balance)', settlement?.openingBalance || 0],
    ['2. إجمالي المقبوضات والتعزيزات الواردة (Advances Received)', settlement?.totalAdvancesReceived || 0],
    ['3. إجمالي المبالغ المتاحة (1 + 2)', (settlement?.openingBalance || 0) + (settlement?.totalAdvancesReceived || 0)],
    ['4. إجمالي المصروفات التشغيلية والمشتريات', settlement?.totalExpenses || 0],
    ['5. إجمالي الرواتب والأجور المدفوعة', settlement?.totalSalaries || 0],
    ['6. صافي الرصيد المتبقي بالعهدة (Closing Balance)', settlement?.closingBalance || 0],
    [''],
    ['ملاحظات التقرير:', settlement?.notes || '']
  ];
  const wsSettlement = XLSX.utils.aoa_to_sheet(settlementData);
  XLSX.utils.book_append_sheet(wb, wsSettlement, 'تقرير تسوية العهدة');

  // 2. Sheet: اليومية العامة للمصاريف (Daily Expense Journal)
  const monthEntries = entries.filter(e => e.monthKey === monthKey);
  const journalRows = monthEntries.map(e => ({
    'رقم السند': e.voucherNo,
    'التاريخ': e.date,
    'نوع الحركة': e.type,
    'القطاع / قسم المزرعة': e.sector,
    'البند / الفئة': e.category,
    'المبلغ': e.amount,
    'طريقة الدفع': e.paymentMethod,
    'أمين العهدة': e.custodian,
    'الموظف المستلم': e.employeeName || '-',
    'البيان / الشرح التفصيلي': e.statement,
    'ملاحظات / الفاتورة': e.notes || '-'
  }));
  const wsJournal = XLSX.utils.json_to_sheet(journalRows.length > 0 ? journalRows : [
    { 'رقم السند': '', 'التاريخ': '', 'نوع الحركة': '', 'القطاع / قسم المزرعة': '', 'البند / الفئة': '', 'المبلغ': 0, 'طريقة الدفع': '', 'أمين العهدة': '', 'الموظف المستلم': '', 'البيان / الشرح التفصيلي': '', 'ملاحظات / الفاتورة': '' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsJournal, 'اليومية العامة');

  // 3. Sheet: إعدادات الموظفين (Employees Settings)
  const empRows = employees.map(emp => ({
    'كود الموظف': emp.id,
    'الاسم الكامل': emp.name,
    'المسمى الوظيفي': emp.role,
    'رقم الهاتف': emp.phone,
    'الراتب الأساسي': emp.salary,
    'الحالة': emp.status,
    'تاريخ التعيين': emp.hireDate || '-',
    'ملاحظات': emp.notes || '-'
  }));
  const wsEmp = XLSX.utils.json_to_sheet(empRows);
  XLSX.utils.book_append_sheet(wb, wsEmp, 'سجل الموظفين');

  // 4. Sheet: القوائم المنسدلة والقطاعات (Dropdowns)
  const dropdownRows = dropdowns.map(d => ({
    'النوع': d.type === 'sector' ? 'قطاع المزرعة' : d.type === 'category' ? 'بند المصروف' : d.type === 'payment_method' ? 'طريقة الدفع' : 'أمين عهدة',
    'الاسم / المسمى': d.name,
    'الوصف': d.description || ''
  }));
  const wsDropdowns = XLSX.utils.json_to_sheet(dropdownRows);
  XLSX.utils.book_append_sheet(wb, wsDropdowns, 'القوائم المنسدلة');

  // Generate binary output and save file
  const fileName = `Farm_Financial_Report_${monthKey}.xlsx`;
  XLSX.writeFile(wb, fileName);
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

          // If Sheet matches Employees / موظفين / إعدادات الموظفين
          if (lowerSheet.includes('موظف') || lowerSheet.includes('employee') || lowerSheet.includes('سجل الموظفين')) {
            json.forEach((row, idx) => {
              const name = row['الاسم الكامل'] || row['اسم الموظف'] || row['الاسم'] || row['Name'] || row['name'];
              if (name && String(name).trim() !== '') {
                importedEmployees.push({
                  id: String(row['كود الموظف'] || row['الكود'] || `EMP-IMP-${idx + 1}`),
                  name: String(name).trim(),
                  role: String(row['المسمى الوظيفي'] || row['الوظيفة'] || row['Role'] || 'عامل مزرعة'),
                  phone: String(row['رقم الهاتف'] || row['الهاتف'] || row['Phone'] || ''),
                  salary: Number(row['الراتب الأساسي'] || row['الراتب'] || row['Salary'] || 0),
                  status: (row['الحالة'] === 'إجازة' || row['الحالة'] === 'موقوف') ? row['الحالة'] : 'نشط',
                  notes: String(row['ملاحظات'] || '')
                });
              }
            });
          }

          // If Sheet matches Daily Journal / اليومية / المصاريف / Journal
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
                  custodian: String(row['أمين العهدة'] || 'عهدة المزرعة'),
                  employeeName: row['الموظف المستلم'] || row['الموظف'] || '',
                  statement: String(row['البيان / الشرح التفصيلي'] || row['البيان'] || row['الشرح'] || 'مصروف مزرعة'),
                  notes: String(row['ملاحظات / الفاتورة'] || row['ملاحظات'] || ''),
                  monthKey,
                  createdAt: new Date().toISOString()
                });
              }
            });
          }

          // If Sheet matches Dropdowns / إعدادات / القوائم
          if (lowerSheet.includes('قوائم') || lowerSheet.includes('منسدلة') || lowerSheet.includes('إعدادات') || lowerSheet.includes('settings')) {
            json.forEach((row, idx) => {
              const name = row['الاسم / المسمى'] || row['الاسم'] || row['المسمى'] || row['Name'];
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
