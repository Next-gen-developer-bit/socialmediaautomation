-- =====================================================
-- STEP 2: INSTAGRAM
-- Run AFTER step1_foundation.sql
-- =====================================================

CREATE TABLE instagram_metadata (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_post_id     UUID NOT NULL UNIQUE REFERENCES content_posts(id) ON DELETE CASCADE,

  post_type           TEXT CHECK (post_type IN ('reel', 'story', 'carousel', 'single_image', 'live', 'guide')),
  carousel_count      INTEGER,                -- Number of slides if carousel
  cover_image_url     TEXT,                    -- Cover / thumbnail image
  collab_accounts     TEXT[],                  -- Collab / tagged accounts
  location_tag        TEXT,                    -- Location tag
  shop_tags           TEXT[],                  -- Product tags for IG Shopping

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE instagram_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage instagram metadata"
  ON instagram_metadata FOR ALL
  USING (EXISTS (
    SELECT 1 FROM content_posts
    WHERE content_posts.id = instagram_metadata.content_post_id
      AND content_posts.user_id = auth.uid()
  ));
