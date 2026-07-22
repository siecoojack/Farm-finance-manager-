export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
  status: 'نشط' | 'إجازة' | 'موقوف' | 'مستقيل';
  notes?: string;
  hireDate?: string;
}

export interface DropdownOption {
  id: string;
  type: 'sector' | 'category' | 'payment_method' | 'custodian';
  name: string;
  description?: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  voucherNo: string; // رقم السند
  employeeId?: string;
  employeeName?: string;
  category: string; // البند الرئيسي / الفرعي
  sector: string; // قطاع المزرعة (الري، السماد، الصيانة...)
  amount: number; // المبلغ
  type: 'مصروف' | 'قبض عهدة' | 'تسوية' | 'راتب';
  paymentMethod: string; // نقداً، تحويل بنكي، عهدة...
  custodian: string; // أمين العهدة / المسؤول
  statement: string; // البيان / الوصف
  notes?: string;
  monthKey: string; // e.g., "2026-07"
  createdAt: string;
}

export interface MonthlySettlement {
  monthKey: string; // YYYY-MM
  monthName: string; // e.g. "يوليو 2026"
  custodianName: string; // اسم أمين العهدة
  openingBalance: number; // الرصيد المرحل من الشهر السابق
  totalAdvancesReceived: number; // إجمالي المقبوضات/العهدة الواردة
  totalExpenses: number; // إجمالي المصروفات
  totalSalaries: number; // إجمالي الرواتب المدفوعة
  closingBalance: number; // الرصيد المتبقي بالعهدة
  notes?: string;
  status: 'مسودة' | 'معتمد' | 'مرحل للمكتب الرئيسي';
  updatedAt: string;
}

export interface AppState {
  currentMonth: string; // e.g., "2026-07"
  employees: Employee[];
  dropdowns: DropdownOption[];
  journalEntries: JournalEntry[];
  settlements: Record<string, MonthlySettlement>; // key is monthKey
  viewMode: 'desktop' | 'android';
  activeTab: 'journal' | 'ledger' | 'settlement' | 'settings' | 'import_export';
}

export interface ExcelSheetImportData {
  settingsEmployees?: Partial<Employee>[];
  journalEntries?: Partial<JournalEntry>[];
  dropdowns?: Partial<DropdownOption>[];
}
