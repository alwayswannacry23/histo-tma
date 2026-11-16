# HistoTMA — Интерактивный тренажер по гистологии (Telegram Mini App)

MVP Telegram Mini App (TMA) для студентов медицинских вузов: подготовка к практической диагностике микропрепаратов, коллоквиумам и экзамену по гистологии.

---

## 🛠 Технологический стек
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS.
- **Telegram SDK:** `@telegram-apps/sdk-react` + контекст с поддержкой безопасного fallback-режима для разработки в обычном браузере (`window.Telegram.WebApp` / mock `initData`, `themeParams`, `hapticFeedback`).
- **Иконки:** `lucide-react` (строго 1.5px stroke width).
- **Зум микропрепаратов:** `react-zoom-pan-pinch` (жесты pinch-to-zoom, панорамирование, масштабирование x100/x400).
- **Backend / Database:** Supabase (PostgreSQL + RLS + Storage).
- **Интервальное повторение:** алгоритм SM2 / Leitner (статусы `learning`, `reviewing`, `mastered`, расчет `ease_factor` и `interval_days`).

---

## 📐 Архитектура экранов (MVP)

1. **Home (Модули):**
   - Прогресс-бар изученных препаратов (отношение и процент).
   - Кнопка «Спидран (15 случайных препаратов)».
   - Список модулей (название, описание, прогресс, метки `Бесплатно` / `PRO` с замком).
   - При клике на платные модули открывается модальное окно Paywall.

2. **Trainer (Тренажер препарата):**
   - Верхняя панель: прогресс текущей сессии (индекс и progress-line), кнопка выхода `X`, переключатель режима «Тест» (4 варианта) / «Карточка» (самопроверка).
   - Область фото: просмотрщик с `react-zoom-pan-pinch` (кнопки зума, сброс, индикатор увеличения x100/x400, окраска).
   - Кнопка-переключатель «Показать обозначения» (мгновенное переключение между чистым препаратом и аннотированным срезом с маркерами слоев).
   - Режим самопроверки и теста с моментальным тактильным откликом (`hapticFeedback`).
   - Структурированная карточка экзаменационного разбора:
     - Название препарата
     - Окраска и увеличение
     - Киллер-фича (главный отличительный признак)
     - Оболочки и слои
     - Ключевые клетки
   - Фиксированная нижняя панель интервального повторения: «Не помню», «Сомневаюсь», «Знаю».

3. **CheatSheets (Шпаргалки):**
   - Живой поиск в реальном времени по названию, окраске, слоям, клеткам и ключевым признакам.
   - Фильтрация по модулям («Все», «Дыхательная», «Пищеварительная», «Мочевыделительная»).
   - Аккордеон-карточки со свернутой/развернутой выжимкой и быстрой кнопкой перехода в тренажер микроскопа.

4. **Profile & Paywall:**
   - Карточка профиля студента (Telegram ID, имя, юзернейм).
   - Статистика подготовки (Освоено, На повторении, В процессе).
   - Реферальный блок со ссылкой `https://t.me/bot?start=ref_USERID` и кнопкой копирования с haptic-откликом.
   - Заглушка тарифа «Сессия PRO» / Telegram Stars.

---

## 🚀 Быстрый запуск

### 1. Установка и запуск в dev-режиме
```bash
npm install
npm run dev
```
Приложение откроется по адресу `http://localhost:5173`.
В браузере автоматически активируется безопасный fallback-режим с моковыми данными Telegram-пользователя и тактильным откликом.

### 2. Сборка продакшена
```bash
npm run build
```

---

## 🗄 База данных (Supabase)

Схема базы данных находится в [`supabase/schema.sql`](file:///c:/Users/alwayswannacry/Desktop/lolxd/supabase/schema.sql).

Она включает в себя:
- Таблицу `profiles` (пользователи Telegram, PRO-статус, рефералы).
- Таблицу `modules` (`id`, `title`, `description`, `is_free`, `order_index`).
- Таблицу `slides` (`id`, `module_id`, `title`, `stain`, `magnification`, `image_clean_url`, `image_annotated_url`, `exam_checklist` JSONB, `quiz_distractors`).
- Таблицу `user_progress` (прогресс, `status`, `ease_factor`, `interval_days`, `next_review_at`).
- Политики Row Level Security (RLS) и триггер `update_updated_at_column`.
- Начальные сид-данные для 3 тестовых препаратов.

Для подключения реального Supabase:
1. Создайте проект на [supabase.com](https://supabase.com).
2. Выполните скрипт `supabase/schema.sql` в SQL Editor.
3. Скопируйте `.env.example` в `.env` и укажите `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.

---

## 📁 Структура проекта
```
lolxd/
├── src/
│   ├── components/
│   │   ├── Navigation.tsx       # Нижняя клиническая навигация
│   │   └── PaywallModal.tsx     # Модальное окно PRO-доступа
│   ├── data/
│   │   └── mockSlides.ts        # Типизированные препараты и SVG-микропрепараты
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Каталог модулей, спидран, прогресс
│   │   ├── TrainerScreen.tsx    # Тренажер со зумом, аннотациями и SM2
│   │   ├── CheatSheetsScreen.tsx# Живой поиск и шпаргалки к зачету
│   │   └── ProfileScreen.tsx    # Профиль, статистика и рефералы
│   ├── services/
│   │   ├── storageService.ts    # Управление прогрессом (SM2 + LocalStorage + Supabase)
│   │   └── supabaseClient.ts    # Клиент Supabase
│   ├── telegram/
│   │   └── TelegramContext.tsx  # Telegram SDK & браузерный fallback
│   ├── types/
│   │   └── index.ts             # Строгая типизация
│   ├── App.tsx                  # Главный роутинг и стейт
│   ├── index.css                # Tailwind & Telegram Safe Area
│   └── main.tsx
├── supabase/
│   └── schema.sql               # Полная SQL-миграция Supabase
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```
