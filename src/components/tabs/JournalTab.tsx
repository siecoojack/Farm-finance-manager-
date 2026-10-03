import React, { useState } from 'react';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Printer, 
  ArrowUpLeft, 
  ArrowDownRight, 
  Wallet, 
  Receipt, 
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AppState, JournalEntry } from '../../types';

interface JournalTabProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onOpenVoucher: (entry: JournalEntry) => void;
}

export const JournalTab: React.FC<JournalTabProps> = ({
  state,
  setState,
  onOpenVoucher
}) => {
  const currentMonthEntries = state.journalEntries.filter(e => e.monthKey === state.currentMonth);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherNo, setVoucherNo] = useState(`V-${String(currentMonthEntries.length + 1).padStart(3, '0')}`);
  const [type, setType] = useState<JournalEntry['type']>('مصروف');
  const [isInternal, setIsInternal] = useState(false); // Added
  const [isGift, setIsGift] = useState(false); // Added
  const [recipient, setRecipient] = useState(''); // Added
  const [sector, setSector] = useState(state.dropdowns.find(d => d.type === 'sector')?.name || 'قطاع الآبار ومحطات الري');
  const [category, setCategory] = useState(state.dropdowns.find(d => d.type === 'category')?.name || 'وقود وبنزين وديزل');
  const [amount, setAmount] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0); // Added
  const [unitPrice, setUnitPrice] = useState<number>(0); // Added
  const [paymentMethod, setPaymentMethod] = useState(state.dropdowns.find(d => d.type === 'payment_method')?.name || 'نقداً من العهدة النقدية');
  const [custodian, setCustodian] = useState(state.dropdowns.find(d => d.type === 'custodian')?.name || 'عهدة مهندس أحمد علي (المهندس)');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [statement, setStatement] = useState('');
  const [notes, setNotes] = useState('');

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterScope, setFilterScope] = useState<'ALL' | 'OFFICIAL' | 'INTERNAL'>('ALL'); // Added

  // Calculations for Active Month
  const totalAdvances = currentMonthEntries
    .filter(e => e.type === 'قبض عهدة')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = currentMonthEntries
    .filter(e => e.type === 'مصروف' || e.type === 'راتب')
    .reduce((sum, e) => sum + e.amount, 0);

  const currentSettlement = state.settlements[state.currentMonth];
  const openingBalance = currentSettlement?.openingBalance || 0;
  const netCustodyBalance = openingBalance + totalAdvances - totalExpenses;

  // Filtered entries
  const filteredEntries = currentMonthEntries.filter(e => {
    const matchesSearch = e.statement.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.employeeName && e.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSector = filterSector === 'ALL' || e.sector === filterSector;
    const matchesCategory = filterCategory === 'ALL' || e.category === filterCategory;
    const matchesType = filterType === 'ALL' || e.type === filterType;
    const matchesScope = filterScope === 'ALL' || 
                         (filterScope === 'OFFICIAL' && !e.isInternal) || 
                         (filterScope === 'INTERNAL' && e.isInternal);

    return matchesSearch && matchesSector && matchesCategory && matchesType && matchesScope;
  });

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !statement.trim()) {
      setFormError('يرجى إدخال المبلغ وقيمة البيان بشكل صحيح.');
      return;
    }
    setFormError(null);

    const selectedEmp = state.employees.find(emp => emp.id === employeeId);

    if (editingId) {
      // Edit existing entry
      setState(prev => ({
        ...prev,
        journalEntries: prev.journalEntries.map(item => item.id === editingId ? {
          ...item,
          date,
          voucherNo,
          type,
          sector,
          category,
          amount: Number(amount),
          quantity: quantity,
          unitPrice: unitPrice,
          paymentMethod,
          custodian,
          employeeId: employeeId || undefined,
          employeeName: selectedEmp?.name || undefined,
          statement,
          notes,
          monthKey: state.currentMonth,
          isInternal
        } : item)
      }));
    } else {
      // Add new entry
      const newEntry: JournalEntry = {
        id: `JRN-${Date.now()}`,
        date,
        voucherNo,
        type,
        sector,
        category,
        amount: Number(amount),
        quantity: quantity,
        unitPrice: unitPrice,
        paymentMethod,
        custodian,
        employeeId: employeeId || undefined,
        employeeName: selectedEmp?.name || undefined,
        statement,
        notes,
        monthKey: state.currentMonth,
        createdAt: new Date().toISOString(),
        isInternal
      };

      setState(prev => ({
        ...prev,
        journalEntries: [newEntry, ...prev.journalEntries]
      }));
    }

    // Reset Form
    setEditingId(null);
    setAmount('');
    setQuantity(0); // Added
    setUnitPrice(0); // Added
    setStatement('');
    setNotes('');
    setVoucherNo(`V-${String(currentMonthEntries.length + 2).padStart(3, '0')}`);
    setShowForm(false);
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setDate(entry.date);
    setVoucherNo(entry.voucherNo);
    setType(entry.type);
    setSector(entry.sector);
    setCategory(entry.category);
    setAmount(String(entry.amount));
    setQuantity(entry.quantity || 0); // Added
    setUnitPrice(entry.unitPrice || 0); // Added
    setPaymentMethod(entry.paymentMethod);
    setCustodian(entry.custodian);
    setEmployeeId(entry.employeeId || '');
    setStatement(entry.statement);
    setNotes(entry.notes || '');
    setIsInternal(entry.isInternal); // Added
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت تأكد من حذف هذا السند من اليومية؟')) {
      setState(prev => ({
        ...prev,
        journalEntries: prev.journalEntries.filter(item => item.id !== id)
      }));
    }
  };

  const sectorOptions = state.dropdowns.filter(d => d.type === 'sector');
  const categoryOptions = state.dropdowns.filter(d => d.type === 'category');
  const paymentMethodOptions = state.dropdowns.filter(d => d.type === 'payment_method');
  const custodianOptions = state.dropdowns.filter(d => d.type === 'custodian');

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Advances Received */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">المقبوضات والعهد الواردة</p>
            <h3 className="text-xl font-black text-emerald-700 mt-1">
              {totalAdvances.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">زائد الرصيد السابق ({openingBalance.toLocaleString('ar-EG')})</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">إجمالي المصروفات والمدفوعات</p>
            <h3 className="text-xl font-black text-rose-600 mt-1">
              {totalExpenses.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{currentMonthEntries.length} حركة مسجلة بالشهر</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ArrowUpLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Current Net Custody Balance */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white p-4 rounded-xl shadow flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-200">الرصيد المتبقي بالعهدة الحالية</p>
            <h3 className="text-2xl font-black text-emerald-100 mt-1">
              {netCustodyBalance.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
            </h3>
            <p className="text-[11px] text-emerald-300 mt-0.5">جاهز للتسوية للمكتب الرئيسي</p>
          </div>
          <div className="p-3 bg-emerald-700/60 rounded-xl text-emerald-200">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Action button to create voucher */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800">إدخال حركات اليومية</span>
            <p className="text-xs text-slate-600 mt-0.5">إضافة سند صرف أو إضافة عهدة جديدة بسرعة</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setShowForm(!showForm);
            }}
            className="mt-3 w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showForm ? 'إغلاق نموذج الإدخال' : 'إضافة سند يومية جديد'}</span>
          </button>
        </div>

      </div>

      {/* Entry Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2" dir="rtl">
          <form onSubmit={handleSaveEntry} className="bg-white p-6 rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-800 text-sm">
                  {editingId ? 'تعديل سند يومية' : 'إدخال سند يومية جديد'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            
            {/* Voucher No */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم السند</label>
              <input
                type="text"
                value={voucherNo}
                onChange={e => setVoucherNo(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">تاريخ الحركة</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Movement Type & Internal flag */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">نوع الحركة المالية</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="مصروف">مصروف تشغيلي (صرف)</option>
                  <option value="قبض عهدة">قبض عهدة / تعزيز (إيداع)</option>
                  <option value="راتب">سداد راتب موظف</option>
                  <option value="مبيعات">إيراد مبيعات</option>
                  <option value="تسوية">تسوية عهدة أو مرجوعات</option>
                </select>
              </div>
              
              <div>
                <label className="block text-slate-700 font-bold mb-1">نوع السند (لورقة العمل)</label>
                <div className="flex items-center gap-2 pt-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={!isInternal} onChange={() => setIsInternal(false)} className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700">رسمي (مكتب)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={isInternal} onChange={() => setIsInternal(true)} className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-rose-700">داخلي (سلف/ميس)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">المبلغ (ج.م)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="w-full bg-emerald-50/50 border border-emerald-300 rounded-lg p-2 font-black text-emerald-800 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Sales Details (Quantity/Price) */}
            <>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">العدد</label>
                  <input
                    type="number"
                    value={quantity || ''}
                    onChange={e => {
                        const q = Number(e.target.value);
                        setQuantity(q);
                        if (unitPrice > 0) setAmount(String(q * unitPrice));
                    }}
                    className="w-full bg-emerald-50/50 border border-emerald-300 rounded-lg p-2 font-black text-emerald-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">سعر الوحدة</label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPrice || ''}
                    onChange={e => {
                        const p = Number(e.target.value);
                        setUnitPrice(p);
                        if (quantity > 0) setAmount(String(quantity * p));
                    }}
                    className="w-full bg-emerald-50/50 border border-emerald-300 rounded-lg p-2 font-black text-emerald-800 text-sm"
                  />
                </div>
            </>

            {/* Farm Sector */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">قطاع المزرعة</label>
              <select
                value={sector}
                onChange={e => setSector(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                {sectorOptions.map(opt => (
                  <option key={opt.id} value={opt.name}>{opt.name}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">البند الفرعي / الفئة</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                {categoryOptions.map(opt => (
                  <option key={opt.id} value={opt.name}>{opt.name}</option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">طريقة الدفع</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                {paymentMethodOptions.map(opt => (
                  <option key={opt.id} value={opt.name}>{opt.name}</option>
                ))}
              </select>
            </div>

            {/* Custodian */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">أمين العهدة / الصندوق</label>
              <select
                value={custodian}
                onChange={e => setCustodian(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                {custodianOptions.map(opt => (
                  <option key={opt.id} value={opt.name}>{opt.name}</option>
                ))}
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Employee Selector */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">الموظف / المستلم (اختياري)</label>
              <select
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- بدون تحديد موظف --</option>
                {state.employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </div>

            {/* Statement */}
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">البيان / تفاصيل الشراء والصرف *</label>
              <input
                type="text"
                placeholder="مثال: شراء 1000 لتر ديزل لتشغيل مضخات البئر رقم 1..."
                value={statement}
                onChange={e => setStatement(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="text-xs">
            <label className="block text-slate-700 font-bold mb-1">رقم الفاتورة أو الملاحظات</label>
            <input
              type="text"
              placeholder="مثال: فاتورة محطة الأمل رقم #8821"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingId ? 'حفظ التعديلات' : 'تسجيل السند باليومية'}</span>
            </button>
          </div>
        </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="بحث بالبيان، رقم السند، أو اسم الموظف..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto text-xs">
            <div className="flex items-center gap-1 text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span className="font-semibold">تصفية:</span>
            </div>

            {/* Filter Sector */}
            <select
              value={filterSector}
              onChange={e => setFilterSector(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700"
            >
              <option value="ALL">جميع قطاعات المزرعة</option>
              {sectorOptions.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>

            {/* Filter Category */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700"
            >
              <option value="ALL">جميع البنود</option>
              {categoryOptions.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            {/* Filter Type */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700"
            >
              <option value="ALL">جميع أنواع الحركات</option>
              <option value="مصروف">مصروفات فقط</option>
              <option value="قبض عهدة">قبض عهدة فقط</option>
              <option value="راتب">رواتب فقط</option>
            </select>

            {/* Filter Scope */}
            <select
              value={filterScope}
              onChange={e => setFilterScope(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700"
            >
              <option value="ALL">الكل (رسمي + داخلي)</option>
              <option value="OFFICIAL">رسمي فقط</option>
              <option value="INTERNAL">داخلي فقط</option>
            </select>
          </div>

        </div>
      </div>

      {/* Journal Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
              سجل اليومية العامة للمصاريف ({filteredEntries.length} حركة)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            تاريخ التحديث: {new Date().toLocaleDateString('ar-EG')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold">
                <th className="p-3">رقم السند</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">النوع</th>
                <th className="p-3">القطاع / البند</th>
                <th className="p-3">البيان والشرح</th>
                <th className="p-3">المبلغ (ج.م)</th>
                <th className="p-3">طريقة الدفع / العهدة</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>لا توجد حركات مسجلة تطابق التصفية لهذا الشهر.</p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                      {entry.voucherNo}
                    </td>
                    <td className="p-3 font-mono whitespace-nowrap">{entry.date}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        entry.type === 'قبض عهدة'
                          ? 'bg-emerald-100 text-emerald-800'
                          : entry.type === 'راتب'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{entry.category}</div>
                      <div className="text-[10px] text-slate-500">{entry.sector}</div>
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="font-medium text-slate-800 line-clamp-2">{entry.statement}</div>
                      {entry.employeeName && (
                        <div className="text-[10px] text-emerald-700 mt-0.5">👤 المستلم: {entry.employeeName}</div>
                      )}
                      {entry.notes && (
                        <div className="text-[10px] text-slate-400 mt-0.5">🔖 {entry.notes}</div>
                      )}
                    </td>
                    <td className="p-3 font-black text-sm whitespace-nowrap">
                      <span className={entry.type === 'قبض عهدة' ? 'text-emerald-700' : 'text-slate-900'}>
                        {entry.amount.toLocaleString('ar-EG')} ج.م
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-600">
                      <div>{entry.paymentMethod}</div>
                      <div className="text-[10px] text-slate-400">{entry.custodian}</div>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenVoucher(entry)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                          title="معاينة سند الصرف وطباعته"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                          title="تعديل السند"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                          title="حذف السند"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
