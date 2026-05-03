-- =====================================================
-- STEP 5: YOUTUBE
-- Run AFTER step1_foundation.sql
-- =====================================================

CREATE TABLE youtube_metadata (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_post_id     UUID NOT NULL UNIQUE REFERENCES content_posts(id) ON DELETE CASCADE,

  post_type           TEXT CHECK (post_type IN ('short', 'video', 'live', 'premiere', 'community_post')),
  thumbnail_url       TEXT,                    -- Custom thumbnail
  video_tags          TEXT[],                  -- YouTube video tags (separate from hashtags)
  category            TEXT,                    -- YouTube category (e.g. "Education")
  end_screen          BOOLEAN DEFAULT false,   -- End screen enabled
  cards_used          INTEGER DEFAULT 0,       -- Number of info cards
  chapters            JSONB,                   -- Array of {time, title} for video chapters
  seo_title           TEXT,                    -- SEO-optimized title
  seo_description     TEXT,                    -- SEO-optimized description

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE youtube_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage youtube metadata"
  ON youtube_metadata FOR ALL
  USING (EXISTS (
    SELECT 1 FROM content_posts
    WHERE content_posts.id = youtube_metadata.content_post_id
      AND content_posts.user_id = auth.uid()
  ));
