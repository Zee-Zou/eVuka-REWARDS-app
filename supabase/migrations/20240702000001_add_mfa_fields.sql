-- Add TOTP secret and MFA enabled fields to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS totp_secret TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;

-- Enable realtime for user_profiles table
alter publication supabase_realtime add table user_profiles;
