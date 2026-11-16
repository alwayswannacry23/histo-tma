export interface Module {
  id: string;
  title: string;
  order_index: number;
  is_free: boolean;
  description: string;
}

export interface ExamChecklist {
  layers: string;
  key_cells: string;
  killer_feature: string;
  clinical_note?: string;
  differential_diagnosis?: string;
  video_hint_query?: string;
}

export interface LayerAnnotation {
  id: string;
  number: number;
  name: string;
  short_name: string;
  color: string;
  description: string;
  pin_x: number; // percentage 0-100
  pin_y: number; // percentage 0-100
}

export interface Slide {
  id: string;
  module_id: string;
  exam_number?: number;
  title: string;
  stain: string;
  magnification: string;
  image_clean_url: string;
  image_annotated_url?: string;
  exam_checklist: ExamChecklist;
  quiz_distractors: string[];
  order_index?: number;
  layer_annotations?: LayerAnnotation[];
  clinical_note?: string;
  differential_diagnosis?: string;
  video_hint_query?: string;
  // Optional convenience aliases
  examNumber?: number;
  moduleId?: string;
  imageUrl?: string;
  layers?: string;
  keyCells?: string;
  killerFeature?: string;
  distractors?: string[];
  clinicalNote?: string;
  differentialDiagnosis?: string;
  videoHintQuery?: string;
}

export type ReviewRating = 'again' | 'doubt' | 'know';
export type ProgressStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface UserProgress {
  user_tg_id: number;
  slide_id: string;
  status: ProgressStatus;
  next_review_at: string;
  ease_factor: number;
  interval_days?: number;
  repetition_count?: number;
  last_reviewed_at?: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface UserProfile {
  user_tg_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  is_pro: boolean;
  pro_expires_at?: string;
  referred_by?: number;
  created_at?: string;
}
