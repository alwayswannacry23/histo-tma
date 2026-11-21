export type DiagnosticId = 1 | 2 | 3 | 4;

export type StudyMode = 'diag_1' | 'diag_2' | 'diag_3' | 'diag_4' | 'exam';

export type CurriculumSectionId =
  | 'sec_1_histotechnique'
  | 'sec_2_cytology'
  | 'sec_3_embryology'
  | 'sec_4_general_histo'
  | 'sec_5_special_histo';

export type ContentBlock =
  | { id?: string; type: 'summary'; title?: string; text: string }
  | { id?: string; type: 'text'; title?: string; text: string }
  | { id?: string; type: 'list'; title?: string; ordered?: boolean; items: string[] }
  | { id?: string; type: 'table'; title?: string; headers: string[]; rows: string[][] }
  | { id?: string; type: 'examTrap'; title?: string; text: string }
  | { id?: string; type: 'qa'; title?: string; items: { q: string; a: string }[] };

export interface TheoryTopic {
  id: string;
  sectionId: CurriculumSectionId;
  lessonNumber?: number;
  title: string;
  subtitle: string;
  diagnosticIds: DiagnosticId[];
  isExam: boolean;
  examQuestionIds: number[];
  relatedSlideIds: string[];
  relatedEmIds: string[];
  briefPoints?: string[];
  blocks: ContentBlock[];
}

export interface TheorySection {
  id: CurriculumSectionId;
  order: number;
  title: string;
  shortTitle: string;
  semesterLabel: string;
  topics: TheoryTopic[];
}

export interface DiagnosticMeta {
  id: DiagnosticId;
  mode: StudyMode;
  title: string;
  shortTitle: string;
  semester: string;
  lessonLabel: string;
  subtitle: string;
  expectedSlidesCount: number;
  expectedEmCount: number;
}

export interface SlidePin {
  number: number;
  name: string;
  short_name: string;
  color: string;
  pin_x: number;
  pin_y: number;
  description: string;
}

export interface SlideImageVariant {
  url: string;
  label: string;
  source?: string;
  pins?: SlidePin[];
}

export type SdoQuestionType = 'single' | 'multiple' | 'match' | 'order' | 'input';

export interface SdoTestItem {
  id: string;
  number: number;
  sectionId: CurriculumSectionId;
  diagnosticIds: DiagnosticId[];
  type: SdoQuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  pairs?: { left: string; right: string }[];
  imageUrl?: string;
  explanation?: string;
}

export interface SituationalTaskItem {
  id: string;
  number: number;
  sectionId: CurriculumSectionId;
  diagnosticIds: DiagnosticId[];
  condition: string;
  questions: string[];
  referenceAnswer: string;
  keyTerms?: string[];
}
