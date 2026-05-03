-- =====================================================
-- STEP 3: FACEBOOK
-- Run AFTER step1_foundation.sql
-- =====================================================

CREATE TABLE facebook_metadata (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_post_id     UUID NOT NULL UNIQUE REFERENCES content_posts(id) ON DELETE CASCADE,

  post_type           TEXT CHECK (post_type IN ('reel', 'story', 'video', 'photo', 'text', 'link', 'live', 'event')),
  group_id            TEXT,                    -- If posted to a specific group
  page_id             TEXT,                    -- If posted to a specific page
  boost_budget        DECIMAL(10,2),           -- Paid boost amount in USD
  target_demographics TEXT,                    -- Target audience for boost

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE facebook_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage facebook metadata"
  ON facebook_metadata FOR ALL
  USING (EXISTS (
    SELECT 1 FROM content_posts
    WHERE content_posts.id = facebook_metadata.content_post_id
      AND content_posts.user_id = auth.uid()
  ));
