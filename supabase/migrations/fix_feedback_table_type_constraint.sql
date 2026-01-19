-- Fix feedback table type constraint to match code
-- This migration updates the CHECK constraint to allow 'feature_request' instead of 'feature'

-- Drop the old constraint if it exists
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_type_check;

-- Add the new constraint with the correct values
ALTER TABLE feedback 
  ADD CONSTRAINT feedback_type_check 
  CHECK (type IN ('feedback', 'feature_request'));

-- If there are any existing records with 'feature', update them to 'feature_request'
UPDATE feedback 
SET type = 'feature_request' 
WHERE type = 'feature';

