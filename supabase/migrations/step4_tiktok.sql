-- =====================================================
-- STEP 4: TIKTOK
-- Run AFTER step1_foundation.sql
-- =====================================================

CREATE TABLE tiktok_metadata (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_post_id     UUID NOT NULL UNIQUE REFERENCES content_posts(id) ON DELETE CASCADE,

  post_type           TEXT CHECK (post_type IN ('video', 'duet', 'stitch', 'live', 'photo_mode', 'story')),
  original_sound      BOOLEAN DEFAULT false,   -- Using original sound vs. library audio
  green_screen        BOOLEAN DEFAULT false,    -- Green screen effect used
  effects_used        TEXT[],                   -- TikTok effects / filters applied
  duet_stitch_source  TEXT,                     -- URL of source video for duets/stitches

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE tiktok_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tiktok metadata"
  ON tiktok_metadata FOR ALL
  USING (EXISTS (
    SELECT 1 FROM content_posts
    WHERE content_posts.id = tiktok_metadata.content_post_id
      AND content_posts.user_id = auth.uid()
  ));
