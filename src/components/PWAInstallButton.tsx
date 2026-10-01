import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already installed, don't show the install button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      await install();
      setInstalling(false);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Direct instruction fallback for Android/Chrome when beforeinstallprompt has not fired yet
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={installing}
        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-900 font-bold px-3 py-1.5 rounded-lg text-xs shadow-md transition-all border border-amber-300 animate-pulse"
        title="تثبيت التطبيق على هاتفك كتطبيق أصلي (APK / PWA)"
      >
        <Smartphone className="w-4 h-4 text-slate-900 shrink-0" />
        <span className="hidden sm:inline">تثبيت التطبيق</span>
        <span className="sm:hidden">تثبيت</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-right">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-700" />
                تثبيت التطبيق على جهازك
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-emerald-900 font-medium">
                  يمكنك تثبيت هذا التطبيق مباشرة ليعمل بدون متصفح وكأنه تطبيق أصلي مثبت من متجر التطبيقات.
                </p>
              </div>

              {isIOS ? (
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-800">خطوات التثبيت على آيفون / آيباد (Safari):</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                    <li>اضغط على زر <strong>المشاركة (Share)</strong> أسفل المتصفح.</li>
                    <li>اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</li>
                    <li>اضغط <strong>إضافة (Add)</strong> في الزاوية العلوية.</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-800">خطوات التثبيت على أندرويد / كروم:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                    <li>اضغط على قائمة <strong>النقاط الثلاث (⋮)</strong> في أعلى أو أسفل المتصفح.</li>
                    <li>اختر <strong>تثبيت التطبيق (Install app)</strong> أو <strong>الإضافة إلى الشاشة الرئيسية</strong>.</li>
                    <li>سيظهر التطبيق كأيقونة مستقلة على شاشة هاتفك مع إمكانية العمل بدون إنترنت!</li>
                  </ol>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 py-2.5 text-xs font-bold text-white transition-all shadow-md"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
};
