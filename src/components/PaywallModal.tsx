import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    alert('Интеграция Telegram Stars будет подключена в следующем обновлении.');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X strokeWidth={1.5} className="w-4 h-4" />
          </button>

          {/* Icon Badge */}
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Lock strokeWidth={1.5} className="w-6 h-6" />
          </div>

          {/* Heading */}
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
            {title}
          </h2>
          {moduleName && (
            <p className="text-xs font-semibold text-blue-600 mb-2">
              Раздел: {moduleName}
            </p>
          )}
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            Разблокируйте полный банк микропрепаратов с подробным разбором к экзамену.
          </p>

          {/* Feature List */}
          <div className="space-y-3 mb-5 bg-[#F4F5F7] p-4 rounded-2xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 strokeWidth={1.5} className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700 leading-snug">
                Все 50+ микропрепаратов с экзаменационным разбором
              </span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 strokeWidth={1.5} className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700 leading-snug">
                Аннотированные схемы с маркерами слоев и ключевых клеток
              </span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 strokeWidth={1.5} className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700 leading-snug">
                Алгоритм интервального повторения и режим симуляции зачета
              </span>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck strokeWidth={1.5} className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700 leading-snug">
                Бессрочный доступ на весь период сдачи сессии
              </span>
            </div>
          </div>

          {/* Price Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 mb-5 flex items-center justify-between shadow-md">
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Тариф «Сессия PRO»
              </div>
              <div className="text-lg font-bold text-white mt-0.5">
                199 Telegram Stars <span className="text-xs font-normal text-slate-300">/ ~390 ₽</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 bg-amber-300 px-2.5 py-1 rounded-full shadow-xs">
              <Sparkles className="w-3 h-3 fill-slate-900" /> PRO
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handlePurchaseStub}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl transition-all shadow-md active:scale-[0.98]"
            >
              Разблокировать доступ
            </button>
            <button
              onClick={handleClose}
              className="w-full py-2.5 px-4 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
            >
              Вернуться назад
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
