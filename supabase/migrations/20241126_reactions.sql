-- Reactions/Likes System
-- Users can like posts and comments

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like', -- 'like', 'love', 'haha', etc (future)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can only react once per post/comment
  CONSTRAINT unique_user_post_reaction UNIQUE (user_id, post_id),
  CONSTRAINT unique_user_comment_reaction UNIQUE (user_id, comment_id),
  
  -- Must have either post_id or comment_id, but not both
  CONSTRAINT check_reaction_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read reactions
CREATE POLICY "Public can view reactions"
ON reactions FOR SELECT
TO public
USING (true);

-- Allow authenticated users to create reactions
CREATE POLICY "Authenticated users can create reactions"
ON reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own reactions
CREATE POLICY "Users can delete own reactions"
ON reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_reactions_comment_id ON reactions(comment_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE INDEX idx_reactions_profile_id ON reactions(profile_id);

-- Function to get reaction count for a post
CREATE OR REPLACE FUNCTION get_post_reaction_count(p_post_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM reactions
    WHERE post_id = p_post_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has reacted to a post
CREATE OR REPLACE FUNCTION user_has_reacted_to_post(p_user_id UUID, p_post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM reactions
    WHERE user_id = p_user_id AND post_id = p_post_id
  );
END;
$$ LANGUAGE plpgsql;

