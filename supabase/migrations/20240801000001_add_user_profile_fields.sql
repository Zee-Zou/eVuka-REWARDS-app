-- Add new columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create a unique index on username to ensure uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles (username);
