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
  Filter, 
  UserCheck, 
  Calendar,
  Briefcase
} from 'lucide-react';
import { AppState, Employee } from '../../types';

interface EmployeesTabProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const EmployeesTab: React.FC<EmployeesTabProps> = ({ state, setState }) => {
  // Employee Form State
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empFormError, setEmpFormError] = useState<string | null>(null);

  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('عامل مزرعة');
  const [empPhone, setEmpPhone] = useState('');
  const [empSalary, setEmpSalary] = useState<string>('');
  const [empStatus, setEmpStatus] = useState<Employee['status']>('نشط');
  const [empHireDate, setEmpHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [empNotes, setEmpNotes] = useState('');

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Stats
  const activeEmployees = state.employees.filter(e => e.status === 'نشط');
  const totalPayroll = activeEmployees.reduce((sum, e) => sum + e.salary, 0);

  // Save / Update Employee
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
          role: empRole,
          phone: empPhone.trim(),
          salary: Number(empSalary),
          status: empStatus,
          hireDate: empHireDate,
          notes: empNotes.trim()
        } : emp)
      }));
    } else {
      // Add
      const newEmp: Employee = {
        id: `EMP-${String(state.employees.length + 1).padStart(2, '0')}`,
        name: empName.trim(),
        role: empRole,
        phone: empPhone.trim(),
        salary: Number(empSalary),
        status: empStatus,
        hireDate: empHireDate,
        notes: empNotes.trim()
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
    setState(prev => ({
      ...prev,
      employees: prev.employees.filter(emp => emp.id !== id)
    }));
  };

  // Filtered List
  const filteredEmployees = state.employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.phone.includes(searchTerm);
    const matchesRole = filterRole === 'ALL' || emp.role === filterRole;
    const matchesStatus = filterStatus === 'ALL' || emp.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const uniqueRoles = Array.from(new Set(state.employees.map(e => e.role)));

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">إجمالي الموظفين والعمال</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{state.employees.length}</h3>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-bold">مسجلين في قاعدة بيانات المزرعة</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">الموظفون على رأس العمل</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{activeEmployees.length}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">حالة العمل: نشط</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100/70 text-emerald-800 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">إجمالي مسير الرواتب الشهري</p>
            <h3 className="text-2xl font-black text-emerald-800 mt-1">
              {totalPayroll.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">للعمال والموظفين النشطين</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-900">إضافة كادر جديد</span>
            <p className="text-xs text-emerald-700 mt-0.5">تسجيل عامل أو فني أو مهندس جديد</p>
          </div>
          <button
            onClick={() => {
              setEditingEmpId(null);
              setShowEmpForm(!showEmpForm);
            }}
            className="mt-3 w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showEmpForm ? 'إغلاق النموذج' : 'إضافة موظف جديد'}</span>
          </button>
        </div>
      </div>

      {/* Employee Form (Add/Edit) */}
      {showEmpForm && (
        <form onSubmit={handleSaveEmployee} className="bg-white p-5 rounded-2xl border-2 border-emerald-600 shadow-md space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <UserPlus className="w-5 h-5 text-emerald-700" />
              <span>{editingEmpId ? 'تعديل بيانات موظف' : 'تسجيل موظف أو عامل جديد بالمزرعة'}</span>
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
              <label className="block font-bold text-slate-700 mb-1">الاسم الكامل *</label>
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
                placeholder="مثال: عامل ري، مهندس زراعي، فني صيانة..."
                value={empRole}
                onChange={e => setEmpRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
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
                min="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الهاتف للتواصل</label>
              <input
                type="text"
                placeholder="مثال: 01012345678"
                value={empPhone}
                onChange={e => setEmpPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">حالة العمل</label>
              <select
                value={empStatus}
                onChange={e => setEmpStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
              >
                <option value="نشط">نشط (على رأس العمل)</option>
                <option value="إجازة">إجازة</option>
                <option value="موقوف">موقوف مؤقتاً</option>
                <option value="مستقيل">مستقيل / مغادر</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">تاريخ مباشرة العمل</label>
              <input
                type="date"
                value={empHireDate}
                onChange={e => setEmpHireDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">ملاحظات إضافية أو تفاصيل السكن والمهام</label>
              <input
                type="text"
                placeholder="تفاصيل العهدة، السكن بالمزرعة، المهام المحددة..."
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

      {/* Employees Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        
        {/* Table Header and Search Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-800" />
              <h3 className="font-bold text-slate-900 text-base">سجل الموظفين والعمال والرواتب بالمزرعة</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              بيانات الكادر، الرواتب الشهرية، وأرقام التواصل وحالات المداومة
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search Input */}
            <div className="relative min-w-[180px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
              <input
                type="text"
                placeholder="بحث بالاسم أو الوظيفة..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Role Filter */}
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

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="نشط">نشط فقط</option>
              <option value="إجازة">إجازة</option>
              <option value="موقوف">موقوف</option>
              <option value="مستقيل">مستقيل</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3">الكود</th>
                <th className="p-3">اسم الموظف / العامل</th>
                <th className="p-3">المسمى الوظيفي</th>
                <th className="p-3">الراتب الأساسي</th>
                <th className="p-3">رقم الهاتف</th>
                <th className="p-3">تاريخ التعيين</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">ملاحظات</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    لا يوجد موظفون يطابقون خيارات البحث.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-500">{emp.id}</td>
                    <td className="p-3 font-bold text-slate-900">{emp.name}</td>
                    <td className="p-3 text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-800">
                      {emp.salary.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="p-3 text-slate-600 font-mono" dir="ltr">{emp.phone || '-'}</td>
                    <td className="p-3 text-slate-500">{emp.hireDate || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.status === 'نشط' ? 'bg-emerald-100 text-emerald-800' :
                        emp.status === 'إجازة' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px] max-w-[200px] truncate">{emp.notes || '-'}</td>
                    <td className="p-3 text-center">
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
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
