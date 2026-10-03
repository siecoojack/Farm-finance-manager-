import React, { useState } from 'react';
import { Package, PlusCircle, Trash2, Edit2, Calendar } from 'lucide-react';
import { AppState, InventoryItem } from '../../types';

interface InventoryTabProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({ state, setState }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'علف' | 'أدوية'>('علف');
  const [unit, setUnit] = useState('كجم');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [openingBalance, setOpeningBalance] = useState<string>('0');
  const [received, setReceived] = useState<string>('0');
  const [consumed, setConsumed] = useState<string>('0');

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const opening = Number(openingBalance);
    const rec = Number(received);
    const cons = Number(consumed);
    const closing = opening + rec - cons;

    if (editingId) {
      setState(prev => ({
        ...prev,
        inventory: prev.inventory.map(item => item.id === editingId ? {
          ...item,
          name, category, unit, openingBalance: opening, received: rec, consumed: cons, closingBalance: closing, date
        } : item)
      }));
    } else {
      const newItem: InventoryItem = {
        id: `INV-${Date.now()}`,
        name, category, unit, openingBalance: opening, received: rec, consumed: cons, closingBalance: closing,
        date,
        monthKey: state.currentMonth
      };
      setState(prev => ({
        ...prev,
        inventory: [...prev.inventory, newItem]
      }));
    }
    
    // Reset Form
    setShowForm(false);
    setEditingId(null);
    setName('');
    setOpeningBalance('0');
    setReceived('0');
    setConsumed('0');
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setUnit(item.unit);
    setDate(item.date);
    setOpeningBalance(String(item.openingBalance));
    setReceived(String(item.received));
    setConsumed(String(item.consumed));
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
      setState(prev => ({
        ...prev,
        inventory: prev.inventory.filter(item => item.id !== id)
      }));
    }
  };

  const InventoryTable = ({ category, title }: { category: 'علف' | 'أدوية', title: string }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="p-4 bg-slate-50 border-b font-bold text-slate-800">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs min-w-[600px]">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">التاريخ</th>
              <th className="p-3">الصنف</th>
              <th className="p-3">رصيد سابق</th>
              <th className="p-3">الوارد</th>
              <th className="p-3">المنصرف</th>
              <th className="p-3">الرصيد المتبقي</th>
              <th className="p-3 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {state.inventory.filter(i => i.category === category && i.monthKey === state.currentMonth).map(item => (
              <tr key={item.id} className="border-t hover:bg-slate-50">
                <td className="p-3 whitespace-nowrap">{item.date}</td>
                <td className="p-3 font-bold whitespace-nowrap">{item.name}</td>
                <td className="p-3 whitespace-nowrap">{item.openingBalance} {item.unit}</td>
                <td className="p-3 text-emerald-700 font-bold whitespace-nowrap">+{item.received}</td>
                <td className="p-3 text-rose-700 font-bold whitespace-nowrap">-{item.consumed}</td>
                <td className="p-3 font-black text-slate-900 whitespace-nowrap">{item.closingBalance} {item.unit}</td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-emerald-600 p-1"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-emerald-800" />
          إدارة مخزون المزرعة
        </h2>
        <button
          onClick={() => { setShowForm(!showForm); if(!showForm) setEditingId(null); }}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showForm ? 'إغلاق' : 'إضافة صنف جديد'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveItem} className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">اسم الصنف</label>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} required className="w-full p-2 border rounded-lg text-xs" />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الفئة</label>
                <select value={category} onChange={e=>setCategory(e.target.value as any)} className="w-full p-2 border rounded-lg text-xs">
                    <option value="علف">علف</option>
                    <option value="أدوية">أدوية</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">التاريخ</label>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} required className="w-full p-2 border rounded-lg text-xs" />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الوحدة (كجم، لتر..)</label>
                <input type="text" value={unit} onChange={e=>setUnit(e.target.value)} required className="w-full p-2 border rounded-lg text-xs" />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">رصيد سابق</label>
                <input type="number" value={openingBalance} onChange={e=>setOpeningBalance(e.target.value)} required className="w-full p-2 border rounded-lg text-xs" />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الوارد</label>
                <input type="number" value={received} onChange={e=>setReceived(e.target.value)} required className="w-full p-2 border rounded-lg text-xs" />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">المنصرف</label>
                <input type="number" value={consumed} onChange={e=>setConsumed(e.target.value)} required className="w-full p-2 border rounded-lg text-xs" />
             </div>
          </div>
          <button type="submit" className="bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold text-xs">حفظ الصنف</button>
        </form>
      )}

      <InventoryTable category="علف" title="مخزون العلف" />
      <InventoryTable category="أدوية" title="مخزون الأدوية" />
    </div>
  );
};
