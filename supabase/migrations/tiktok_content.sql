-- =====================================================
-- TIKTOK CONTENT
-- =====================================================

CREATE TABLE tiktok_content (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  hook_style        TEXT,       -- e.g. "question", "bold_statement", "storytelling", "statistic", "tutorial", "relatable"
  caption_structure TEXT,       -- e.g. "short_punchy", "listicle", "storytelling", "cta_focused", "minimal"
  hashtags          TEXT[],     -- e.g. {"#fyp", "#realestate", "#housetour"}
  audio_used        TEXT,       -- e.g. "Original Sound", "Trending - Die With A Smile by Lady Gaga"
  length_seconds    INTEGER,    -- Duration in seconds
  format            TEXT,       -- e.g. "video", "duet", "stitch", "live", "photo_mode", "story"

  topic             TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tiktok_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to tiktok_content"
  ON tiktok_content FOR ALL
  USING (true)
  WITH CHECK (true);
