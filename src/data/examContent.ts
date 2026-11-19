// src/data/examContent.ts
// Адаптер полного набора кафедральных электроннограмм (52 шт.) и экзаменационных билетов (94 шт.)

import { ELECTRONOGRAMS as RAW_ELECTRONOGRAMS } from './electronogramsData';
import { EXAM_QUESTIONS as RAW_EXAM_QUESTIONS } from './examQuestionsData';

export interface ElectronogramItem {
  id: string;
  number: number;
  title: string;
  topic: string;
  imageUrl?: string;
  markers: string[];
  description: string;
  keyFeature?: string;
}

export interface ExamTicketItem {
  id: string;
  number: number;
  block: 'Цитология' | 'Эмбриология' | 'Общая гистология' | 'Частная гистология';
  question: string;
  answer: string;
  keyTip?: string;
}

export const ELECTRONOGRAMS: ElectronogramItem[] = RAW_ELECTRONOGRAMS.map((em) => ({
  id: em.id,
  number: em.number,
  title: em.title,
  topic: em.sectionName || 'Гистология',
  imageUrl: (em as any).imageUrl,
  markers: em.markers || [],
  keyFeature: em.keyFeature,
  description: [
    em.description,
    em.functionText ? `Функции: ${em.functionText}` : null,
  ]
    .filter(Boolean)
    .join('\n\n'),
}));

const SECTION_TO_BLOCK: Record<
  string,
  'Цитология' | 'Эмбриология' | 'Общая гистология' | 'Частная гистология'
> = {
  cytology: 'Цитология',
  embryology: 'Эмбриология',
  general: 'Общая гистология',
  private: 'Частная гистология',
};

export const EXAM_TICKETS: ExamTicketItem[] = RAW_EXAM_QUESTIONS.map((q) => ({
  id: q.id,
  number: q.number,
  block: SECTION_TO_BLOCK[q.section] || 'Общая гистология',
  question: q.question,
  answer: q.summaryAnswer,
  keyTip:
    q.plan && q.plan.length > 0
      ? `План ответа: ${q.plan.join('; ')}`
      : q.keyTerms && q.keyTerms.length > 0
      ? `Ключевые термины: ${q.keyTerms.join(', ')}`
      : undefined,
}));
