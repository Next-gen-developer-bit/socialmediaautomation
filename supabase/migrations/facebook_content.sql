-- =====================================================
-- FACEBOOK CONTENT
-- =====================================================

CREATE TABLE facebook_content (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  hook_style        TEXT,       -- e.g. "question", "bold_statement", "storytelling", "statistic", "tutorial", "relatable"
  caption_structure TEXT,       -- e.g. "short_punchy", "listicle", "storytelling", "cta_focused", "educational"
  hashtags          TEXT[],     -- e.g. {"#realestate", "#homebuying", "#tips"}
  audio_used        TEXT,       -- e.g. "No audio", "Background music - Chill Lo-fi"
  length_seconds    INTEGER,    -- Duration in seconds
  format            TEXT,       -- e.g. "reel", "story", "video", "photo", "text_post", "link", "live"

  topic             TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE facebook_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to facebook_content"
  ON facebook_content FOR ALL
  USING (true)
  WITH CHECK (true);
