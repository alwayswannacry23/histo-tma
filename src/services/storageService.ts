import { Module, Slide, UserProgress, ReviewRating, ProgressStatus } from '../types';
import { MOCK_MODULES, MOCK_SLIDES } from '../data/mockSlides';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_PREFIX = 'histotma_progress_';

export const storageService = {
  // Modules
  async getModules(): Promise<Module[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('modules')
          .select('*')
          .order('order_index', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as Module[];
        }
      } catch (err) {
        console.warn('Failed to fetch modules from Supabase, using mock fallback', err);
      }
    }
    return MOCK_MODULES;
  },

  // Slides
  async getSlides(moduleId?: string): Promise<Slide[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase.from('slides').select('*');
        if (moduleId) {
          query = query.eq('module_id', moduleId);
        }
        const { data, error } = await query.order('order_index', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as Slide[];
        }
      } catch (err) {
        console.warn('Failed to fetch slides from Supabase, using mock fallback', err);
      }
    }
    if (moduleId) {
      return MOCK_SLIDES.filter(s => s.module_id === moduleId);
    }
    return MOCK_SLIDES;
  },

  // User Progress
  getUserProgressLocal(userTgId: number): Record<string, UserProgress> {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${userTgId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return {};
  },

  saveUserProgressLocal(userTgId: number, progressMap: Record<string, UserProgress>) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${userTgId}`, JSON.stringify(progressMap));
    } catch {
      // ignore
    }
  },

  async getAllProgress(userTgId: number): Promise<Record<string, UserProgress>> {
    const localMap = this.getUserProgressLocal(userTgId);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_tg_id', userTgId);
        if (!error && data) {
          const map: Record<string, UserProgress> = { ...localMap };
          data.forEach((item: any) => {
            map[item.slide_id] = {
              user_tg_id: item.user_tg_id,
              slide_id: item.slide_id,
              status: item.status as ProgressStatus,
              next_review_at: item.next_review_at,
              ease_factor: Number(item.ease_factor),
              interval_days: item.interval_days,
              repetition_count: item.repetition_count,
              last_reviewed_at: item.last_reviewed_at,
            };
          });
          this.saveUserProgressLocal(userTgId, map);
          return map;
        }
      } catch (err) {
        console.warn('Failed to fetch progress from Supabase, using local', err);
      }
    }

    return localMap;
  },

  // Record review rating and apply spaced repetition (SM2 / Leitner hybrid)
  async recordReview(
    userTgId: number,
    slideId: string,
    rating: ReviewRating
  ): Promise<UserProgress> {
    const currentProgressMap = this.getUserProgressLocal(userTgId);
    const existing = currentProgressMap[slideId] || {
      user_tg_id: userTgId,
      slide_id: slideId,
      status: 'learning' as ProgressStatus,
      next_review_at: new Date().toISOString(),
      ease_factor: 2.5,
      interval_days: 1,
      repetition_count: 0,
      last_reviewed_at: new Date().toISOString(),
    };

    let newStatus: ProgressStatus = existing.status;
    let newEase = existing.ease_factor;
    let newInterval = existing.interval_days || 1;
    let newRepCount = (existing.repetition_count || 0) + 1;

    const now = new Date();
    let nextReviewDate = new Date(now);

    if (rating === 'again') {
      newStatus = 'learning';
      newEase = Math.max(1.3, Number((newEase - 0.2).toFixed(2)));
      newInterval = 1;
      newRepCount = 0;
      nextReviewDate.setDate(now.getDate() + 1);
    } else if (rating === 'doubt') {
      newStatus = 'reviewing';
      newInterval = Math.max(2, Math.round(newInterval * 1.3));
      nextReviewDate.setDate(now.getDate() + 3);
    } else {
      // 'know'
      newStatus = 'mastered';
      newEase = Math.min(3.0, Number((newEase + 0.15).toFixed(2)));
      newInterval = newRepCount <= 1 ? 3 : Math.round(newInterval * newEase);
      nextReviewDate.setDate(now.getDate() + Math.max(7, newInterval));
    }

    const updated: UserProgress = {
      user_tg_id: userTgId,
      slide_id: slideId,
      status: newStatus,
      next_review_at: nextReviewDate.toISOString(),
      ease_factor: newEase,
      interval_days: newInterval,
      repetition_count: newRepCount,
      last_reviewed_at: now.toISOString(),
    };

    currentProgressMap[slideId] = updated;
    this.saveUserProgressLocal(userTgId, currentProgressMap);

    // Sync to Supabase in background if configured
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('user_progress')
        .upsert(
          {
            user_tg_id: userTgId,
            slide_id: slideId,
            status: newStatus,
            ease_factor: newEase,
            interval_days: newInterval,
            repetition_count: newRepCount,
            next_review_at: nextReviewDate.toISOString(),
            last_reviewed_at: now.toISOString(),
          },
          { onConflict: 'user_tg_id,slide_id' }
        )
        .then(({ error }) => {
          if (error) console.error('Supabase upsert progress error:', error);
        });
    }

    return updated;
  },

  // Reset progress (for testing)
  resetProgress(userTgId: number) {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${userTgId}`);
    } catch {
      // ignore
    }
  }
};
