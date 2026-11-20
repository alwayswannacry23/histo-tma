import { TheorySection } from '../curriculumTypes';

export const SECTION_HISTOTECHNIQUE: TheorySection = {
  id: 'sec_1_histotechnique',
  order: 1,
  title: 'Гистологическая техника',
  shortTitle: 'Гистотехника',
  semesterLabel: '2 семестр · Темы 1–2',
  topics: [
    {
      id: 'topic_01_intro_history',
      sectionId: 'sec_1_histotechnique',
      lessonNumber: 1,
      title: 'Введение, история гистологии и отечественные школы',
      subtitle: 'Предмет, этапы развития, Вольф, Бэр, Заварзин, Хлопин, Светлов, Субботин',
      diagnosticIds: [1],
      isExam: true,
      examQuestionIds: [1, 2, 3, 4],
      relatedSlideIds: [],
      relatedEmIds: [],
      blocks: [],
    },
    {
      id: 'topic_02_histotechnique',
      sectionId: 'sec_1_histotechnique',
      lessonNumber: 2,
      title: 'Гистологическая техника, красители и методы микроскопии',
      subtitle: 'Этапы изготовления препарата, тинкториальные свойства, световая и ЭМ-микроскопия',
      diagnosticIds: [1],
      isExam: true,
      examQuestionIds: [5],
      relatedSlideIds: [],
      relatedEmIds: [],
      blocks: [],
    },
  ],
};
