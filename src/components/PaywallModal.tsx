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
          className="w-full max-w-md bg-[var(--bg-card)] text-[var(--text-primary)] rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto border border-[var(--border-subtle)]"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[var(--bg-page)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X strokeWidth={2} className="w-4 h-4" />
          </button>

          {/* Icon Badge */}
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)] flex items-center justify-center mb-4">
            <Lock strokeWidth={2} className="w-6 h-6" />
          </div>

          {/* Heading */}
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">
            {title}
          </h2>
          {moduleName && (
            <p className="text-xs font-bold text-[var(--accent-primary)] mb-2">
              Раздел: {moduleName}
            </p>
          )}
          <p className="text-xs text-[var(--text-muted)] mb-5 leading-relaxed">
            Разблокируйте полный банк микропрепаратов с подробным разбором к экзамену.
          </p>

          {/* Feature List */}
          <div className="space-y-3 mb-5 bg-[var(--bg-card-secondary)] p-4 rounded-2xl border border-[var(--border-subtle)]">
            <div className="flex items-start gap-3">
              <CheckCircle2 strokeWidth={2} className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-xs text-[var(--text-primary)] leading-snug font-medium">
                Все 50+ микропрепаратов с экзаменационным разбором
              </span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 strokeWidth={2} className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-xs text-[var(--text-primary)] leading-snug font-medium">
                Аннотированные схемы с маркерами слоев и ключевых клеток
              </span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 strokeWidth={2} className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-xs text-[var(--text-primary)] leading-snug font-medium">
                Алгоритм интервального повторения и режим симуляции зачета
              </span>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck strokeWidth={2} className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
              <span className="text-xs text-[var(--text-primary)] leading-snug font-medium">
                Бессрочный доступ на весь период сдачи сессии
              </span>
            </div>
          </div>

          {/* Price Box */}
          <div className="bg-[var(--accent-primary)] text-white rounded-2xl p-4 mb-5 flex items-center justify-between shadow-lg shadow-[var(--accent-shadow)]">
            <div>
              <div className="text-[10px] uppercase font-bold text-white/80 tracking-wider">
                Специальное предложение
              </div>
              <div className="text-xl font-black mt-0.5">
                150 Telegram Stars <span className="text-xs font-normal text-white/80">/ навсегда</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handlePurchaseStub}
            className="w-full py-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] active:scale-[0.98] text-white font-bold text-sm rounded-[22px] shadow-lg shadow-[var(--accent-shadow)] transition-all flex items-center justify-center gap-2"
          >
            <span>Оплатить через Stars</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
