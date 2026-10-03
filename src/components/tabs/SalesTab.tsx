import React, { useState } from 'react';
import { ShoppingCart, PlusCircle, Gift, CreditCard, Trash2, X, Edit2 } from 'lucide-react';
import { AppState, GiftCreditSale } from '../../types';

interface SalesTabProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const SalesTab: React.FC<SalesTabProps> = ({ state, setState }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const salesEntries = state.journalEntries.filter(entry => entry.type === 'مبيعات' && entry.monthKey === state.currentMonth);
  const giftCreditSales = state.salesEntries.filter(entry => entry.monthKey === state.currentMonth);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [statement, setStatement] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);

  const handleSaveGiftCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
        setState(prev => ({ ...prev, salesEntries: prev.salesEntries.map(e => e.id === editingId ? {
            ...e, date, statement, isGift, recipient, quantity, unitPrice, total: quantity * unitPrice
        } : e) }));
    } else {
        const newEntry: GiftCreditSale = {
            id: `GCS-${Date.now()}`,
            date,
            statement,
            isGift,
            recipient,
            quantity,
            unitPrice,
            total: quantity * unitPrice,
            monthKey: state.currentMonth
        };
        setState(prev => ({ ...prev, salesEntries: [...prev.salesEntries, newEntry] }));
    }
    
    setShowModal(false);
    setEditingId(null);
    setStatement('');
    setRecipient('');
    setQuantity(0);
    setUnitPrice(0);
  }

  const editGiftCredit = (entry: GiftCreditSale) => {
      setEditingId(entry.id);
      setDate(entry.date);
      setStatement(entry.statement);
      setIsGift(entry.isGift);
      setRecipient(entry.recipient);
      setQuantity(entry.quantity);
      setUnitPrice(entry.unitPrice);
      setShowModal(true);
  }

  const deleteGiftCredit = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      setState(prev => ({
        ...prev,
        salesEntries: prev.salesEntries.filter(item => item.id !== id)
      }));
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-emerald-800" />
          سجل المبيعات والتفاصيل
        </h2>
        <button
          onClick={() => { setShowModal(true); setEditingId(null); }}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          إضافة هدية / آجل
        </button>
      </div>

      {/* Cash Sales from Journal */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-4 bg-emerald-50 border-b font-bold text-emerald-800">المبيعات النقدية (مرحل من اليومية)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-[800px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">التاريخ</th>
                <th className="p-3">المستند</th>
                <th className="p-3">البيان</th>
                <th className="p-3">العدد</th>
                <th className="p-3">سعر الوحدة</th>
                <th className="p-3">القيمة الإجمالية</th>
              </tr>
            </thead>
            <tbody>
              {salesEntries.map(entry => (
                <tr key={entry.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 whitespace-nowrap">{entry.date}</td>
                  <td className="p-3 whitespace-nowrap">{entry.voucherNo}</td>
                  <td className="p-3 font-bold">{entry.statement}</td>
                  <td className="p-3">{entry.quantity || '-'}</td>
                  <td className="p-3">{entry.unitPrice ? entry.unitPrice.toLocaleString() : '-'}</td>
                  <td className="p-3 font-black text-emerald-700 whitespace-nowrap">{entry.amount.toLocaleString()} ج.م</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gift/Credit Sales */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-amber-50 border-b font-bold text-amber-800">الهدايا والمبيعات الآجلة</div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-[800px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">التاريخ</th>
                <th className="p-3">البيان</th>
                <th className="p-3">النوع</th>
                <th className="p-3">المستلم/الجهة</th>
                <th className="p-3">العدد</th>
                <th className="p-3">السعر</th>
                <th className="p-3">القيمة</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {giftCreditSales.map(entry => (
                <tr key={entry.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 whitespace-nowrap">{entry.date}</td>
                  <td className="p-3 font-bold">{entry.statement}</td>
                  <td className="p-3">{entry.isGift ? <Gift className="w-4 h-4 text-amber-600"/> : <CreditCard className="w-4 h-4 text-blue-600"/>}</td>
                  <td className="p-3">{entry.recipient}</td>
                  <td className="p-3">{entry.quantity}</td>
                  <td className="p-3">{entry.unitPrice.toLocaleString()}</td>
                  <td className="p-3 font-black">{entry.total.toLocaleString()}</td>
                  <td className="p-3 text-center flex items-center justify-center gap-1">
                    <button onClick={() => editGiftCredit(entry)} className="text-slate-400 hover:text-emerald-600"><Edit2 size={14} /></button>
                    <button onClick={() => deleteGiftCredit(entry.id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <form onSubmit={handleSaveGiftCredit} className="bg-white p-6 rounded-2xl w-full max-w-lg space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold">إضافة حركة (هدية / آجل)</h3>
                    <button type="button" onClick={() => setShowModal(false)}><X size={20}/></button>
                </div>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} required className="w-full p-2 border rounded"/>
                <input type="text" placeholder="البيان" value={statement} onChange={e=>setStatement(e.target.value)} required className="w-full p-2 border rounded"/>
                <div className="flex gap-4">
                    <label className="flex items-center gap-1"><input type="radio" checked={isGift} onChange={()=>setIsGift(true)} /> هدية</label>
                    <label className="flex items-center gap-1"><input type="radio" checked={!isGift} onChange={()=>setIsGift(false)} /> آجل</label>
                </div>
                <input type="text" placeholder="اسم المستلم / الجهة" value={recipient} onChange={e=>setRecipient(e.target.value)} required className="w-full p-2 border rounded"/>
                <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="العدد" value={quantity || ''} onChange={e=>setQuantity(Number(e.target.value))} required className="p-2 border rounded"/>
                    <input type="number" placeholder="سعر الوحدة" value={unitPrice || ''} onChange={e=>setUnitPrice(Number(e.target.value))} required className="p-2 border rounded"/>
                </div>
                <button type="submit" className="w-full bg-emerald-700 text-white p-2 rounded font-bold">حفظ الحركة</button>
            </form>
        </div>
      )}
    </div>
  );
};
