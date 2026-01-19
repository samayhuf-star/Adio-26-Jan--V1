-- SQL queries to update Discourse topic view counts
-- Run these in Discourse Admin > Plugins > Data Explorer

-- First, check current views
SELECT id, title, views FROM topics WHERE title LIKE '[Q&A]%' ORDER BY id;

-- Update all Q&A topics with random views between 300-11000
-- Run this query multiple times or use the individual updates below

UPDATE topics 
SET views = floor(random() * (11000-300+1) + 300)::int
WHERE title LIKE '[Q&A]%';

-- Verify the update
SELECT id, title, views FROM topics WHERE title LIKE '[Q&A]%' ORDER BY views DESC LIMIT 20;
