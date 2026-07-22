import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Edit2, CheckCircle2, Shield, Settings, Layers, DollarSign, Phone, Plus, X } from 'lucide-react';
import { AppState, Employee, DropdownOption } from '../../types';

interface SettingsTabProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ state, setState }) => {
  // Employee Form State
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);

  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('عامل مزرعة');
  const [empPhone, setEmpPhone] = useState('');
  const [empSalary, setEmpSalary] = useState<string>('');
  const [empStatus, setEmpStatus] = useState<Employee['status']>('نشط');
  const [empHireDate, setEmpHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [empNotes, setEmpNotes] = useState('');

  // Dropdown Form State
  const [showDropdownForm, setShowDropdownForm] = useState(false);
  const [drpType, setDrpType] = useState<DropdownOption['type']>('category');
  const [drpName, setDrpName] = useState('');
  const [drpDescription, setDrpDescription] = useState('');

  // Save / Update Employee
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empSalary || Number(empSalary) < 0) {
      alert('يرجى إدخال اسم الموظف والراتب بشكل صحيح.');
      return;
    }

    if (editingEmpId) {
      // Edit
      setState(prev => ({
        ...prev,
        employees: prev.employees.map(emp => emp.id === editingEmpId ? {
          ...emp,
          name: empName,
          role: empRole,
          phone: empPhone,
          salary: Number(empSalary),
          status: empStatus,
          hireDate: empHireDate,
          notes: empNotes
        } : emp)
      }));
    } else {
      // Add
      const newEmp: Employee = {
        id: `EMP-${String(state.employees.length + 1).padStart(2, '0')}`,
        name: empName,
        role: empRole,
        phone: empPhone,
        salary: Number(empSalary),
        status: empStatus,
        hireDate: empHireDate,
        notes: empNotes
      };
      setState(prev => ({
        ...prev,
        employees: [...prev.employees, newEmp]
      }));
    }

    // Reset Form
    setEditingEmpId(null);
    setEmpName('');
    setEmpRole('عامل مزرعة');
    setEmpPhone('');
    setEmpSalary('');
    setEmpNotes('');
    setShowEmpForm(false);
  };

  const handleEditEmp = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setEmpName(emp.name);
    setEmpRole(emp.role);
    setEmpPhone(emp.phone);
    setEmpSalary(String(emp.salary));
    setEmpStatus(emp.status);
    setEmpHireDate(emp.hireDate || new Date().toISOString().split('T')[0]);
    setEmpNotes(emp.notes || '');
    setShowEmpForm(true);
  };

  const handleDeleteEmp = (id: string) => {
    if (confirm('هل تأكد من حذف بيانات هذا الموظف؟')) {
      setState(prev => ({
        ...prev,
        employees: prev.employees.filter(emp => emp.id !== id)
      }));
    }
  };

  // Add Dropdown Item
  const handleAddDropdown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drpName.trim()) return;

    const newItem: DropdownOption = {
      id: `DRP-${Date.now()}`,
      type: drpType,
      name: drpName.trim(),
      description: drpDescription
    };

    setState(prev => ({
      ...prev,
      dropdowns: [...prev.dropdowns, newItem]
    }));

    setDrpName('');
    setDrpDescription('');
    setShowDropdownForm(false);
  };

  const handleDeleteDropdown = (id: string) => {
    if (confirm('حذف هذا البند من القوائم المنسدلة؟')) {
      setState(prev => ({
        ...prev,
        dropdowns: prev.dropdowns.filter(d => d.id !== id)
      }));
    }
  };

  const activeEmployees = state.employees.filter(e => e.status === 'نشط');
  const totalPayroll = activeEmployees.reduce((sum, e) => sum + e.salary, 0);

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* SECTION 1: EMPLOYEES TABLE & MANAGEMENT */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
              <Users className="w-5 h-5 text-emerald-700" />
              <h3>جدول أسماء وبيانات الموظفين والعمال المعتمدين</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              إدارة أسماء العمال والمهندسين، الوظائف، أرقام الهواتف، والرواتب الأساسية.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800">
              مسير الرواتب النشطة: <span className="text-emerald-950 font-black">{totalPayroll.toLocaleString('ar-EG')} ج.م</span>
            </div>

            <button
              onClick={() => {
                setEditingEmpId(null);
                setShowEmpForm(!showEmpForm);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>
          </div>
        </div>

        {/* Employee Form */}
        {showEmpForm && (
          <form onSubmit={handleSaveEmployee} className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-300 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <span className="font-bold text-emerald-900">
                {editingEmpId ? 'تعديل بيانات موظف' : 'تسجيل موظف أو عامل جديد بالمزرعة'}
              </span>
              <button type="button" onClick={() => setShowEmpForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  placeholder="اسم الموظف أو المهندس..."
                  value={empName}
                  onChange={e => setEmpName(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المسمى الوظيفي / الدور</label>
                <input
                  type="text"
                  placeholder="مهندس، سائق، مشرف..."
                  value={empRole}
                  onChange={e => setEmpRole(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الجوال / الهاتف</label>
                <input
                  type="text"
                  placeholder="05xxxxxxx"
                  value={empPhone}
                  onChange={e => setEmpPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الراتب الشهري الأساسي (ج.م) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={empSalary}
                  onChange={e => setEmpSalary(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">حالة الموظف</label>
                <select
                  value={empStatus}
                  onChange={e => setEmpStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                >
                  <option value="نشط">نشط (على رأس العمل)</option>
                  <option value="إجازة">في إجازة</option>
                  <option value="موقوف">موقوف مؤقتاً</option>
                  <option value="مستقيل">مستقيل / مغادر</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ التعيين</label>
                <input
                  type="date"
                  value={empHireDate}
                  onChange={e => setEmpHireDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">ملاحظات / العهد المسلمة له</label>
                <input
                  type="text"
                  placeholder="ملاحظات العهدة أو الاختصاصات..."
                  value={empNotes}
                  onChange={e => setEmpNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200">
              <button
                type="button"
                onClick={() => setShowEmpForm(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-emerald-700 text-white font-bold rounded-lg shadow"
              >
                {editingEmpId ? 'حفظ التعديلات' : 'إضافة الموظف'}
              </button>
            </div>
          </form>
        )}

        {/* Employees Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                <th className="p-3">الكود</th>
                <th className="p-3">اسم الموظف / العامل</th>
                <th className="p-3">الوظيفة والمسؤولية</th>
                <th className="p-3">رقم الهاتف</th>
                <th className="p-3">الراتب الأساسي</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">ملاحظات</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {state.employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono font-bold text-slate-500">{emp.id}</td>
                  <td className="p-3 font-bold text-slate-900">{emp.name}</td>
                  <td className="p-3 text-slate-600">{emp.role}</td>
                  <td className="p-3 font-mono text-slate-600">{emp.phone || '-'}</td>
                  <td className="p-3 font-black text-emerald-800">{emp.salary.toLocaleString('ar-EG')} ج.م</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      emp.status === 'نشط' ? 'bg-emerald-100 text-emerald-800' :
                      emp.status === 'إجازة' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 text-[11px]">{emp.notes || '-'}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEditEmp(emp)}
                        className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmp(emp.id)}
                        className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* SECTION 2: DROPDOWN LISTS MANAGEMENT */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
              <Layers className="w-5 h-5 text-emerald-700" />
              <h3>إعداد جداول القوائم المنسدلة (Dropdown Tables)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              القطاعات، بنود المصروفات، طرق الدفع، وأمناء العهدة المستخدمة في القوائم المنسدلة في صفحات الإدخال.
            </p>
          </div>

          <button
            onClick={() => setShowDropdownForm(!showDropdownForm)}
            className="bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة خيار قائمة جديد</span>
          </button>
        </div>

        {/* Dropdown Form */}
        {showDropdownForm && (
          <form onSubmit={handleAddDropdown} className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع القائمة</label>
                <select
                  value={drpType}
                  onChange={e => setDrpType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                >
                  <option value="sector">قطاع من قطاعات المزرعة</option>
                  <option value="category">بند فرعي للمصروفات</option>
                  <option value="payment_method">طريقة دفع / سداد</option>
                  <option value="custodian">أمين عهدة / صندوق</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم / المسمى *</label>
                <input
                  type="text"
                  placeholder="مسمى البند أو القطاع الجديد..."
                  value={drpName}
                  onChange={e => setDrpName(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوصف الشارح</label>
                <input
                  type="text"
                  placeholder="شرح مختصر..."
                  value={drpDescription}
                  onChange={e => setDrpDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDropdownForm(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-emerald-700 text-white font-bold rounded-lg"
              >
                إضافة البند
              </button>
            </div>
          </form>
        )}

        {/* Dropdown Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Sectors */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-emerald-900 border-b border-slate-200 pb-2">
              🌾 قطاعات المزرعة (Sectors)
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {state.dropdowns.filter(d => d.type === 'sector').map(d => (
                <div key={d.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800">{d.name}</span>
                    {d.description && <span className="block text-[10px] text-slate-400">{d.description}</span>}
                  </div>
                  <button onClick={() => handleDeleteDropdown(d.id)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-emerald-900 border-b border-slate-200 pb-2">
              🏷️ بنود وفئات المصروفات (Categories)
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {state.dropdowns.filter(d => d.type === 'category').map(d => (
                <div key={d.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800">{d.name}</span>
                    {d.description && <span className="block text-[10px] text-slate-400">{d.description}</span>}
                  </div>
                  <button onClick={() => handleDeleteDropdown(d.id)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-emerald-900 border-b border-slate-200 pb-2">
              💳 طرق السندات والدفع (Payment Methods)
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {state.dropdowns.filter(d => d.type === 'payment_method').map(d => (
                <div key={d.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800">{d.name}</span>
                    {d.description && <span className="block text-[10px] text-slate-400">{d.description}</span>}
                  </div>
                  <button onClick={() => handleDeleteDropdown(d.id)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Custodians */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-emerald-900 border-b border-slate-200 pb-2">
              🛡️ أمناء العهد والصناديق (Custodians)
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {state.dropdowns.filter(d => d.type === 'custodian').map(d => (
                <div key={d.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800">{d.name}</span>
                    {d.description && <span className="block text-[10px] text-slate-400">{d.description}</span>}
                  </div>
                  <button onClick={() => handleDeleteDropdown(d.id)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
