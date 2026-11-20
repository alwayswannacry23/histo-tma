import { TheorySection } from '../curriculumTypes';
import { SECTION_HISTOTECHNIQUE } from './01_histotechnique';
import { SECTION_CYTOLOGY } from './02_cytology';
import { SECTION_EMBRYOLOGY } from './03_embryology';
import { SECTION_GENERAL_HISTO } from './04_general_histo';
import { SECTION_SPECIAL_HISTO } from './05_special_histo';

export const THEORY_SECTIONS: TheorySection[] = [
  SECTION_HISTOTECHNIQUE,
  SECTION_CYTOLOGY,
  SECTION_EMBRYOLOGY,
  SECTION_GENERAL_HISTO,
  SECTION_SPECIAL_HISTO,
];

export const ALL_THEORY_TOPICS = THEORY_SECTIONS.flatMap((s) => s.topics);
