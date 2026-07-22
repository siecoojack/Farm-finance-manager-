import { MonthlySettlement, JournalEntry } from '../types';

/**
 * Formats a clean WhatsApp text report summary for the active month (in Egyptian Pounds)
 */
export function buildWhatsAppReportMessage(
  monthKey: string,
  settlement?: MonthlySettlement,
  entriesCount?: number
): string {
  const mName = settlement?.monthName || monthKey;
  const opening = (settlement?.openingBalance || 0).toLocaleString('ar-EG');
  const advances = (settlement?.totalAdvancesReceived || 0).toLocaleString('ar-EG');
  const totalAvail = ((settlement?.openingBalance || 0) + (settlement?.totalAdvancesReceived || 0)).toLocaleString('ar-EG');
  const expenses = (settlement?.totalExpenses || 0).toLocaleString('ar-EG');
  const closing = (settlement?.closingBalance || 0).toLocaleString('ar-EG');
  const custodian = settlement?.custodianName || 'أمين العهدة';

  const text = `*تقرير تسوية العهدة المالية للمزرعة* 🌾
📌 *الشهر:* ${mName}
👤 *المسؤول:* ${custodian}

*الملخص المالي:*
▪️ الرصيد السابق المرحل: ${opening} ج.م
▪️ المقبوضات/العهدة الواردة: ${advances} ج.م
▪️ إجمالي المبلغ المتاح: ${totalAvail} ج.م
───────────────
▪️ إجمالي المصروفات (${entriesCount || 0} حركة): ${expenses} ج.م
▫️ *صافي الرصيد المتبقي بالعهدة:* ${closing} ج.م

📝 *ملاحظات:* ${settlement?.notes || 'لا يوجد'}

_تم الإرسال عبر نظام الإدارة المالية للمزرعة_`;

  return text;
}

/**
 * Opens WhatsApp share with encoded text
 */
export function shareViaWhatsApp(messageText: string, phoneNumber?: string) {
  const encoded = encodeURIComponent(messageText);
  let url = `https://wa.me/?text=${encoded}`;
  if (phoneNumber && phoneNumber.trim().length > 5) {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    url = `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Opens Mail client with subject and body
 */
export function shareViaEmail(subject: string, bodyText: string) {
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  window.location.href = mailto;
}

/**
 * Triggers Browser Web Share API if supported
 */
export async function shareViaWebShareAPI(title: string, text: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch (err) {
      console.log('Share canceled or failed', err);
    }
  }
  return false;
}

/**
 * Triggers Print dialog for monthly report
 */
export function triggerPrintReport() {
  window.print();
}
