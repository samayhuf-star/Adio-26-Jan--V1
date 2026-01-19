-- Update feedback table type constraint to match code
-- The code uses 'feature_request' but the table currently expects 'feature'

-- Drop the old constraint
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_type_check;

-- Add the new constraint with the correct values that match the code
ALTER TABLE feedback 
  ADD CONSTRAINT feedback_type_check 
  CHECK (type IN ('feedback', 'feature_request'));

-- Update any existing records (if any exist) from 'feature' to 'feature_request'
UPDATE feedback 
SET type = 'feature_request' 
WHERE type = 'feature';

