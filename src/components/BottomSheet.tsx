import React from 'react';
import { m, AnimatePresence, PanInfo, useDragControls } from 'framer-motion';
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
  maxHeight = '86vh',
  className = '',
}) => {
  const dragControls = useDragControls();

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 90 || info.velocity.y > 400) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end items-center">
          <m.div
            variants={SHEET_BACKDROP_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
          />

          <m.div
            variants={SHEET_PANEL_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={handleDragEnd}
            style={{ maxHeight }}
            className={`relative z-10 w-full max-w-md flex flex-col rounded-t-3xl border-t shadow-2xl select-none ${
              isDark
                ? 'bg-[#131316] text-[#F4F4F5] border-white/[0.08]'
                : 'bg-white text-[#18181B] border-black/[0.08]'
            } ${className}`}
          >
            {/* Зона перетаскивания (ручка + шапка) — не мешает скроллу списка внутри */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="touch-none shrink-0"
            >
              <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                <div
                  className={`w-9 h-1 rounded-full ${
                    isDark ? 'bg-white/20' : 'bg-black/15'
                  }`}
                />
              </div>

              {title && (
                <div
                  className={`flex items-center justify-between px-4 py-2.5 border-b ${
                    isDark ? 'border-white/[0.08]' : 'border-black/[0.07]'
                  }`}
                >
                  <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрыть"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isDark
                        ? 'bg-white/[0.06] text-zinc-400 active:bg-white/[0.12]'
                        : 'bg-zinc-100 text-zinc-600 active:bg-zinc-200'
                    }`}
                  >
                    <X className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 pb-8 overscroll-y-contain">
              {children}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
};
