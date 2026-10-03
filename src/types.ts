export interface SalaryAdjustment {
  id: string;
  amount: number;
  date: string;
  type: 'زيادة' | 'خصم';
  description: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
  status: 'نشط' | 'إجازة' | 'موقوف' | 'مستقيل';
  notes?: string;
  hireDate?: string;
  advanceBalance?: number;
  miesDeduction?: number;
  salaryAdjustments?: SalaryAdjustment[];
}

export interface DropdownOption {
  id: string;
  type: 'sector' | 'category' | 'payment_method' | 'custodian';
  name: string;
  description?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  voucherNo: string;
  employeeId?: string;
  employeeName?: string;
  category: string;
  sector: string;
  amount: number;
  type: 'مصروف' | 'قبض عهدة' | 'تسوية' | 'راتب' | 'مبيعات';
  paymentMethod: string;
  debitAccount: string; // Account getting debited
  creditAccount: string; // Account getting credited
  custodian: string;
  statement: string;
  notes?: string;
  monthKey: string;
  createdAt: string;
  isInternal: boolean;
  // Sales specific fields
  isGift?: boolean;
  recipient?: string;
  isCreditSale?: boolean;
  quantity?: number;
  unitPrice?: number;
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

export interface InventoryItem {
  id: string;
  name: string;
  category: 'علف' | 'أدوية';
  unit: string;
  openingBalance: number;
  received: number;
  consumed: number;
  closingBalance: number;
  date: string;
  monthKey: string;
}

export interface GiftCreditSale {
  id: string;
  date: string;
  statement: string;
  isGift: boolean;
  recipient: string;
  quantity: number;
  unitPrice: number;
  total: number;
  monthKey: string;
}

export interface AppState {
  currentMonth: string;
  employees: Employee[];
  dropdowns: DropdownOption[];
  journalEntries: JournalEntry[];
  salesEntries: GiftCreditSale[];
  settlements: Record<string, MonthlySettlement>;
  inventory: InventoryItem[];
  minPettyCashLimit?: number;
  officialMiesPerPerson: number;
  viewMode: 'desktop' | 'android';
  activeTab: 'journal' | 'ledger' | 'settlement' | 'employees' | 'settings' | 'import_export' | 'inventory' | 'expenses' | 'sales';
}

export interface ExcelSheetImportData {
  settingsEmployees?: Partial<Employee>[];
  journalEntries?: Partial<JournalEntry>[];
  dropdowns?: Partial<DropdownOption>[];
}
