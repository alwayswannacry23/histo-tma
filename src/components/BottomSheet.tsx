import React from 'react';
import { m, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { SHEET_BACKDROP_VARIANTS, SHEET_PANEL_VARIANTS } from '../utils/motion';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  isDark?: boolean;
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  isDark = true,
  children,
  maxHeight = '88vh',
  className = '',
}) => {
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 400) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <m.div
            variants={SHEET_BACKDROP_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <m.div
            variants={SHEET_PANEL_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            style={{ maxHeight }}
            className={`relative z-10 w-full flex flex-col rounded-t-[24px] border-t shadow-2xl select-none ${
              isDark
                ? 'bg-[#131316] text-white border-white/[0.08]'
                : 'bg-white text-zinc-900 border-black/[0.07]'
            } ${className}`}
          >
            {/* Grab handle */}
            <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div
                className={`w-10 h-1 rounded-full ${
                  isDark ? 'bg-white/20' : 'bg-black/15'
                }`}
              />
            </div>

            {/* Header */}
            {title && (
              <div
                className={`flex items-center justify-between px-4 py-2 border-b ${
                  isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
                }`}
              >
                <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть"
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition active:scale-95 ${
                    isDark
                      ? 'bg-white/[0.06] text-zinc-400 hover:text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            )}

            {/* Content area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 pb-8 overscroll-contain">
              {children}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
};
