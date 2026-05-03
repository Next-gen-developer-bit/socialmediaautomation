-- =====================================================
-- INSTAGRAM CONTENT
-- =====================================================

CREATE TABLE instagram_content (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  hook_style        TEXT,       -- e.g. "question", "bold_statement", "storytelling", "statistic", "tutorial", "relatable"
  caption_structure TEXT,       -- e.g. "short_punchy", "listicle", "storytelling", "cta_focused", "educational"
  hashtags          TEXT[],     -- e.g. {"#realestate", "#homeselling", "#realtor"}
  audio_used        TEXT,       -- e.g. "Trending - Original Sound by @creator" or song name
  length_seconds    INTEGER,    -- Duration in seconds
  format            TEXT,       -- e.g. "reel", "story", "carousel", "single_image", "live"

  topic             TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE instagram_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to instagram_content"
  ON instagram_content FOR ALL
  USING (true)
  WITH CHECK (true);
