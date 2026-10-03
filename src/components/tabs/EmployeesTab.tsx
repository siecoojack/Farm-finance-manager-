import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit2, 
  DollarSign, 
  Phone, 
  X, 
  Search, 
  UserCheck, 
  Calendar,
  Briefcase,
  FileSpreadsheet,
  Building2,
  Utensils,
  HandCoins,
  Printer,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Wallet,
  ShoppingBag,
  ArrowUpRight,
  Share2,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { AppState, Employee, JournalEntry } from '../../types';

interface EmployeesTabProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const EmployeesTab: React.FC<EmployeesTabProps> = ({ state, setState }) => {
  // Navigation Sub-tabs:
  // 1. 'official_payroll' -> مسير المرتبات الرسمي المعتمد للمكتب
  // 2. 'internal_payroll' -> مسير الرواتب الداخلي للمزرعة (تقبيض العمال شامل السلف، المبيعات، والميس)
  // 3. 'advances' -> دفتر سلف العاملين
  // 4. 'purchases' -> سجل مشتروات البيض والمنتجات بالآجل للعاملين
  // 5. 'database' -> قاعدة بيانات وسجل العاملين
  const [subTab, setSubTab] = useState<'official_payroll' | 'internal_payroll' | 'advances' | 'purchases' | 'database'>('official_payroll');

  // Employee Form State (Add / Edit)
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empFormError, setEmpFormError] = useState<string | null>(null);

  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('عامل');
  const [empPhone, setEmpPhone] = useState('');
  const [empNationalId, setEmpNationalId] = useState('');
  const [empSalary, setEmpSalary] = useState<string>('');
  const [empStatus, setEmpStatus] = useState<Employee['status']>('منتظم');
  const [empHireDate, setEmpHireDate] = useState('2024');
  const [empLeaveDate, setEmpLeaveDate] = useState('');
  const [empNotes, setEmpNotes] = useState('');

  // Quick Advance Modal State
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceEmpId, setAdvanceEmpId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [advanceStatement, setAdvanceStatement] = useState('');
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState('نقداً من العهدة النقدية');

  // Quick Employee Purchase Modal State (مشتروات بيض/فراخ بالآجل)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseEmpId, setPurchaseEmpId] = useState('');
  const [purchaseItemName, setPurchaseItemName] = useState('طبق بيض كسر');
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(1);
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState<number>(75);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  // Employee Purchase Details Statement Modal State
  const [viewingPurchaseEmp, setViewingPurchaseEmp] = useState<Employee | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedAdvanceEmp, setSelectedAdvanceEmp] = useState<string>('ALL');
  const [selectedPurchaseFilterEmp, setSelectedPurchaseFilterEmp] = useState<string>('ALL');

  // Toast / Status Message
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // 1. Calculations & General Metrics
  const currentMonthEntries = state.journalEntries.filter(e => e.monthKey === state.currentMonth);
  const regularEmployees = state.employees.filter(e => e.status === 'منتظم' || e.status === 'نشط');
  
  // Total Base Payroll for Regular Staff: =SUMIF(الحالة="منتظم", الراتب الأساسي)
  const totalBasePayroll = regularEmployees.reduce((sum, e) => sum + e.salary, 0);

  // Helper function to calculate vacation allowance according to Excel formula:
  // IF(Role contains 'عامل', FLOOR(INT(workDays / 7) * (salaryAfterRaise / 30), 5), 0)
  const calculateVacationAllowance = (emp: Employee, salaryAfterRaise: number, workDays: number) => {
    if (emp.vacationAllowanceOverride !== undefined) {
      return emp.vacationAllowanceOverride;
    }
    const isWorker = emp.role.includes('عامل');
    if (!isWorker) return 0;
    
    const weeks = Math.floor(workDays / 7);
    const dayRate = salaryAfterRaise / 30;
    const rawAllowance = weeks * dayRate;
    // Floor to nearest 5 EGP as in Excel formula: FLOOR(..., 5)
    return Math.floor(rawAllowance / 5) * 5;
  };

  // Helper function to get Cash Advances for an employee in current month
  const getEmployeeAdvancesThisMonth = (emp: Employee) => {
    return currentMonthEntries
      .filter(e => 
        (e.employeeId === emp.id || e.employeeName === emp.name) &&
        (e.category.includes('سلف') || e.debitAccount === 'سلف عاملين' || (e.isInternal && e.statement.includes('سلف')))
      )
      .reduce((sum, e) => sum + e.amount, 0);
  };

  // Helper function to get Employee Purchases on Credit (مشتروات بيض ومنتجات تخصم من الراتب)
  const getEmployeePurchasesThisMonth = (emp: Employee) => {
    return currentMonthEntries
      .filter(e => 
        (e.employeeId === emp.id || e.employeeName === emp.name) &&
        (
          e.paymentMethod.includes('آجل') ||
          e.debitAccount.includes('مشتروات') ||
          e.category.includes('للعاملين') ||
          (e.type === 'مبيعات' && (e.employeeId === emp.id || e.employeeName === emp.name))
        )
      );
  };

  // Actual Mess (طعام العمال) Calculations from Journal:
  const actualMessEntries = currentMonthEntries.filter(e => 
    e.category.includes('معيشة') || 
    e.category.includes('ميس') || 
    e.debitAccount === 'الميس' || 
    e.statement.includes('ميس') || 
    e.sector.includes('ميس')
  );
  const totalActualMessSpent = actualMessEntries.reduce((sum, e) => sum + e.amount, 0);
  const officialMiesBudget = regularEmployees.length * (state.officialMiesPerPerson || 1000);
  const excessMessAmount = Math.max(0, totalActualMessSpent - officialMiesBudget);
  const perPersonExcessMess = regularEmployees.length > 0 ? Math.round(excessMessAmount / regularEmployees.length) : 0;

  // Compute full Payroll Rows for each regular employee
  const payrollRows = regularEmployees.map((emp, index) => {
    const workDays = emp.workDays !== undefined ? emp.workDays : 30;
    const raisePercentage = emp.raisePercentage || 0;
    const raiseAmount = Math.floor(emp.salary * (raisePercentage / 100));
    const salaryAfterRaise = emp.salary + raiseAmount;
    const vacationAllowance = calculateVacationAllowance(emp, salaryAfterRaise, workDays);
    const penalties = emp.penalties || 0;
    
    // Official Net for Head Office (لا يحتوي على السلف والمبيعات والميس)
    const officialGross = salaryAfterRaise + vacationAllowance;
    const officialNet = Math.round((officialGross - penalties) / 5) * 5;

    // Internal Deductions (للمزرعة وتقبيض العمال فقط)
    // 1. السلف النقدية
    const advancesMonth = getEmployeeAdvancesThisMonth(emp);
    const oldAdvancesBalance = emp.advanceBalance || 0;
    const totalAdvancesToDeduct = advancesMonth + oldAdvancesBalance;

    // 2. مشتروات البيض والمنتجات بالآجل
    const purchasesEntries = getEmployeePurchasesThisMonth(emp);
    const totalPurchasesMonth = purchasesEntries.reduce((sum, e) => sum + e.amount, 0);

    // 3. خصم الميس الفعلي
    const miesDeduction = emp.miesDeduction !== undefined ? emp.miesDeduction : perPersonExcessMess;

    // الصافي المقبوض في اليد
    const internalNetPayable = Math.max(0, officialNet - totalAdvancesToDeduct - totalPurchasesMonth - miesDeduction);

    return {
      index: index + 1,
      emp,
      workDays,
      baseSalary: emp.salary,
      raisePercentage,
      raiseAmount,
      salaryAfterRaise,
      vacationAllowance,
      penalties,
      officialNet,
      advancesMonth,
      totalAdvancesToDeduct,
      purchasesEntries,
      totalPurchasesMonth,
      miesDeduction,
      internalNetPayable
    };
  });

  // Totals for Official Payroll Sheet
  const totalRaiseAmount = payrollRows.reduce((sum, r) => sum + r.raiseAmount, 0);
  const totalSalaryAfterRaise = payrollRows.reduce((sum, r) => sum + r.salaryAfterRaise, 0);
  const totalOfficialVacations = payrollRows.reduce((sum, r) => sum + r.vacationAllowance, 0);
  const totalOfficialPenalties = payrollRows.reduce((sum, r) => sum + r.penalties, 0);
  const totalOfficialNet = payrollRows.reduce((sum, r) => sum + r.officialNet, 0);

  // Totals for Internal Payroll Sheet
  const totalInternalAdvances = payrollRows.reduce((sum, r) => sum + r.totalAdvancesToDeduct, 0);
  const totalInternalPurchases = payrollRows.reduce((sum, r) => sum + r.totalPurchasesMonth, 0);
  const totalInternalMies = payrollRows.reduce((sum, r) => sum + r.miesDeduction, 0);
  const totalHandoverCash = payrollRows.reduce((sum, r) => sum + r.internalNetPayable, 0);

  // Permanent commit of raises to Base Salary in Settings/Database (حل الحلقة المفرغة نهائياً)
  const handleCommitRaisesPermanently = () => {
    if (totalRaiseAmount === 0) {
      alert('لا توجد مبالغ زيادة مسجلة حالياً لترحيلها.');
      return;
    }

    if (confirm(`هل أنت متأكد من تثبيت وترحيل الزيادة الإجمالية (${totalRaiseAmount.toLocaleString('ar-EG')} ج.م) كراتب أساسي دائم في قاعدة البيانات وتصفير نسب الزيادة؟\n\nستصبح الرواتب الجديدة هي الأساس لجميع الشهور القادمة بدون أي حلقات مفرغة.`)) {
      setState(prev => ({
        ...prev,
        employees: prev.employees.map(emp => {
          const raiseAmount = Math.floor(emp.salary * ((emp.raisePercentage || 0) / 100));
          return {
            ...emp,
            salary: emp.salary + raiseAmount,
            raisePercentage: 0
          };
        })
      }));

      setActionSuccessMsg('تم بنجاح تثبيت الزيادة في الرواتب الأساسية وتصفير النسب للشهور القادمة!');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  // Save / Update Employee Master Data
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empSalary || Number(empSalary) < 0) {
      setEmpFormError('يرجى إدخال اسم الموظف وقيمة الراتب بشكل صحيح.');
      return;
    }
    setEmpFormError(null);

    if (editingEmpId) {
      // Edit
      setState(prev => ({
        ...prev,
        employees: prev.employees.map(emp => emp.id === editingEmpId ? {
          ...emp,
          name: empName.trim(),
          role: empRole.trim(),
          phone: empPhone.trim(),
          nationalId: empNationalId.trim(),
          salary: Number(empSalary),
          status: empStatus,
          hireDate: empHireDate.trim(),
          leaveDate: empLeaveDate.trim() || undefined,
          notes: empNotes.trim()
        } : emp)
      }));
    } else {
      // Add
      const newEmp: Employee = {
        id: `EMP-${String(state.employees.length + 1).padStart(2, '0')}`,
        name: empName.trim(),
        role: empRole.trim(),
        phone: empPhone.trim(),
        nationalId: empNationalId.trim(),
        salary: Number(empSalary),
        status: empStatus,
        hireDate: empHireDate.trim(),
        leaveDate: empLeaveDate.trim() || undefined,
        notes: empNotes.trim(),
        workDays: 30,
        raisePercentage: 0,
        penalties: 0
      };
      setState(prev => ({
        ...prev,
        employees: [...prev.employees, newEmp]
      }));
    }

    // Reset Form
    setEditingEmpId(null);
    setEmpName('');
    setEmpRole('عامل');
    setEmpPhone('');
    setEmpNationalId('');
    setEmpSalary('');
    setEmpNotes('');
    setEmpLeaveDate('');
    setShowEmpForm(false);
  };

  const handleEditEmp = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setEmpName(emp.name);
    setEmpRole(emp.role);
    setEmpPhone(emp.phone);
    setEmpNationalId(emp.nationalId || '');
    setEmpSalary(String(emp.salary));
    setEmpStatus(emp.status);
    setEmpHireDate(emp.hireDate || '2024');
    setEmpLeaveDate(emp.leaveDate || '');
    setEmpNotes(emp.notes || '');
    setShowEmpForm(true);
    setSubTab('database');
  };

  const handleDeleteEmp = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف من قاعدة البيانات؟')) {
      setState(prev => ({
        ...prev,
        employees: prev.employees.filter(emp => emp.id !== id)
      }));
    }
  };

  // Inline updates for Payroll Sheet (Work Days, Raise %, Penalties, Mies Override)
  const handleUpdatePayrollField = (empId: string, field: keyof Employee, value: any) => {
    setState(prev => ({
      ...prev,
      employees: prev.employees.map(emp => emp.id === empId ? {
        ...emp,
        [field]: value
      } : emp)
    }));
  };

  // Submit Quick Advance Voucher to Journal
  const handleSaveAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceEmpId || !advanceAmount || Number(advanceAmount) <= 0) {
      alert('يرجى اختيار الموظف وتحديد مبلغ السلفة بدقة.');
      return;
    }
    const emp = state.employees.find(x => x.id === advanceEmpId);
    if (!emp) return;

    const newAdvanceEntry: JournalEntry = {
      id: `JRN-${Date.now()}`,
      date: advanceDate,
      voucherNo: `ADV-${String(currentMonthEntries.length + 1).padStart(3, '0')}`,
      type: 'مصروف',
      category: 'سلف عاملين',
      sector: 'الإدارة والعمالة والخدمات',
      amount: Number(advanceAmount),
      debitAccount: 'سلف عاملين',
      creditAccount: advancePaymentMethod.includes('عهدة') ? 'العهدة' : 'النقدية',
      custodian: 'الخزينة النقدية الرئيسية للمزرعة',
      employeeId: emp.id,
      employeeName: emp.name,
      statement: advanceStatement.trim() || `سلفة نقدية على المرتب - ${emp.name}`,
      notes: `خصم من مسير راتب شهر ${state.currentMonth}`,
      monthKey: state.currentMonth,
      createdAt: new Date().toISOString(),
      paymentMethod: advancePaymentMethod,
      isInternal: true
    };

    setState(prev => ({
      ...prev,
      journalEntries: [newAdvanceEntry, ...prev.journalEntries]
    }));

    setShowAdvanceModal(false);
    setAdvanceAmount('');
    setAdvanceStatement('');

    setActionSuccessMsg(`تم تسجيل السلفة بنجاح (${Number(advanceAmount).toLocaleString('ar-EG')} ج.م) وقيدها في اليومية والمسير الداخلي!`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Submit Quick Employee Purchase (Egg/Product) on credit to Journal
  const handleSaveEmployeePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseEmpId || purchaseQuantity <= 0 || purchaseUnitPrice <= 0) {
      alert('يرجى اختيار الموظف وتحديد العدد والسعر بدقة.');
      return;
    }
    const emp = state.employees.find(x => x.id === purchaseEmpId);
    if (!emp) return;

    const totalCost = purchaseQuantity * purchaseUnitPrice;

    const newPurchaseEntry: JournalEntry = {
      id: `JRN-${Date.now()}`,
      date: purchaseDate,
      voucherNo: `SAL-EMP-${String(currentMonthEntries.length + 1).padStart(3, '0')}`,
      type: 'مبيعات',
      category: 'مبيعات بيض ومنتجات للعاملين',
      sector: 'الإدارة والعمالة والخدمات',
      amount: totalCost,
      quantity: purchaseQuantity,
      unitPrice: purchaseUnitPrice,
      debitAccount: 'مشتروات عاملين (خصم راتب)',
      creditAccount: 'المبيعات',
      custodian: 'الخزينة النقدية الرئيسية للمزرعة',
      employeeId: emp.id,
      employeeName: emp.name,
      statement: `${purchaseItemName.trim()} (عدد ${purchaseQuantity} × ${purchaseUnitPrice} ج.م) - ${emp.name}`,
      notes: `مشتروات بالآجل تخصم من مسير راتب شهر ${state.currentMonth}`,
      monthKey: state.currentMonth,
      createdAt: new Date().toISOString(),
      paymentMethod: 'آجل للعاملين (خصم من الراتب)',
      isInternal: true
    };

    setState(prev => ({
      ...prev,
      journalEntries: [newPurchaseEntry, ...prev.journalEntries]
    }));

    setShowPurchaseModal(false);
    setPurchaseQuantity(1);
    setPurchaseUnitPrice(75);

    setActionSuccessMsg(`تم بنجاح قيد مشتروات ${emp.name} بمبلغ ${totalCost.toLocaleString('ar-EG')} ج.م في اليومية وتحديث خانة المبيعات بالمسير الداخلي!`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Filtered employees for Database view
  const filteredEmployees = state.employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.phone.includes(searchTerm) ||
                          (emp.nationalId && emp.nationalId.includes(searchTerm));
    const matchesRole = filterRole === 'ALL' || emp.role === filterRole;
    const matchesStatus = filterStatus === 'ALL' || emp.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const uniqueRoles = Array.from(new Set(state.employees.map(e => e.role)));

  // Advances entries in Journal
  const allAdvanceEntries = state.journalEntries.filter(e => 
    e.category.includes('سلف') || 
    e.debitAccount === 'سلف عاملين' || 
    (e.isInternal && e.statement.includes('سلف'))
  );

  const filteredAdvanceEntries = allAdvanceEntries.filter(e => {
    if (selectedAdvanceEmp === 'ALL') return true;
    return e.employeeId === selectedAdvanceEmp || e.employeeName === selectedAdvanceEmp;
  });

  // Employee Purchases entries in Journal (مشتروات العاملين بالآجل)
  const allEmployeePurchaseEntries = state.journalEntries.filter(e => 
    e.paymentMethod.includes('آجل') ||
    e.debitAccount.includes('مشتروات') ||
    e.category.includes('للعاملين') ||
    (e.type === 'مبيعات' && e.employeeId)
  );

  const filteredPurchaseEntries = allEmployeePurchaseEntries.filter(e => {
    if (selectedPurchaseFilterEmp === 'ALL') return true;
    return e.employeeId === selectedPurchaseFilterEmp || e.employeeName === selectedPurchaseFilterEmp;
  });

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Toast Success Notification */}
      {actionSuccessMsg && (
        <div className="bg-emerald-900 border-2 border-emerald-500 text-emerald-100 p-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner & Sub-Tabs Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-800" />
              <h2 className="text-lg font-black text-slate-900">إدارة شؤون العاملين ومسيرات الرواتب والسلف</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              نظام محاسبي متكامل يفصل بين الكشف الرسمي المعتمد للمكتب والكشف الداخلي لتصفية السلف والمشتروات والميس
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition print:hidden"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكشف</span>
            </button>
            <button
              onClick={() => {
                setEditingEmpId(null);
                setShowEmpForm(true);
                setSubTab('database');
              }}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition print:hidden"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>
          </div>
        </div>

        {/* 5 Core Sub-tabs matching the Farm Architecture */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 print:hidden">
          
          <button
            onClick={() => setSubTab('official_payroll')}
            className={`p-3 rounded-xl border text-right transition flex items-center gap-2.5 ${
              subTab === 'official_payroll'
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${subTab === 'official_payroll' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-black">1. مسير المرتبات الرسمي</span>
              <span className={`text-[10px] block ${subTab === 'official_payroll' ? 'text-emerald-200' : 'text-slate-500'}`}>
                للمكتب (الأساسي والبدلات)
              </span>
            </div>
          </button>

          <button
            onClick={() => setSubTab('internal_payroll')}
            className={`p-3 rounded-xl border text-right transition flex items-center gap-2.5 ${
              subTab === 'internal_payroll'
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${subTab === 'internal_payroll' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-black">2. مسير الرواتب الداخلي</span>
              <span className={`text-[10px] block ${subTab === 'internal_payroll' ? 'text-emerald-200' : 'text-slate-500'}`}>
                تقبيض العمال (سلف ومبيعات وميس)
              </span>
            </div>
          </button>

          <button
            onClick={() => setSubTab('purchases')}
            className={`p-3 rounded-xl border text-right transition flex items-center gap-2.5 ${
              subTab === 'purchases'
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${subTab === 'purchases' ? 'bg-emerald-700 text-white' : 'bg-blue-100 text-blue-800'}`}>
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-black">3. مشتروات العاملين</span>
              <span className={`text-[10px] block ${subTab === 'purchases' ? 'text-emerald-200' : 'text-slate-500'}`}>
                بيض وفرزة بالآجل مع كشف حساب
              </span>
            </div>
          </button>

          <button
            onClick={() => setSubTab('advances')}
            className={`p-3 rounded-xl border text-right transition flex items-center gap-2.5 ${
              subTab === 'advances'
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${subTab === 'advances' ? 'bg-emerald-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
              <HandCoins className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-black">4. دفتر سلف العاملين</span>
              <span className={`text-[10px] block ${subTab === 'advances' ? 'text-emerald-200' : 'text-slate-500'}`}>
                سلف نقدية من اليومية
              </span>
            </div>
          </button>

          <button
            onClick={() => setSubTab('database')}
            className={`p-3 rounded-xl border text-right transition flex items-center gap-2.5 ${
              subTab === 'database'
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${subTab === 'database' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-black">5. قاعدة بيانات العاملين</span>
              <span className={`text-[10px] block ${subTab === 'database' ? 'text-emerald-200' : 'text-slate-500'}`}>
                السجل العام والأرقام القومية
              </span>
            </div>
          </button>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: OFFICIAL PAYROLL SHEET (كشف المرتبات الرسمي للمكتب) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'official_payroll' && (
        <div className="space-y-4">
          
          {/* Summary Metric Cards for Official Payroll */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500">العمالة المنتظمة بالكشف</p>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">{regularEmployees.length} موظف</h3>
                <p className="text-[10px] text-emerald-700 font-bold">الحالة: منتظم</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500">إجمالي الرواتب الأساسية</p>
                <h3 className="text-lg font-black text-slate-800 mt-0.5 font-mono">
                  {totalBasePayroll.toLocaleString('ar-EG')} <span className="text-[10px] font-normal">ج.م</span>
                </h3>
                <p className="text-[10px] text-slate-400">قبل نسبة الزيادة والبدل</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500">إجمالي مبالغ الزيادة</p>
                <h3 className="text-lg font-black text-emerald-700 mt-0.5 font-mono">
                  +{totalRaiseAmount.toLocaleString('ar-EG')} <span className="text-[10px] font-normal">ج.م</span>
                </h3>
                <p className="text-[10px] text-emerald-600 font-bold">صافية لمحاسبي المكتب</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500">إجمالي بدل الإجازة للعمال</p>
                <h3 className="text-lg font-black text-amber-700 mt-0.5 font-mono">
                  +{totalOfficialVacations.toLocaleString('ar-EG')} <span className="text-[10px] font-normal">ج.م</span>
                </h3>
                <p className="text-[10px] text-amber-600 font-bold">بمعدل أسبوعي محتسب آلياً</p>
              </div>
              <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-3.5 rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-emerald-200">الصافي المعتمد للمكتب</p>
                <h3 className="text-xl font-black text-emerald-100 mt-0.5 font-mono">
                  {totalOfficialNet.toLocaleString('ar-EG')} <span className="text-[10px] font-normal">ج.م</span>
                </h3>
                <p className="text-[10px] text-emerald-300 font-bold">يرحل مباشرة لتسوية العهدة</p>
              </div>
              <div className="w-10 h-10 bg-emerald-700/60 rounded-xl flex items-center justify-center text-emerald-200">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Official Payroll Table matching Excel sheet 'المرتبات' (مع الأعمدة الثلاثة الدقيقة للزيادة) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span>كشف مسير المرتبات الرسمي المعتمد للمكتب الرئيسي - شهر {state.currentMonth}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  هذا الكشف الرسمي يقدم للمكتب مع تصفية العهدة بدون خصم السلف والمشتروات والميس
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCommitRaisesPermanently}
                  title="تثبيت مبالغ الزيادة وترحيلها لتصبح راتباً أساسياً دائماً في قاعدة البيانات للشهور القادمة وتصفير النسب، مما يمنع حدوث أي حلقات مرجعية مفرغة"
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
                >
                  <BadgeCheck className="w-4 h-4 text-emerald-300" />
                  <span>تثبيت واعتماد الزيادة للشهور القادمة</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5 text-center">م</th>
                    <th className="p-2.5">اسم الموظف</th>
                    <th className="p-2.5">الوظيفة</th>
                    <th className="p-2.5">رقم الهاتف</th>
                    <th className="p-2.5">الرقم القومي</th>
                    <th className="p-2.5 text-center">أيام العمل</th>
                    <th className="p-2.5 text-center">الراتب الأساسي</th>
                    <th className="p-2.5 text-center text-emerald-800 bg-emerald-50/50">نسبة الزيادة %</th>
                    <th className="p-2.5 text-center text-emerald-900 bg-emerald-50/80 font-bold">مبلغ الزيادة</th>
                    <th className="p-2.5 text-center font-bold">الراتب بعد الزيادة</th>
                    <th className="p-2.5 text-center text-amber-800 bg-amber-50/50">بدل الأجازة</th>
                    <th className="p-2.5 text-center text-rose-700">غياب/جزاءات</th>
                    <th className="p-2.5 text-center text-emerald-900 bg-emerald-100 font-black">الصافي للمكتب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollRows.map((row) => (
                    <tr key={row.emp.id} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 text-center font-mono font-bold text-slate-500">{row.index}</td>
                      <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">{row.emp.name}</td>
                      <td className="p-2.5 text-slate-700 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {row.emp.role}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap" dir="ltr">{row.emp.phone || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap">{row.emp.nationalId || '-'}</td>
                      
                      {/* Work Days (Editable) */}
                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="31"
                          value={row.workDays}
                          onChange={(e) => handleUpdatePayrollField(row.emp.id, 'workDays', Number(e.target.value))}
                          className="w-14 text-center font-bold bg-slate-50 border border-slate-300 rounded p-1 text-slate-800"
                        />
                      </td>

                      {/* Base Salary */}
                      <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                        {row.baseSalary.toLocaleString('ar-EG')}
                      </td>

                      {/* 1. Raise % (Editable) */}
                      <td className="p-2.5 text-center bg-emerald-50/30">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={row.raisePercentage}
                            onChange={(e) => handleUpdatePayrollField(row.emp.id, 'raisePercentage', Number(e.target.value))}
                            className="w-12 text-center font-bold bg-white border border-emerald-300 rounded p-1 text-emerald-800"
                          />
                          <span className="text-slate-400 font-bold">%</span>
                        </div>
                      </td>

                      {/* 2. Raise Amount (محسوب وصافي لمحاسبي المكتب) */}
                      <td className="p-2.5 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">
                        {row.raiseAmount > 0 ? `+${row.raiseAmount.toLocaleString('ar-EG')}` : '0'}
                      </td>

                      {/* 3. Salary After Raise */}
                      <td className="p-2.5 text-center font-mono font-bold text-slate-900 bg-slate-50/50">
                        {row.salaryAfterRaise.toLocaleString('ar-EG')}
                      </td>

                      {/* Vacation Allowance (Auto formula from Excel: FLOOR(INT(days/7)*(salary/30), 5)) */}
                      <td className="p-2.5 text-center font-mono font-bold text-amber-800 bg-amber-50/30">
                        {row.vacationAllowance > 0 ? row.vacationAllowance.toLocaleString('ar-EG') : '0'}
                      </td>

                      {/* Penalties (Editable) */}
                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          value={row.penalties || ''}
                          placeholder="0"
                          onChange={(e) => handleUpdatePayrollField(row.emp.id, 'penalties', Number(e.target.value))}
                          className="w-16 text-center font-bold bg-slate-50 border border-slate-300 rounded p-1 text-rose-600"
                        />
                      </td>

                      {/* Official Net */}
                      <td className="p-2.5 text-center font-mono font-black text-emerald-900 bg-emerald-50 text-sm whitespace-nowrap">
                        {row.officialNet.toLocaleString('ar-EG')} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-800">
                    <td colSpan={6} className="p-3 text-center">الإجمالي العام لمسير المرتبات المعتمد (Total)</td>
                    <td className="p-3 text-center font-mono">{totalBasePayroll.toLocaleString('ar-EG')}</td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-center font-mono text-emerald-300">+{totalRaiseAmount.toLocaleString('ar-EG')}</td>
                    <td className="p-3 text-center font-mono">{totalSalaryAfterRaise.toLocaleString('ar-EG')}</td>
                    <td className="p-3 text-center font-mono text-amber-300">+{totalOfficialVacations.toLocaleString('ar-EG')}</td>
                    <td className="p-3 text-center font-mono text-rose-300">-{totalOfficialPenalties.toLocaleString('ar-EG')}</td>
                    <td className="p-3 text-center font-mono text-emerald-300 text-sm whitespace-nowrap">
                      {totalOfficialNet.toLocaleString('ar-EG')} ج.م
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 2: INTERNAL PAYROLL SHEET (مسير الرواتب الداخلي للمزرعة) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'internal_payroll' && (
        <div className="space-y-4">
          
          {/* Internal Payroll Explanatory & Stat Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <Wallet className="w-5 h-5" />
                <span>كشف مسير الرواتب الفعلي الداخلي للمزرعة (تقبيض العاملين)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPurchaseModal(true)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>قيد مشتروات بيض لعامل</span>
                </button>
                <button
                  onClick={() => setShowAdvanceModal(true)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                >
                  <HandCoins className="w-3.5 h-3.5" />
                  <span>صرف سلفة لعامل</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              وفقاً للنظام الإداري للمزرعة: يستلم المدير مسير الرواتب الإجمالي من المكتب ({totalOfficialNet.toLocaleString('ar-EG')} ج.م)، ويقوم بخصم السلف النقدية، ومشتروات البيض/الفرزة بالآجل، وفارق الميس الفعلي، فيتسلم العامل الصافي في اليد، ويسترد المدير مبالغ المشتروات والسلف لتوريدها نقدية بالعهدة دون أي عجز.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[11px]">الراتب المعتمد من المكتب</span>
                <span className="text-base font-black text-white mt-1 block font-mono">
                  {totalOfficialNet.toLocaleString('ar-EG')} ج.م
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-rose-300 block text-[11px]">السلف النقدية المستردة</span>
                <span className="text-base font-black text-rose-400 mt-1 block font-mono">
                  -{totalInternalAdvances.toLocaleString('ar-EG')} ج.م
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-blue-300 block text-[11px]">مشتروات البيض المستردة</span>
                <span className="text-base font-black text-blue-400 mt-1 block font-mono">
                  -{totalInternalPurchases.toLocaleString('ar-EG')} ج.م
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-amber-300 block text-[11px]">خصم فارق الميس الفعلي</span>
                <span className="text-base font-black text-amber-400 mt-1 block font-mono">
                  -{totalInternalMies.toLocaleString('ar-EG')} ج.م
                </span>
              </div>

              <div className="bg-emerald-900/80 p-3 rounded-xl border border-emerald-700">
                <span className="text-emerald-300 block text-[11px] font-bold">صافي النقدية للتقبيض باليد</span>
                <span className="text-base font-black text-emerald-200 mt-1 block font-mono">
                  {totalHandoverCash.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Internal Payroll Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span>كشف تقبيض العاملين وتوقيعات الاستلام - شهر {state.currentMonth}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  تفصيل كامل لكافة الاستقطاعات الداخلية (السلف النقدية، مشتروات البيض، وفارق الميس)
                </p>
              </div>
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                مرتبط آلياً بحركات اليومية العامة
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5 text-center">م</th>
                    <th className="p-2.5">اسم الموظف / العامل</th>
                    <th className="p-2.5">الوظيفة</th>
                    <th className="p-2.5 text-center bg-slate-200/50">المستحق الرسمي</th>
                    <th className="p-2.5 text-center text-rose-700 bg-rose-50/50">السلف النقدية</th>
                    <th className="p-2.5 text-center text-blue-800 bg-blue-50/50">مشتروات بيض/فرزة</th>
                    <th className="p-2.5 text-center text-amber-800 bg-amber-50/50">خصم فارق الميس</th>
                    <th className="p-2.5 text-center text-emerald-900 bg-emerald-100 font-black">الصافي المقبوض في اليد</th>
                    <th className="p-2.5 text-center">توقيع أو بصمة الاستلام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollRows.map((row) => (
                    <tr key={row.emp.id} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 text-center font-mono font-bold text-slate-500">{row.index}</td>
                      <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">{row.emp.name}</td>
                      <td className="p-2.5 text-slate-700 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {row.emp.role}
                        </span>
                      </td>

                      {/* Official Net from Head Office */}
                      <td className="p-2.5 text-center font-mono font-bold text-slate-800 bg-slate-50">
                        {row.officialNet.toLocaleString('ar-EG')} ج.م
                      </td>

                      {/* Cash Advances this Month (Pulled from Journal) */}
                      <td className="p-2.5 text-center font-mono font-bold text-rose-700 bg-rose-50/30">
                        {row.totalAdvancesToDeduct > 0 ? (
                          <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-black">
                            -{row.totalAdvancesToDeduct.toLocaleString('ar-EG')}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* Employee Credit Purchases (مشتروات البيض والفرزة) */}
                      <td className="p-2.5 text-center font-mono font-bold text-blue-800 bg-blue-50/30">
                        {row.totalPurchasesMonth > 0 ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-black">
                              -{row.totalPurchasesMonth.toLocaleString('ar-EG')}
                            </span>
                            <button
                              onClick={() => setViewingPurchaseEmp(row.emp)}
                              title="عرض كشف حساب تفصيلي بمشتروات العامل (أصناف، كميات، أسعار)"
                              className="p-1 hover:bg-blue-200 text-blue-700 rounded transition"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setPurchaseEmpId(row.emp.id);
                              setShowPurchaseModal(true);
                            }}
                            className="text-[10px] text-slate-400 hover:text-blue-700 underline"
                          >
                            + إضافة مشتروات
                          </button>
                        )}
                      </td>

                      {/* Mess Excess Deduction (Editable per person) */}
                      <td className="p-2.5 text-center font-mono bg-amber-50/30">
                        <input
                          type="number"
                          min="0"
                          value={row.miesDeduction}
                          onChange={(e) => handleUpdatePayrollField(row.emp.id, 'miesDeduction', Number(e.target.value))}
                          className="w-16 text-center font-bold bg-white border border-amber-300 rounded p-1 text-amber-800"
                        />
                      </td>

                      {/* Handover Net Cash */}
                      <td className="p-2.5 text-center font-mono font-black text-emerald-900 bg-emerald-50 text-sm whitespace-nowrap">
                        {row.internalNetPayable.toLocaleString('ar-EG')} ج.م
                      </td>

                      {/* Signature Field for printed payroll sheet */}
                      <td className="p-2.5 text-center text-slate-300 font-mono text-[10px]">
                        ....................................
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-800">
                    <td colSpan={3} className="p-3 text-center">الإجمالي الفعلي لتقبيض المزرعة (Total)</td>
                    <td className="p-3 text-center font-mono">{totalOfficialNet.toLocaleString('ar-EG')}</td>
                    <td className="p-3 text-center font-mono text-rose-300">-{totalInternalAdvances.toLocaleString('ar-EG')}</td>
                    <td className="p-3 text-center font-mono text-blue-300">-{totalInternalPurchases.toLocaleString('ar-EG')}</td>
                    <td className="p-3 text-center font-mono text-amber-300">-{totalInternalMies.toLocaleString('ar-EG')}</td>
                    <td className="p-3 text-center font-mono text-emerald-300 text-sm whitespace-nowrap">
                      {totalHandoverCash.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="p-3 text-center text-slate-400 text-[10px]">جاهز للصرف والتوقيع</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 3: EMPLOYEE CREDIT PURCHASES (سجل مشتروات العاملين بالآجل) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'purchases' && (
        <div className="space-y-4">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-700" />
                <span>سجل مبيعات ومشتروات العاملين بالآجل (بيض كسر، بيض دبل، فراخ فرزة)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                حركات مسجلة باليومية العامة باسم العامل ومرحلة آلياً لخصمها من راتبه الداخلي في نهاية الشهر
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedPurchaseFilterEmp}
                onChange={(e) => setSelectedPurchaseFilterEmp(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-700"
              >
                <option value="ALL">-- جميع العاملين --</option>
                {state.employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>

              <button
                onClick={() => setShowPurchaseModal(true)}
                className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>قيد مشتروات بيض جديدة</span>
              </button>
            </div>
          </div>

          {/* Purchases Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">رقم السند</th>
                    <th className="p-3">اسم الموظف المشتري</th>
                    <th className="p-3">البيان والصنف</th>
                    <th className="p-3 text-center">العدد / الكمية</th>
                    <th className="p-3 text-center">سعر الوحدة</th>
                    <th className="p-3 text-center text-blue-900 bg-blue-50">الإجمالي (خصم راتب)</th>
                    <th className="p-3">طريقة الدفع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchaseEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لا توجد مشتروات مسجلة للعاملين في الشهر الحالي.
                      </td>
                    </tr>
                  ) : (
                    filteredPurchaseEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono">{entry.date}</td>
                        <td className="p-3 font-mono font-bold text-blue-800">{entry.voucherNo}</td>
                        <td className="p-3 font-bold text-slate-900">{entry.employeeName || '-'}</td>
                        <td className="p-3 text-slate-800 font-medium">{entry.statement}</td>
                        <td className="p-3 text-center font-mono font-bold">{entry.quantity || 1}</td>
                        <td className="p-3 text-center font-mono">{entry.unitPrice ? `${entry.unitPrice.toLocaleString('ar-EG')} ج.م` : '-'}</td>
                        <td className="p-3 text-center font-mono font-black text-blue-700 bg-blue-50/50 text-sm">
                          {entry.amount.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">{entry.paymentMethod}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold text-xs">
                    <td colSpan={6} className="p-3 text-center">إجمالي مشتروات العاملين الواجبة الخصم من الرواتب</td>
                    <td className="p-3 text-center font-mono font-black text-blue-300 text-sm">
                      {filteredPurchaseEntries.reduce((s, e) => s + e.amount, 0).toLocaleString('ar-EG')} ج.م
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 4: ADVANCES LEDGER (دفتر سلف العاملين المستخرج من اليومية) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'advances' && (
        <div className="space-y-4">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-amber-700" />
                <span>سجل حركة سلف العاملين بالمزرعة (مستخرج تلقائياً من قيود اليومية)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تُخصم هذه السلف تلقائياً من كشف المرتبات الداخلي للعامل في نهاية الشهر
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedAdvanceEmp}
                onChange={(e) => setSelectedAdvanceEmp(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-700"
              >
                <option value="ALL">-- جميع العاملين --</option>
                {state.employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>

              <button
                onClick={() => setShowAdvanceModal(true)}
                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                <HandCoins className="w-4 h-4" />
                <span>صرف سلفة جديدة</span>
              </button>
            </div>
          </div>

          {/* Advances Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">رقم السند</th>
                    <th className="p-3">اسم الموظف المستلف</th>
                    <th className="p-3">البيان والشرح</th>
                    <th className="p-3">الحساب المدين</th>
                    <th className="p-3">طريقة الصرف</th>
                    <th className="p-3 text-center text-rose-700">مبلغ السلفة</th>
                    <th className="p-3">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdvanceEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لا توجد حركات سلف مسجلة في اليومية للفترة المحددة.
                      </td>
                    </tr>
                  ) : (
                    filteredAdvanceEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono">{entry.date}</td>
                        <td className="p-3 font-mono font-bold text-emerald-800">{entry.voucherNo}</td>
                        <td className="p-3 font-bold text-slate-900">{entry.employeeName || '-'}</td>
                        <td className="p-3 text-slate-800">{entry.statement}</td>
                        <td className="p-3 font-bold text-amber-800">
                          <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {entry.debitAccount || 'سلف عاملين'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{entry.paymentMethod}</td>
                        <td className="p-3 text-center font-mono font-black text-rose-700 text-sm">
                          {entry.amount.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">{entry.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold text-xs">
                    <td colSpan={6} className="p-3 text-center">إجمالي السلف المنصرفة</td>
                    <td className="p-3 text-center font-mono font-black text-rose-300 text-sm">
                      {filteredAdvanceEntries.reduce((s, e) => s + e.amount, 0).toLocaleString('ar-EG')} ج.م
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 5: DATABASE MASTER (قاعدة بيانات العاملين كما في ورقة إعدادات) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'database' && (
        <div className="space-y-4">
          
          {/* Employee Form (Add/Edit) */}
          {showEmpForm && (
            <form onSubmit={handleSaveEmployee} className="bg-white p-5 rounded-2xl border-2 border-emerald-600 shadow-md space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <UserPlus className="w-5 h-5 text-emerald-700" />
                  <span>{editingEmpId ? 'تعديل بيانات موظف بقاعدة البيانات' : 'تسجيل موظف أو عامل جديد بالمزرعة'}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowEmpForm(false)} 
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {empFormError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs font-semibold">
                  {empFormError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم الكامل للموظف *</label>
                  <input
                    type="text"
                    placeholder="اسم الموظف أو المهندس..."
                    value={empName}
                    onChange={e => setEmpName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المسمى الوظيفي / الدور</label>
                  <input
                    type="text"
                    placeholder="مدير المحطة، مهندس، مشرف، عامل..."
                    value={empRole}
                    onChange={e => setEmpRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الراتب الأساسي الشهري (ج.م) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={empSalary}
                    onChange={e => setEmpSalary(e.target.value)}
                    required
                    min="0"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف للتواصل</label>
                  <input
                    type="text"
                    placeholder="01012345678"
                    value={empPhone}
                    onChange={e => setEmpPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم القومي (14 رقم)</label>
                  <input
                    type="text"
                    placeholder="28109130201714"
                    maxLength={14}
                    value={empNationalId}
                    onChange={e => setEmpNationalId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">حالة العمل</label>
                  <select
                    value={empStatus}
                    onChange={e => setEmpStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                  >
                    <option value="منتظم">منتظم (على رأس العمل)</option>
                    <option value="إجازة">إجازة</option>
                    <option value="موقوف">موقوف مؤقتاً</option>
                    <option value="ترك العمل">ترك العمل</option>
                    <option value="مستقيل">مستقيل</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ / سنة الإلتحاق</label>
                  <input
                    type="text"
                    placeholder="مثال: 2010 أو 2024-01-15"
                    value={empHireDate}
                    onChange={e => setEmpHireDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ ترك العمل (إن وجد)</label>
                  <input
                    type="text"
                    placeholder="مثال: 2026-01-01"
                    value={empLeaveDate}
                    onChange={e => setEmpLeaveDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-bold text-slate-700 mb-1">ملاحظات ومهام العمل بالمزرعة</label>
                  <input
                    type="text"
                    placeholder="المسؤوليات، السكن، عهدة العنابر..."
                    value={empNotes}
                    onChange={e => setEmpNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmpForm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2 rounded-lg font-bold shadow transition"
                >
                  {editingEmpId ? 'تحديث البيانات' : 'حفظ الموظف الجديد'}
                </button>
              </div>
            </form>
          )}

          {/* Database Master Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">قاعدة بيانات وسجل العاملين بالمزرعة (إعدادات)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  البيانات الأساسية، الأرقام القومية، والرواتب التعاقدية وحالات الاستمرار
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="relative min-w-[180px]">
                  <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="بحث بالاسم، الرقم القومي..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold"
                >
                  <option value="ALL">جميع الوظائف</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold"
                >
                  <option value="ALL">جميع الحالات</option>
                  <option value="منتظم">منتظم فقط</option>
                  <option value="ترك العمل">ترك العمل</option>
                  <option value="إجازة">إجازة</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-3 text-center">م</th>
                    <th className="p-3">اسم الموظف</th>
                    <th className="p-3">الوظيفة</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">رقم الهاتف</th>
                    <th className="p-3">الرقم القومي</th>
                    <th className="p-3">تاريخ الالتحاق</th>
                    <th className="p-3">تاريخ ترك العمل</th>
                    <th className="p-3 text-center">الراتب الأساسي</th>
                    <th className="p-3">ملاحظات</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp, idx) => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900 whitespace-nowrap">{emp.name}</td>
                      <td className="p-3 text-slate-700 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {emp.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.status === 'منتظم' || emp.status === 'نشط' ? 'bg-emerald-100 text-emerald-800' :
                          emp.status === 'ترك العمل' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-mono whitespace-nowrap" dir="ltr">{emp.phone || '-'}</td>
                      <td className="p-3 text-slate-600 font-mono whitespace-nowrap">{emp.nationalId || '-'}</td>
                      <td className="p-3 text-slate-500">{emp.hireDate || '-'}</td>
                      <td className="p-3 text-slate-500">{emp.leaveDate || '-'}</td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-800">
                        {emp.salary.toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="p-3 text-slate-500 text-[11px] max-w-[150px] truncate">{emp.notes || '-'}</td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditEmp(emp)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                            title="تعديل البيانات"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmp(emp.id)}
                            className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                            title="حذف الموظف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold text-xs">
                    <td colSpan={8} className="p-3 text-center">
                      إجمالي رواتب العاملين المنتظمين فقط =SUMIF(الحالة="منتظم", الراتب الأساسي)
                    </td>
                    <td className="p-3 text-center font-mono font-black text-emerald-300 text-sm">
                      {totalBasePayroll.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* QUICK ADVANCE MODAL (نافذة صرف سلفة فورية لليومية) */}
      {/* ------------------------------------------------------------- */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <HandCoins className="w-5 h-5 text-amber-400" />
                <span>صرف سلفة نقدية لموظف وقيدها في اليومية</span>
              </div>
              <button 
                onClick={() => setShowAdvanceModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdvance} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اختر الموظف أو العامل *</label>
                <select
                  value={advanceEmpId}
                  onChange={(e) => setAdvanceEmpId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- اضغط للاختيار --</option>
                  {regularEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مبلغ السلفة (ج.م) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="مثال: 500"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الصرف</label>
                  <input
                    type="date"
                    value={advanceDate}
                    onChange={(e) => setAdvanceDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">طريقة الصرف (من أين صُرفت؟)</label>
                <select
                  value={advancePaymentMethod}
                  onChange={(e) => setAdvancePaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-semibold"
                >
                  <option value="نقداً من العهدة النقدية">نقداً من العهدة النقدية</option>
                  <option value="تحويل بنكي direct bank">تحويل بنكي direct bank</option>
                  <option value="إيراد مبيعات نقدي">إيراد مبيعات نقدي</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">البيان والشرح</label>
                <input
                  type="text"
                  placeholder="مثال: سلفة نقدية على المرتب لمصاريف عائلية"
                  value={advanceStatement}
                  onChange={(e) => setAdvanceStatement(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                💡 بمجرد الحفظ، سيتم تسجيل سند صرف باليومية العامة وقيدها بحساب "سلف عاملين" (داخلي)، وستظهر تلقائياً مخصومة من كشف المرتبات الداخلي لهذا الموظف منفصلة عن مشتروات البيض.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow"
                >
                  حفظ وقيد السلفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* QUICK EMPLOYEE PURCHASE MODAL (نافذة قيد مشتروات بيض/فرزة لعامل) */}
      {/* ------------------------------------------------------------- */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-blue-800 to-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShoppingBag className="w-5 h-5 text-blue-300" />
                <span>قيد مبيعات / مشتروات بيض لعامل بالآجل</span>
              </div>
              <button 
                onClick={() => setShowPurchaseModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeePurchase} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الموظف أو العامل المشتري *</label>
                <select
                  value={purchaseEmpId}
                  onChange={(e) => setPurchaseEmpId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- اضغط للاختيار --</option>
                  {regularEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">البيان / صنف المشتروات *</label>
                <input
                  type="text"
                  placeholder="مثال: طبق بيض كسر، طبق بيض دبل، فراخ فرزة..."
                  value={purchaseItemName}
                  onChange={(e) => setPurchaseItemName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العدد / الكمية *</label>
                  <input
                    type="number"
                    min="1"
                    value={purchaseQuantity}
                    onChange={(e) => setPurchaseQuantity(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر الوحدة (ج.م) *</label>
                  <input
                    type="number"
                    min="1"
                    value={purchaseUnitPrice}
                    onChange={(e) => setPurchaseUnitPrice(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                <span className="font-bold text-blue-900">إجمالي المبلغ الواجب الخصم من الراتب:</span>
                <span className="font-mono font-black text-blue-800 text-base">
                  {(purchaseQuantity * purchaseUnitPrice).toLocaleString('ar-EG')} ج.م
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ الحركة</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                💡 تقيد كـ مبيعات في اليومية (آجل خصم من الراتب)، وتظهر فوراً في عمود المشتروات بكشف المرتبات الداخلي للعامل، مع كشف حساب تفصيلي بأصنافها وأعدادها.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold shadow"
                >
                  تسجيل وقيد المشتروات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EMPLOYEE PURCHASE STATEMENT MODAL (كشف حساب تفصيلي بمشتروات العامل) */}
      {/* ------------------------------------------------------------- */}
      {viewingPurchaseEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <FileText className="w-5 h-5 text-blue-300" />
                <span>كشف حساب تفصيلي بمشتروات العامل: {viewingPurchaseEmp.name}</span>
              </div>
              <button 
                onClick={() => setViewingPurchaseEmp(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">اسم العامل:</span>
                  <span className="font-bold text-slate-900 text-sm">{viewingPurchaseEmp.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">الوظيفة:</span>
                  <span className="font-semibold text-slate-700">{viewingPurchaseEmp.role}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">فترة الكشف:</span>
                  <span className="font-bold text-blue-800 font-mono">شهر {state.currentMonth}</span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 text-center">م</th>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5">البيان / الصنف</th>
                      <th className="p-2.5 text-center">العدد</th>
                      <th className="p-2.5 text-center">السعر</th>
                      <th className="p-2.5 text-center text-blue-900 bg-blue-50">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getEmployeePurchasesThisMonth(viewingPurchaseEmp).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          لا توجد مشتروات مسجلة لهذا العامل في الشهر الحالي.
                        </td>
                      </tr>
                    ) : (
                      getEmployeePurchasesThisMonth(viewingPurchaseEmp).map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-2.5 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap">{item.date}</td>
                          <td className="p-2.5 font-bold text-slate-800">{item.statement}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-700">{item.quantity || 1}</td>
                          <td className="p-2.5 text-center font-mono text-slate-600">
                            {item.unitPrice ? `${item.unitPrice.toLocaleString('ar-EG')} ج.م` : '-'}
                          </td>
                          <td className="p-2.5 text-center font-mono font-black text-blue-700 bg-blue-50/50 whitespace-nowrap">
                            {item.amount.toLocaleString('ar-EG')} ج.م
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {getEmployeePurchasesThisMonth(viewingPurchaseEmp).length > 0 && (
                    <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0">
                      <tr>
                        <td colSpan={5} className="p-2.5 text-center">إجمالي مشتروات البيض الواجبة الخصم من الراتب:</td>
                        <td className="p-2.5 text-center font-mono font-black text-blue-300 whitespace-nowrap">
                          {getEmployeePurchasesThisMonth(viewingPurchaseEmp).reduce((s, e) => s + e.amount, 0).toLocaleString('ar-EG')} ج.م
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const text = `كشف حساب مشتروات العامل: ${viewingPurchaseEmp.name}\nشهر: ${state.currentMonth}\nالإجمالي: ${getEmployeePurchasesThisMonth(viewingPurchaseEmp).reduce((s, e) => s + e.amount, 0).toLocaleString('ar-EG')} ج.م\nتفاصيل:\n` + 
                      getEmployeePurchasesThisMonth(viewingPurchaseEmp).map((e, i) => `${i+1}. ${e.date}: ${e.statement} = ${e.amount} ج.م`).join('\n');
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة عبر واتساب</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingPurchaseEmp(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
