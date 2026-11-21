export const IOS_EASE = [0.32, 0.72, 0, 1] as const;

export const IOS_SPRING = {
  type: 'spring',
  stiffness: 380,
  damping: 38,
  mass: 1,
} as const;

export const IOS_TRANSITION = {
  duration: 0.35,
  ease: IOS_EASE,
} as const;

export const PAGE_TRANSITION_VARIANTS = {
  initial: {
    opacity: 0,
    x: 32,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.28,
      ease: IOS_EASE,
    },
  },
  exit: {
    opacity: 0,
    x: -24,
    transition: {
      duration: 0.22,
      ease: IOS_EASE,
    },
  },
};

export const SHEET_BACKDROP_VARIANTS = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.25, ease: IOS_EASE },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: IOS_EASE },
  },
};

export const SHEET_PANEL_VARIANTS = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: IOS_SPRING,
  },
  exit: {
    y: '100%',
    transition: { duration: 0.24, ease: IOS_EASE },
  },
};

export const SLIDE_TRANSITION_VARIANTS = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 40 : -40,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.25,
      ease: IOS_EASE,
    },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -40 : 40,
    transition: {
      duration: 0.2,
      ease: IOS_EASE,
    },
  }),
};
