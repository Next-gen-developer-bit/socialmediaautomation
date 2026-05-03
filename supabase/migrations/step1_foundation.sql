-- =====================================================
-- STEP 1: FOUNDATION (Run this FIRST)
-- Shared enums, tables, triggers used by ALL platforms
-- =====================================================

-- Platform enum
CREATE TYPE platform_type AS ENUM (
  'instagram',
  'facebook',
  'tiktok',
  'youtube'
);

-- Hook style categories
CREATE TYPE hook_style_type AS ENUM (
  'question',           -- "Did you know...?"
  'bold_statement',     -- "Most people get this wrong..."
  'storytelling',       -- "Last year I..."
  'statistic',          -- "97% of people..."
  'controversial',      -- "Unpopular opinion..."
  'tutorial',           -- "Here's how to..."
  'challenge',          -- "Try this for 7 days..."
  'relatable',          -- "POV: you just..."
  'quote',              -- Opening with a famous quote
  'visual_shock',       -- Unexpected visual to grab attention
  'cta_first',          -- "Save this for later..."
  'before_after'        -- Transformation reveal
);

-- Caption structure types
CREATE TYPE caption_structure_type AS ENUM (
  'short_punchy',       -- 1-2 lines, emoji-heavy
  'storytelling',       -- Multi-paragraph narrative
  'listicle',           -- Numbered list format
  'question_answer',    -- Asks then answers a question
  'cta_focused',        -- Drives action (link in bio, etc.)
  'educational',        -- Informative / how-to breakdown
  'motivational',       -- Inspirational copy
  'conversational',     -- Casual, like talking to a friend
  'micro_blog',         -- Long-form, article-style
  'minimal'             -- Just a few words or emojis
);

-- Content format types
CREATE TYPE content_format_type AS ENUM (
  'reel',
  'story',
  'carousel',
  'static_post',
  'live',
  'short',
  'long_form_video',
  'text_post',
  'duet',
  'stitch',
  'community_post'
);

-- =====================================================
-- HASHTAG SETS (reusable tag groups)
-- =====================================================
CREATE TABLE hashtag_sets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  platform      platform_type NOT NULL,
  hashtags      TEXT[] NOT NULL DEFAULT '{}',
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hashtag_sets_platform ON hashtag_sets(platform);

-- =====================================================
-- AUDIO LIBRARY (trending & saved audio tracks)
-- =====================================================
CREATE TABLE audio_library (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  artist        TEXT,
  platform      platform_type NOT NULL,
  audio_url     TEXT,
  is_trending   BOOLEAN NOT NULL DEFAULT false,
  genre         TEXT,
  mood          TEXT,
  bpm           INTEGER,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audio_library_platform ON audio_library(platform);
CREATE INDEX idx_audio_library_trending ON audio_library(is_trending) WHERE is_trending = true;

-- =====================================================
-- CONTENT POSTS (central table for ALL platforms)
-- =====================================================
CREATE TABLE content_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core identifiers
  platform            platform_type NOT NULL,
  title               TEXT,
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),

  -- Hook style
  hook_style          hook_style_type,
  hook_text           TEXT,

  -- Caption structure
  caption_structure   caption_structure_type,
  caption_text        TEXT,

  -- Hashtags
  hashtag_set_id      UUID REFERENCES hashtag_sets(id) ON DELETE SET NULL,
  custom_hashtags     TEXT[],

  -- Audio used
  audio_id            UUID REFERENCES audio_library(id) ON DELETE SET NULL,
  custom_audio_note   TEXT,

  -- Length
  length_seconds      INTEGER,
  length_category     TEXT
                        CHECK (length_category IN (
                          '< 15s', '15-30s', '30-60s', '1-3m', '3-10m', '10m+'
                        )),

  -- Format
  content_format      content_format_type NOT NULL,

  -- Scheduling & publishing
  scheduled_at        TIMESTAMPTZ,
  published_at        TIMESTAMPTZ,
  published_url       TEXT,

  -- Performance tracking
  views               BIGINT DEFAULT 0,
  likes               BIGINT DEFAULT 0,
  comments            BIGINT DEFAULT 0,
  shares              BIGINT DEFAULT 0,
  saves               BIGINT DEFAULT 0,

  -- Metadata
  topic               TEXT,
  target_audience     TEXT,
  tone                TEXT,
  notes               TEXT,

  -- Ownership
  user_id             UUID,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_posts_platform ON content_posts(platform);
CREATE INDEX idx_content_posts_status ON content_posts(status);
CREATE INDEX idx_content_posts_user ON content_posts(user_id);
CREATE INDEX idx_content_posts_scheduled ON content_posts(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_content_posts_format ON content_posts(content_format);

-- =====================================================
-- CONTENT TEMPLATES (reusable strategy presets)
-- =====================================================
CREATE TABLE content_templates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  description         TEXT,
  platform            platform_type NOT NULL,
  hook_style          hook_style_type,
  caption_structure   caption_structure_type,
  hashtag_set_id      UUID REFERENCES hashtag_sets(id) ON DELETE SET NULL,
  content_format      content_format_type,
  recommended_length  TEXT,
  hook_template       TEXT,
  caption_template    TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  user_id             UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_templates_platform ON content_templates(platform);

-- =====================================================
-- AUTO-UPDATE TIMESTAMPS TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hashtag_sets_updated
  BEFORE UPDATE ON hashtag_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_audio_library_updated
  BEFORE UPDATE ON audio_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_content_posts_updated
  BEFORE UPDATE ON content_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_content_templates_updated
  BEFORE UPDATE ON content_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY for shared tables
-- =====================================================
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own content posts"
  ON content_posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own templates"
  ON content_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read hashtag sets"
  ON hashtag_sets FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage hashtag sets"
  ON hashtag_sets FOR INSERT
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update hashtag sets"
  ON hashtag_sets FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete hashtag sets"
  ON hashtag_sets FOR DELETE
  USING (true);

CREATE POLICY "Anyone can read audio library"
  ON audio_library FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert audio"
  ON audio_library FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update audio"
  ON audio_library FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete audio"
  ON audio_library FOR DELETE
  USING (true);
