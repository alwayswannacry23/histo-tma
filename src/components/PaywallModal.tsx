import React from 'react';
import { X, Lock, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { useTelegram } from '../telegram/TelegramContext';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  moduleName?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  title = 'Доступ к модулю PRO',
  moduleName,
}) => {
  const { hapticFeedback } = useTelegram();

  if (!isOpen) return null;

  const handleClose = () => {
    hapticFeedback.impactOccurred('light');
    onClose();
  };

  const handlePurchaseStub = () => {
    hapticFeedback.notificationOccurred('warning');
    alert('Интеграция оплаты (Telegram Stars / ЮKassa) подключится на следующем этапе после утверждения UI.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-xl border border-slate-200 overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X strokeWidth={1.5} className="w-5 h-5" />
        </button>

        {/* Lock Icon Badge */}
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4 text-slate-900">
          <Lock strokeWidth={1.5} className="w-6 h-6" />
        </div>

        {/* Title & Description */}
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">{title}</h2>
        {moduleName && (
          <p className="text-sm font-medium text-blue-600 mb-3">
            Модуль: {moduleName}
          </p>
        )}
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Этот раздел входит в расширенный курс подготовки к экзамену по гистологии. Разблокируйте полный банк препаратов.
        </p>

        {/* Feature List */}
        <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex items-start gap-3">
            <CheckCircle2 strokeWidth={1.5} className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-xs text-slate-700 leading-snug">
              Все 50+ микропрепаратов с детальным экзаменационным разбором
            </span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 strokeWidth={1.5} className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-xs text-slate-700 leading-snug">
              Аннотированные схемы с маркерами слоев и ключевых клеток
            </span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 strokeWidth={1.5} className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-xs text-slate-700 leading-snug">
              Алгоритм интервального повторения и режим симуляции зачета
            </span>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck strokeWidth={1.5} className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <span className="text-xs text-slate-700 leading-snug">
              Доступ навсегда до сдачи сессии
            </span>
          </div>
        </div>

        {/* Pricing Options */}
        <div className="border border-slate-200 rounded-xl p-3.5 mb-5 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">Доступ «Сессия PRO»</div>
            <div className="text-lg font-bold text-slate-900">199 Telegram Stars <span className="text-xs font-normal text-slate-500">/ ~390 ₽</span></div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3" /> Топ выбор
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handlePurchaseStub}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>Разблокировать модуль</span>
          </button>
          <button
            onClick={handleClose}
            className="w-full py-2.5 px-4 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Продолжить в бесплатной версии
          </button>
        </div>
      </div>
    </div>
  );
};
