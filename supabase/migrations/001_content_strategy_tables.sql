-- =====================================================
-- Social Media Content Strategy Tables
-- Platforms: Instagram, Facebook, TikTok, YouTube
-- =====================================================

-- =====================================================
-- 1. ENUM / LOOKUP TYPES
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
  'reel',               -- Instagram / Facebook Reel
  'story',              -- Instagram / Facebook Story
  'carousel',           -- Instagram Carousel
  'static_post',        -- Single image post
  'live',               -- Live stream
  'short',              -- YouTube Shorts / TikTok
  'long_form_video',    -- YouTube long-form
  'text_post',          -- Facebook text post
  'duet',               -- TikTok Duet
  'stitch',             -- TikTok Stitch
  'community_post'      -- YouTube Community post
);

-- =====================================================
-- 2. HASHTAG SETS (reusable tag groups)
-- =====================================================

CREATE TABLE hashtag_sets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,                        -- e.g. "Real Estate Growth"
  platform      platform_type NOT NULL,
  hashtags      TEXT[] NOT NULL DEFAULT '{}',         -- Array of hashtag strings
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hashtag_sets_platform ON hashtag_sets(platform);

-- =====================================================
-- 3. AUDIO LIBRARY (trending & saved audio tracks)
-- =====================================================

CREATE TABLE audio_library (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,                        -- Song / sound title
  artist        TEXT,                                 -- Artist or creator
  platform      platform_type NOT NULL,
  audio_url     TEXT,                                 -- Link to the audio on the platform
  is_trending   BOOLEAN NOT NULL DEFAULT false,
  genre         TEXT,                                 -- e.g. "pop", "lo-fi", "voiceover"
  mood          TEXT,                                 -- e.g. "upbeat", "calm", "dramatic"
  bpm           INTEGER,                              -- Beats per minute (useful for edits)
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audio_library_platform ON audio_library(platform);
CREATE INDEX idx_audio_library_trending ON audio_library(is_trending) WHERE is_trending = true;

-- =====================================================
-- 4. CONTENT POSTS (central table for all platforms)
-- =====================================================

CREATE TABLE content_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core identifiers
  platform            platform_type NOT NULL,
  title               TEXT,                              -- Internal title / working name
  status              TEXT NOT NULL DEFAULT 'draft'       -- draft | scheduled | published | archived
                        CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  
  -- The 6 strategy fields
  hook_style          hook_style_type,
  hook_text           TEXT,                              -- The actual hook copy used
  
  caption_structure   caption_structure_type,
  caption_text        TEXT,                              -- Full caption / description
  
  hashtag_set_id      UUID REFERENCES hashtag_sets(id) ON DELETE SET NULL,
  custom_hashtags     TEXT[],                            -- Override / additional hashtags
  
  audio_id            UUID REFERENCES audio_library(id) ON DELETE SET NULL,
  custom_audio_note   TEXT,                              -- If not from library, free-text note
  
  length_seconds      INTEGER,                           -- Duration in seconds
  length_category     TEXT                               -- e.g. "< 15s", "15-30s", "30-60s", "1-3m", "3-10m", "10m+"
                        CHECK (length_category IN (
                          '< 15s', '15-30s', '30-60s', '1-3m', '3-10m', '10m+'
                        )),
  
  content_format      content_format_type NOT NULL,
  
  -- Scheduling & publishing
  scheduled_at        TIMESTAMPTZ,
  published_at        TIMESTAMPTZ,
  published_url       TEXT,                              -- Link to live post
  
  -- Performance tracking
  views               BIGINT DEFAULT 0,
  likes               BIGINT DEFAULT 0,
  comments            BIGINT DEFAULT 0,
  shares              BIGINT DEFAULT 0,
  saves               BIGINT DEFAULT 0,
  
  -- Metadata
  topic               TEXT,                              -- Topic / niche tag
  target_audience     TEXT,
  tone                TEXT,
  notes               TEXT,
  
  -- Ownership (links to Supabase auth)
  user_id             UUID,
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_content_posts_platform ON content_posts(platform);
CREATE INDEX idx_content_posts_status ON content_posts(status);
CREATE INDEX idx_content_posts_user ON content_posts(user_id);
CREATE INDEX idx_content_posts_scheduled ON content_posts(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_content_posts_format ON content_posts(content_format);

-- =====================================================
-- 5. PLATFORM-SPECIFIC METADATA TABLES
-- =====================================================

-- Instagram-specific fields
CREATE TABLE instagram_metadata (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_post_id     UUID NOT NULL UNIQUE REFERENCES content_posts(id) ON DELETE CASCADE,
  
  post_type           TEXT CHECK (post_type IN ('reel', 'story', 'carousel', 'single_image', 'live', 'guide')),
  carousel_count      INTEGER,                           -- Number of slides if carousel
  cover_image_url     TEXT,
  collab_accounts     TEXT[],                            -- Collab / tagged accounts
  location_tag        TEXT,
  shop_tags           TEXT[],                            -- Product tags
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Facebook-specific fields
CREATE TABLE facebook_metadata (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_post_id     UUID NOT NULL UNIQUE REFERENCES content_posts(id) ON DELETE CASCADE,
  
  post_type           TEXT CHECK (post_type IN ('reel', 'story', 'video', 'photo', 'text', 'link', 'live', 'event')),
  group_id            TEXT,                              -- If posted to a group
  page_id             TEXT,                              -- If posted to a page
  boost_budget        DECIMAL(10,2),                     -- Paid boost amount
  target_demographics TEXT,
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TikTok-specific fields
CREATE TABLE tiktok_metadata (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_post_id     UUID NOT NULL UNIQUE REFERENCES content_posts(id) ON DELETE CASCADE,
  
  post_type           TEXT CHECK (post_type IN ('video', 'duet', 'stitch', 'live', 'photo_mode', 'story')),
  original_sound      BOOLEAN DEFAULT false,             -- Using original sound vs. library
  green_screen        BOOLEAN DEFAULT false,
  effects_used        TEXT[],                            -- TikTok effects / filters
  duet_stitch_source  TEXT,                              -- URL of source video for duets/stitches
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- YouTube-specific fields
CREATE TABLE youtube_metadata (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_post_id     UUID NOT NULL UNIQUE REFERENCES content_posts(id) ON DELETE CASCADE,
  
  post_type           TEXT CHECK (post_type IN ('short', 'video', 'live', 'premiere', 'community_post')),
  thumbnail_url       TEXT,
  video_tags          TEXT[],                            -- YouTube video tags (separate from hashtags)
  category            TEXT,                              -- YouTube category (e.g. "Education")
  end_screen          BOOLEAN DEFAULT false,
  cards_used          INTEGER DEFAULT 0,
  chapters            JSONB,                             -- Array of {time, title} for video chapters
  seo_title           TEXT,                              -- Separate SEO-optimized title
  seo_description     TEXT,
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 6. CONTENT TEMPLATES (reusable strategy templates)
-- =====================================================

CREATE TABLE content_templates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  description         TEXT,
  platform            platform_type NOT NULL,
  
  -- Template strategy defaults
  hook_style          hook_style_type,
  caption_structure   caption_structure_type,
  hashtag_set_id      UUID REFERENCES hashtag_sets(id) ON DELETE SET NULL,
  content_format      content_format_type,
  recommended_length  TEXT,                              -- e.g. "15-30s"
  
  -- Template content
  hook_template       TEXT,                              -- Template text for hook
  caption_template    TEXT,                              -- Template text for caption
  
  is_active           BOOLEAN NOT NULL DEFAULT true,
  user_id             UUID,
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_templates_platform ON content_templates(platform);

-- =====================================================
-- 7. AUTO-UPDATE TIMESTAMPS TRIGGER
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
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_metadata ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access to their own data
CREATE POLICY "Users can manage their own content posts"
  ON content_posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own templates"
  ON content_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public read access for shared resources (hashtags, audio)
CREATE POLICY "Anyone can read hashtag sets"
  ON hashtag_sets FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read audio library"
  ON audio_library FOR SELECT
  USING (true);

-- Authenticated users can insert hashtag sets and audio
CREATE POLICY "Authenticated users can manage hashtag sets"
  ON hashtag_sets FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage audio library"
  ON audio_library FOR ALL
  USING (true)
  WITH CHECK (true);

-- Platform metadata inherits access from content_posts via FK
CREATE POLICY "Users can manage instagram metadata"
  ON instagram_metadata FOR ALL
  USING (EXISTS (
    SELECT 1 FROM content_posts WHERE content_posts.id = instagram_metadata.content_post_id AND content_posts.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage facebook metadata"
  ON facebook_metadata FOR ALL
  USING (EXISTS (
    SELECT 1 FROM content_posts WHERE content_posts.id = facebook_metadata.content_post_id AND content_posts.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage tiktok metadata"
  ON tiktok_metadata FOR ALL
  USING (EXISTS (
    SELECT 1 FROM content_posts WHERE content_posts.id = tiktok_metadata.content_post_id AND content_posts.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage youtube metadata"
  ON youtube_metadata FOR ALL
  USING (EXISTS (
    SELECT 1 FROM content_posts WHERE content_posts.id = youtube_metadata.content_post_id AND content_posts.user_id = auth.uid()
  ));
