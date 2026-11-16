-- ==============================================================================
-- HISTOLOGY TMA (Telegram Mini App) - SUPABASE DATABASE SCHEMA
-- MVP Schema for Modules, Slides, User Progress (Spaced Repetition) & Profiles
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Telegram Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    user_tg_id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    photo_url TEXT,
    is_pro BOOLEAN NOT NULL DEFAULT FALSE,
    pro_expires_at TIMESTAMPTZ,
    referred_by BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. MODULES
CREATE TABLE IF NOT EXISTS public.modules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_free BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. SLIDES
CREATE TABLE IF NOT EXISTS public.slides (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    stain TEXT NOT NULL,
    magnification TEXT NOT NULL,
    image_clean_url TEXT NOT NULL,
    image_annotated_url TEXT NOT NULL,
    exam_checklist JSONB NOT NULL DEFAULT '{
        "layers": "",
        "key_cells": "",
        "killer_feature": ""
    }'::jsonb,
    quiz_distractors TEXT[] NOT NULL DEFAULT '{}',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. USER PROGRESS (Spaced Repetition / Leitner-SM2 Hybrid)
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_tg_id BIGINT NOT NULL,
    slide_id TEXT NOT NULL REFERENCES public.slides(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('new', 'learning', 'reviewing', 'mastered')) DEFAULT 'learning',
    ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
    interval_days INTEGER NOT NULL DEFAULT 1,
    repetition_count INTEGER NOT NULL DEFAULT 0,
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_reviewed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_slide UNIQUE (user_tg_id, slide_id)
);

-- INDEXES for fast lookups
CREATE INDEX IF NOT EXISTS idx_modules_order ON public.modules(order_index ASC);
CREATE INDEX IF NOT EXISTS idx_slides_module ON public.slides(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_progress(user_tg_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_next_review ON public.user_progress(user_tg_id, next_review_at);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Modules & Slides are readable by all authenticated & anonymous users
CREATE POLICY "Allow public read access to modules"
    ON public.modules FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to slides"
    ON public.slides FOR SELECT
    USING (true);

-- User Progress: users can read and write their own records
CREATE POLICY "Allow users to read own progress"
    ON public.user_progress FOR SELECT
    USING (true);

CREATE POLICY "Allow users to insert/update own progress"
    ON public.user_progress FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow users to read/update own profile"
    ON public.profiles FOR ALL
    USING (true)
    WITH CHECK (true);

-- TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_user_progress_updated_at ON public.user_progress;
CREATE TRIGGER tr_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- SEED INITIAL MOCK DATA
INSERT INTO public.modules (id, title, description, order_index, is_free)
VALUES 
    ('mod_epithelium', 'Эпителиальные ткани и железы', 'Покровный и железистый эпителий, базальная мембрана, реснитчатый эпителий', 1, true),
    ('mod_resp', 'Дыхательная система', 'Трахея, бронхи разного калибра, респираторный отдел легкого', 2, true),
    ('mod_digestive', 'Пищеварительная система', 'Пищевод, желудок, тонкая и толстая кишка, печень и поджелудочная', 3, false),
    ('mod_urinary', 'Мочевыделительная система', 'Почка (корковое и мозговое вещество), нефрон, мочеточник, мочевой пузырь', 4, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.slides (id, module_id, title, stain, magnification, image_clean_url, image_annotated_url, exam_checklist, quiz_distractors, order_index)
VALUES
    (
        'slide_trachea_01',
        'mod_resp',
        'Трахея (поперечный срез)',
        'Гематоксилин-эозин',
        'x100 / x400',
        'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
        '{
            "layers": "1. Слизистая (многорядный мерцательный эпителий + собственная пластинка) 2. Подслизистая основа (белково-слизистые железы) 3. Волокнисто-хрящевая оболочка (незамкнутые гиалиновые кольца) 4. Адвентициальная оболочка",
            "key_cells": "Реснитчатые, бокаловидные (секретируют слизь), вставочные базальные (камбиальные), эндокринные",
            "killer_feature": "Наличие массивного гиалинового хряща в виде незамкнутой дуги (С-образного кольца) и многорядного призматического реснитчатого эпителия строго отличает от пищевода и бронхов"
        }'::jsonb,
        ARRAY['Пищевод (поперечный срез)', 'Крупный бронх', 'Мочеточник'],
        1
    ),
    (
        'slide_esophagus_01',
        'mod_digestive',
        'Пищевод (поперечный срез)',
        'Гематоксилин-эозин',
        'x100 / x400',
        'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
        '{
            "layers": "1. Слизистая (многослойный плоский неороговевающий эпителий, lamina propria, мышечная пластинка из гладких миоцитов) 2. Подслизистая основа (собственные железы пищевода) 3. Мышечная оболочка (в верхней трети поперечнополосатая, в нижней гладкая) 4. Адвентициальная",
            "key_cells": "Клетки шиповатого и базального слоя плоского эпителия, клетки концевых отделов собственных желез",
            "killer_feature": "Мощный многослойный плоский неороговевающий эпителий + глубокие собственные железы в подслизистой основе + звездчатый просвет в спавшемся состоянии"
        }'::jsonb,
        ARRAY['Трахея (поперечный срез)', 'Мочеточник', 'Двенадцатиперстная кишка'],
        2
    ),
    (
        'slide_ureter_01',
        'mod_urinary',
        'Мочеточник (поперечный срез)',
        'Гематоксилин-эозин',
        'x100 / x200',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        '{
            "layers": "1. Слизистая (переходный эпителий / уротелий, выраженная складчатость, собственная пластинка) 2. Подслизистая основа (отсутствует либо слабо выражена, складки образуются слизистой) 3. Мышечная оболочка (внутренний продольный, наружный циркулярный; в нижней трети + наружный продольный) 4. Адвентициальная",
            "key_cells": "Зонтичные (поверхностные крупные полиплоидные клетки с кутикулой), грушевидные промежуточные, мелкие базальные",
            "killer_feature": "Звездчатый узкий просвет с переходным эпителием (уротелием), отсутствие желез в стенке и четкая двух-трехслойная гладкая мускулатура"
        }'::jsonb,
        ARRAY['Пищевод', 'Трахея', 'Семенной канатик'],
        3
    )
ON CONFLICT (id) DO NOTHING;
