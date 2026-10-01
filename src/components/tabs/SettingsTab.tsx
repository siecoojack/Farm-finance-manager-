import React, { useState } from 'react';
import { Layers, Plus, Trash2, Shield, Settings, CheckCircle2, X, Smartphone, Download, SlidersVertical, Image as ImageIcon } from 'lucide-react';
import { AppState, DropdownOption } from '../../types';

interface SettingsTabProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ state, setState }) => {
  // Dropdown Form State
  const [showDropdownForm, setShowDropdownForm] = useState(false);
  const [drpType, setDrpType] = useState<DropdownOption['type']>('category');
  const [drpName, setDrpName] = useState('');
  const [drpDescription, setDrpDescription] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'sector' | 'category' | 'payment_method' | 'custodian'>('ALL');

  // Bottom Navigation Lift State for Android 3-Button Navigation
  const [bottomLift, setBottomLift] = useState<'compact' | 'elevated' | 'high'>(() => {
    return (localStorage.getItem('farm_bottom_lift') as any) || 'elevated';
  });

  const handleUpdateBottomLift = (val: 'compact' | 'elevated' | 'high') => {
    setBottomLift(val);
    localStorage.setItem('farm_bottom_lift', val);
    window.dispatchEvent(new Event('storage'));
  };

  const handleDownloadAppIcon = () => {
    const link = document.createElement('a');
    link.href = '/icon-512.png';
    link.download = 'farm-app-icon.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add Dropdown Item
  const handleAddDropdown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drpName.trim()) return;

    const newItem: DropdownOption = {
      id: `DRP-${Date.now()}`,
      type: drpType,
      name: drpName.trim(),
      description: drpDescription.trim() || undefined
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
    setState(prev => ({
      ...prev,
      dropdowns: prev.dropdowns.filter(d => d.id !== id)
    }));
  };

  const sectors = state.dropdowns.filter(d => d.type === 'sector');
  const categories = state.dropdowns.filter(d => d.type === 'category');
  const paymentMethods = state.dropdowns.filter(d => d.type === 'payment_method');
  const custodians = state.dropdowns.filter(d => d.type === 'custodian');

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Header and Add Button */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
              <Layers className="w-5 h-5 text-emerald-700" />
              <h3>إعداد جداول القوائم المنسدلة (Dropdown Lists Management)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              القطاعات، بنود المصروفات، طرق الدفع والسندات، وأمناء العهد المستخدمة في القوائم المنسدلة في صفحات الإدخال واليومية.
            </p>
          </div>

          <button
            onClick={() => setShowDropdownForm(!showDropdownForm)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{showDropdownForm ? 'إغلاق النموذج' : 'إضافة بند / خيار جديد'}</span>
          </button>
        </div>

        {/* Add Dropdown Option Form */}
        {showDropdownForm && (
          <form onSubmit={handleAddDropdown} className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-300 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <span className="font-bold text-emerald-900">إضافة خيار أو بند جديد إلى القوائم المنسدلة</span>
              <button type="button" onClick={() => setShowDropdownForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع القائمة *</label>
                <select
                  value={drpType}
                  onChange={e => setDrpType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                >
                  <option value="category">بند مصروف (Category)</option>
                  <option value="sector">قطاع المزرعة (Farm Sector)</option>
                  <option value="payment_method">طريقة الدفع / نوع السند (Payment Method)</option>
                  <option value="custodian">أمين عهدة / مسؤول (Custodian)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم البند / الخيار *</label>
                <input
                  type="text"
                  placeholder="مثال: قطاع النخيل، وقود، تحويل فودافون كاش..."
                  value={drpName}
                  onChange={e => setDrpName(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوصف أو الملاحظات (اختياري)</label>
                <input
                  type="text"
                  placeholder="توضيح مختصر عن البند..."
                  value={drpDescription}
                  onChange={e => setDrpDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg font-bold shadow transition"
              >
                إضافة للقائمة المحددة
              </button>
            </div>
          </form>
        )}

        {/* 4 Dropdown Grid Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          {/* Sectors */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-emerald-900">🌾 قطاعات المزرعة ({sectors.length})</h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">Sectors</span>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {sectors.map(d => (
                <div key={d.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 hover:border-emerald-300 transition">
                  <div>
                    <span className="font-bold text-slate-800">{d.name}</span>
                    {d.description && <span className="block text-[10px] text-slate-400">{d.description}</span>}
                  </div>
                  <button 
                    onClick={() => handleDeleteDropdown(d.id)} 
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-emerald-900">📂 بنود المصروفات ({categories.length})</h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">Categories</span>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {categories.map(d => (
                <div key={d.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 hover:border-emerald-300 transition">
                  <div>
                    <span className="font-bold text-slate-800">{d.name}</span>
                    {d.description && <span className="block text-[10px] text-slate-400">{d.description}</span>}
                  </div>
                  <button 
                    onClick={() => handleDeleteDropdown(d.id)} 
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-emerald-900">💳 طرق الدفع والسندات ({paymentMethods.length})</h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">Payments</span>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {paymentMethods.map(d => (
                <div key={d.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 hover:border-emerald-300 transition">
                  <div>
                    <span className="font-bold text-slate-800">{d.name}</span>
                    {d.description && <span className="block text-[10px] text-slate-400">{d.description}</span>}
                  </div>
                  <button 
                    onClick={() => handleDeleteDropdown(d.id)} 
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Custodians */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-emerald-900">🛡️ أمناء العهد والصناديق ({custodians.length})</h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">Custodians</span>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {custodians.map(d => (
                <div key={d.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 hover:border-emerald-300 transition">
                  <div>
                    <span className="font-bold text-slate-800">{d.name}</span>
                    {d.description && <span className="block text-[10px] text-slate-400">{d.description}</span>}
                  </div>
                  <button 
                    onClick={() => handleDeleteDropdown(d.id)} 
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Android APK, Official App Icon & Navigation Lift Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
            <Smartphone className="w-5 h-5 text-emerald-700" />
            <h3>إعدادات تطبيق الأندرويد واستخراج الـ APK وحل مشكلة أزرار الهاتف</h3>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
            Android Support
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Official App Icon for WebIntoApp */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
            <div className="flex items-start gap-3">
              <img 
                src="/icon-512.png" 
                alt="أيقونة مزرعة دواجن الأمهات" 
                className="w-20 h-20 rounded-2xl shadow-md border-2 border-emerald-600 shrink-0 object-cover bg-emerald-950" 
              />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm">أيقونة مزرعة دواجن الأمهات الرسمية (512×512)</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  تصميم مخصص لمزرعة دواجن أمهات (دجاجة بنية وديك أبيض بعرف أحمر مع أعمدة بيانية وسهم نمو صاعد). حمّل هذه الأيقونة المجهزة رسمياً واخترها في خطوة <strong>Upload My Icon</strong> في WebIntoApp لتظهر كأيقونة التطبيق على شاشة هاتفك.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadAppIcon}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>تحميل أيقونة مزرعة الدواجن لهاتفك (PNG)</span>
            </button>
          </div>

          {/* Card 2: Bottom Navigation Bar Lift & Immersive Auto-Hide */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                  <SlidersVertical className="w-4 h-4 text-emerald-700" />
                  التحكم بأزرار أندرويد (إخفاء تلقائي / رفع الشريط)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                لجعل أزرار أندرويد تختفي تلقائياً ولا تظهر إلا عند السحب لأعلى، اضغط على زر <strong>ملء الشاشة</strong> في الشريط العلوي أو السفلي. وفي WebIntoApp، فعّل خيار <strong>Full Screen Mode</strong>.
              </p>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => handleUpdateBottomLift('compact')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 transition ${
                    bottomLift === 'compact'
                      ? 'border-emerald-600 bg-emerald-100 text-emerald-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>عادي</span>
                  <span className="text-[10px] text-slate-400">لشاشات اللمس</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateBottomLift('elevated')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 transition ${
                    bottomLift === 'elevated'
                      ? 'border-emerald-600 bg-emerald-100 text-emerald-900 font-bold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>مرتفع (48px)</span>
                  <span className="text-[10px] text-emerald-700 font-bold">موصى به للأزرار</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateBottomLift('high')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 transition ${
                    bottomLift === 'high'
                      ? 'border-emerald-600 bg-emerald-100 text-emerald-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>مرتفع جداً (64px)</span>
                  <span className="text-[10px] text-slate-400">شاشات كبيرة</span>
                </button>
              </div>
            </div>

            <p className="text-[10px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
              💡 نصيحة: وضع ملء الشاشة يُخفي أزرار أندرويد تلقائياً تماماً ولا تظهر إلا عند السحب من الأسفل لأعلى!
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
