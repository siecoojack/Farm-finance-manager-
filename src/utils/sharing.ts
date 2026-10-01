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
 * Copies text to clipboard safely with fallback for older WebViews / HTTP
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  // Fallback using textarea execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    textArea.remove();
    return success;
  } catch (err) {
    console.warn('Clipboard copy failed:', err);
    return false;
  }
}

/**
 * Opens WhatsApp share with encoded text safely across Web and WebViews
 */
export function shareViaWhatsApp(messageText: string, phoneNumber?: string) {
  const encoded = encodeURIComponent(messageText);
  let url = `https://api.whatsapp.com/send?text=${encoded}`;
  if (phoneNumber && phoneNumber.trim().length > 5) {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
  }

  // Safely trigger navigation without window.open popup blocking
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
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
export async function shareViaWebShareAPI(title: string, text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch (err) {
      console.log('Share canceled or not completed:', err);
      return false;
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
