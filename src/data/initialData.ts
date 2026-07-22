import { Employee, DropdownOption, JournalEntry, MonthlySettlement } from '../types';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-01',
    name: 'مهندس أحمد علي الخولي',
    role: 'مدير المزرعة والمهندس الزراعي',
    phone: '0501234567',
    salary: 6500,
    status: 'نشط',
    hireDate: '2023-01-15',
    notes: 'مسؤول العهدة والمشتروات الكبرى'
  },
  {
    id: 'EMP-02',
    name: 'محمود عبد السلام',
    role: 'مشرف شبكات الري والطاقة',
    phone: '0559876543',
    salary: 4000,
    status: 'نشط',
    hireDate: '2023-05-10',
    notes: 'صيانة الآبار ومضخات الديزل'
  },
  {
    id: 'EMP-03',
    name: 'سعيد حسن إبراهيم',
    role: 'فني الوقاية والتسميد',
    phone: '0541122334',
    salary: 3500,
    status: 'نشط',
    hireDate: '2023-08-01',
    notes: 'مسؤول مخزن الأسمدة والمبيدات'
  },
  {
    id: 'EMP-04',
    name: 'عثمان عبد الله',
    role: 'عامل زراعي وسائق جرار',
    phone: '0563344556',
    salary: 2800,
    status: 'نشط',
    hireDate: '2024-02-20',
    notes: 'حرث ونقل المحاصيل'
  },
  {
    id: 'EMP-05',
    name: 'عمر المختار',
    role: 'حارس المزرعة والمخازن',
    phone: '0527788990',
    salary: 2500,
    status: 'إجازة',
    hireDate: '2023-11-05',
    notes: 'في إجازة سنوية'
  }
];

export const INITIAL_DROPDOWNS: DropdownOption[] = [
  // القطاعات (Sectors)
  { id: 'sec-1', type: 'sector', name: 'قطاع الإنتاج النباتي والنخيل', description: 'أشجار، مزروعات الموسم، شبكات التقطير' },
  { id: 'sec-2', type: 'sector', name: 'قطاع البيوت المحمية (الصوب)', description: 'الخضروات، الشتلات، التبريد' },
  { id: 'sec-3', type: 'sector', name: 'قطاع الآبار ومحطات الري', description: 'مضخات، مولدات الديزل، خطوط المياه' },
  { id: 'sec-4', type: 'sector', name: 'قطاع الآلات والمعدات', description: 'الجرارات، الحراثات، سيارات النقل' },
  { id: 'sec-5', type: 'sector', name: 'الإدارة والعمالة والخدمات', description: 'أجور، معيشة، ضيافة، قرطاسية' },

  // البنود (Categories)
  { id: 'cat-1', type: 'category', name: 'أسمدة ومخصبات زراعية', description: 'يوريا، NPK، عناصر صغرى' },
  { id: 'cat-2', type: 'category', name: 'مبيدات ووقاية نباتات', description: 'حشرية، فطرية، عناكب' },
  { id: 'cat-3', type: 'category', name: 'وقود وبنزين وديزل', description: 'وقود المولدات والجرارات' },
  { id: 'cat-4', type: 'category', name: 'قطع غيار وصيانة', description: 'فلاتر، خراطيم، زيت موتور، سباكة' },
  { id: 'cat-5', type: 'category', name: 'أجور وعمالة يومية', description: 'عمال جني، تقليم، عمالة خارجية' },
  { id: 'cat-6', type: 'category', name: 'رواتب موظفين ثابتة', description: 'مسيرات الرواتب الشهرية' },
  { id: 'cat-7', type: 'category', name: 'مصاريف معيشة وإعاشة عمال', description: 'تغذية، مياه شرب، غاز' },
  { id: 'cat-8', type: 'category', name: 'نقل وشحن ومهمات', description: 'أجور شحن ومستلزمات عامة' },

  // طرق الدفع (Payment Methods)
  { id: 'pay-1', type: 'payment_method', name: 'نقداً من العهدة النقدية', description: 'صرف مباشر من الخزينة النقدية' },
  { id: 'pay-2', type: 'payment_method', name: 'تحويل بنكي direct bank', description: 'حساب المزرعة البنكي' },
  { id: 'pay-3', type: 'payment_method', name: 'شيك مصرفي', description: 'شيكات المزرعة' },
  { id: 'pay-4', type: 'payment_method', name: 'بطاقة مدى / شبكة', description: 'دفع بالبطاقة' },

  // الأمناء (Custodians)
  { id: 'cust-1', type: 'custodian', name: 'عهدة مهندس أحمد علي (المهندس)', description: 'العهدة المالية الرئيسية للمزرعة' },
  { id: 'cust-2', type: 'custodian', name: 'عهدة المشرف محمود عبد السلام', description: 'عهدة الطوارئ والصيانة' },
  { id: 'cust-3', type: 'custodian', name: 'الخزينة النقدية الرئيسية للمزرعة', description: 'صندوق المزرعة' },
];

export const CURRENT_MONTH_KEY = '2026-07';

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'JRN-2026-001',
    date: '2026-07-01',
    voucherNo: 'V-001',
    category: 'قبض عهدة',
    sector: 'الإدارة والعمالة والخدمات',
    amount: 15000,
    type: 'قبض عهدة',
    paymentMethod: 'تحويل بنكي direct bank',
    custodian: 'عهدة مهندس أحمد علي (المهندس)',
    statement: 'تحويل عهدة جديدة لشهر يوليو من المكتب الرئيسي عبر الحساب البنكي',
    notes: 'مرجع التحويل #TX998231',
    monthKey: '2026-07',
    createdAt: '2026-07-01T08:30:00Z'
  },
  {
    id: 'JRN-2026-002',
    date: '2026-07-02',
    voucherNo: 'V-002',
    employeeId: 'EMP-02',
    employeeName: 'محمود عبد السلام',
    category: 'وقود وبنزين وديزل',
    sector: 'قطاع الآبار ومحطات الري',
    amount: 1850,
    type: 'مصروف',
    paymentMethod: 'نقداً من العهدة النقدية',
    custodian: 'عهدة مهندس أحمد علي (المهندس)',
    statement: 'شراء 1000 لتر ديزل لتشغيل مولدات الآبار المحطة رقم 1 ورقم 2',
    notes: 'فاتورة محطة الأمل رقم 4410',
    monthKey: '2026-07',
    createdAt: '2026-07-02T10:15:00Z'
  },
  {
    id: 'JRN-2026-003',
    date: '2026-07-04',
    voucherNo: 'V-003',
    employeeId: 'EMP-03',
    employeeName: 'سعيد حسن إبراهيم',
    category: 'أسمدة ومخصبات زراعية',
    sector: 'قطاع الإنتاج النباتي والنخيل',
    amount: 3200,
    type: 'مصروف',
    paymentMethod: 'نقداً من العهدة النقدية',
    custodian: 'عهدة مهندس أحمد علي (المهندس)',
    statement: 'شراء 20 شكارة سماد NPK متعادل + عنصر البوتاسيوم لتسميد النخيل',
    notes: 'مؤسسة النماء الزراعية - فاتورة 8821',
    monthKey: '2026-07',
    createdAt: '2026-07-04T11:00:00Z'
  },
  {
    id: 'JRN-2026-004',
    date: '2026-07-07',
    voucherNo: 'V-004',
    employeeId: 'EMP-04',
    employeeName: 'عثمان عبد الله',
    category: 'قطع غيار وصيانة',
    sector: 'قطاع الآلات والمعدات',
    amount: 750,
    type: 'مصروف',
    paymentMethod: 'نقداً من العهدة النقدية',
    custodian: 'عهدة مهندس أحمد علي (المهندس)',
    statement: 'تغيير فلاتر زيت وهيدروليك للجرار الزراعي ميسي فيرجسون',
    notes: 'ورشة الوفاء للصيانة',
    monthKey: '2026-07',
    createdAt: '2026-07-07T14:20:00Z'
  },
  {
    id: 'JRN-2026-005',
    date: '2026-07-10',
    voucherNo: 'V-005',
    category: 'أجور وعمالة يومية',
    sector: 'قطاع البيوت المحمية (الصوب)',
    amount: 1400,
    type: 'مصروف',
    paymentMethod: 'نقداً من العهدة النقدية',
    custodian: 'عهدة مهندس أحمد علي (المهندس)',
    statement: 'أجور عمالة موسومية (4 عمال × 3 أيام. تقليم وتهوية البيوت المحمية)',
    notes: 'كشف حضور وانصراف عمالة يومية مرفق',
    monthKey: '2026-07',
    createdAt: '2026-07-10T16:00:00Z'
  },
  {
    id: 'JRN-2026-006',
    date: '2026-07-12',
    voucherNo: 'V-006',
    employeeId: 'EMP-03',
    employeeName: 'سعيد حسن إبراهيم',
    category: 'مبيدات ووقاية نباتات',
    sector: 'قطاع البيوت المحمية (الصوب)',
    amount: 920,
    type: 'مصروف',
    paymentMethod: 'نقداً من العهدة النقدية',
    custodian: 'عهدة مهندس أحمد علي (المهندس)',
    statement: 'شراء مبيد حشري لمكافحة التريبس وصانعات الأنفاق بالصوب',
    notes: 'الشركة العربية للمستلزمات',
    monthKey: '2026-07',
    createdAt: '2026-07-12T09:40:00Z'
  },
  {
    id: 'JRN-2026-007',
    date: '2026-07-15',
    voucherNo: 'V-007',
    category: 'قبض عهدة',
    sector: 'الإدارة والعمالة والخدمات',
    amount: 10000,
    type: 'قبض عهدة',
    paymentMethod: 'تحويل بنكي direct bank',
    custodian: 'عهدة مهندس أحمد علي (المهندس)',
    statement: 'تعزيز عهدة المزرعة الوسطى من إدارة الحسابات بالشركة',
    notes: 'تحويل بنكي #TX999104',
    monthKey: '2026-07',
    createdAt: '2026-07-15T11:30:00Z'
  },
  {
    id: 'JRN-2026-008',
    date: '2026-07-18',
    voucherNo: 'V-008',
    employeeId: 'EMP-01',
    employeeName: 'مهندس أحمد علي الخولي',
    category: 'مصاريف معيشة وإعاشة عمال',
    sector: 'الإدارة والعمالة والخدمات',
    amount: 1150,
    type: 'مصروف',
    paymentMethod: 'نقداً من العهدة النقدية',
    custodian: 'عهدة مهندس أحمد علي (المهندس)',
    statement: 'شراء مواد غذائية ومياه شرب وإعاشة لعمال المزرعة عن النصف الأول من الشهر',
    notes: 'إيصال مركز التسوق',
    monthKey: '2026-07',
    createdAt: '2026-07-18T13:10:00Z'
  },
  {
    id: 'JRN-2026-009',
    date: '2026-07-20',
    voucherNo: 'V-009',
    employeeId: 'EMP-02',
    employeeName: 'محمود عبد السلام',
    category: 'قطع غيار وصيانة',
    sector: 'قطاع الآبار ومحطات الري',
    amount: 1300,
    type: 'مصروف',
    paymentMethod: 'نقداً من العهدة النقدية',
    custodian: 'عهدة مهندس أحمد علي (المهندس)',
    statement: 'إصلاح طلمبة غاطس البئر رقم 3 وتغيير جلب نحاس وخراطيم 3 بوصة',
    notes: 'مركز صيانة الهيدروليك',
    monthKey: '2026-07',
    createdAt: '2026-07-20T15:45:00Z'
  }
];

export const INITIAL_SETTLEMENTS: Record<string, MonthlySettlement> = {
  '2026-07': {
    monthKey: '2026-07',
    monthName: 'يوليو 2026',
    custodianName: 'مهندس أحمد علي الخولي',
    openingBalance: 3200, // رصيد سابق مرحل من يونيو
    totalAdvancesReceived: 25000, // (15000 + 10000)
    totalExpenses: 10570,
    totalSalaries: 0,
    closingBalance: 17630, // (3200 + 25000 - 10570)
    notes: 'تم إعداد الكشف ومطابقته مع الفواتير الأصلية الجاهزة للإرسال للمكتب الرئيسي',
    status: 'مسودة',
    updatedAt: new Date().toISOString()
  }
};
