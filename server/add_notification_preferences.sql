-- ============================================================
-- Add Notification Preferences to Profiles Table
-- Migration for Task 12.12: Add notification preferences
-- ============================================================

-- Add notificationPreferences JSONB column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB DEFAULT '{
  "mentorshipRequests": true,
  "mentorshipApprovals": true,
  "tutoringSessionScheduled": true,
  "tutoringSessionReminders": true,
  "forumReplies": true,
  "forumMentions": true,
  "quizGrades": true,
  "quizAssignments": true,
  "courseUpdates": true,
  "directMessages": true
}'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN public.profiles."notificationPreferences" IS 'User notification preferences stored as JSONB. Controls which notifications the user wants to receive.';

-- Create index for faster queries on notification preferences
CREATE INDEX IF NOT EXISTS idx_profiles_notification_prefs ON public.profiles USING GIN ("notificationPreferences");

-- Update existing profiles to have default notification preferences if they don't have any
UPDATE public.profiles 
SET "notificationPreferences" = '{
  "mentorshipRequests": true,
  "mentorshipApprovals": true,
  "tutoringSessionScheduled": true,
  "tutoringSessionReminders": true,
  "forumReplies": true,
  "forumMentions": true,
  "quizGrades": true,
  "quizAssignments": true,
  "courseUpdates": true,
  "directMessages": true
}'::jsonb
WHERE "notificationPreferences" IS NULL;
