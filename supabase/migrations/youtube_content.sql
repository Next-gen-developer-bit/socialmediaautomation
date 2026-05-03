-- =====================================================
-- YOUTUBE CONTENT
-- =====================================================

CREATE TABLE youtube_content (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  hook_style        TEXT,       -- e.g. "question", "bold_statement", "storytelling", "statistic", "tutorial", "relatable"
  caption_structure TEXT,       -- e.g. "short_punchy", "listicle", "storytelling", "cta_focused", "educational", "seo_optimized"
  hashtags          TEXT[],     -- e.g. {"#shorts", "#realestate", "#homebuying"}
  audio_used        TEXT,       -- e.g. "Original", "Background - Epidemic Sound", "No Copyright Music"
  length_seconds    INTEGER,    -- Duration in seconds
  format            TEXT,       -- e.g. "short", "video", "live", "premiere", "community_post"

  topic             TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE youtube_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to youtube_content"
  ON youtube_content FOR ALL
  USING (true)
  WITH CHECK (true);
