-- Create a test survey with sample questions
-- Run this in Supabase SQL Editor to test the platform

-- Insert test survey
INSERT INTO surveys (title, description, status, settings)
VALUES (
  'Test Survey - Resonant Platform',
  'A test survey to validate the platform functionality',
  'draft',
  '{
    "format": "group_by_group",
    "theme": "editorial_academic",
    "show_progress_bar": true,
    "allow_backward_navigation": false
  }'::jsonb
)
RETURNING id;

-- Note the survey ID from above, then use it in the following queries
-- Replace 'YOUR_SURVEY_ID' with the actual UUID

-- Insert question group
INSERT INTO question_groups (survey_id, title, description, order_index)
VALUES (
  'YOUR_SURVEY_ID',
  'Demographics',
  'Basic demographic questions',
  0
)
RETURNING id;

-- Note the group ID, then use it below
-- Replace 'YOUR_GROUP_ID' with the actual UUID

-- Insert a text question
INSERT INTO questions (group_id, code, question_text, question_type, order_index, settings)
VALUES (
  'YOUR_GROUP_ID',
  'Q1',
  'What is your name?',
  'text',
  0,
  '{"mandatory": true}'::jsonb
);

-- Insert a multiple choice question
INSERT INTO questions (group_id, code, question_text, question_type, order_index, settings)
VALUES (
  'YOUR_GROUP_ID',
  'Q2',
  'How would you rate your experience?',
  'multiple_choice_single',
  1,
  '{"mandatory": true}'::jsonb
)
RETURNING id;

-- Note the question ID, then add answer options
-- Replace 'YOUR_QUESTION_ID' with the actual UUID

INSERT INTO answer_options (question_id, code, label, order_index)
VALUES
  ('YOUR_QUESTION_ID', 'A1', 'Excellent', 0),
  ('YOUR_QUESTION_ID', 'A2', 'Good', 1),
  ('YOUR_QUESTION_ID', 'A3', 'Fair', 2),
  ('YOUR_QUESTION_ID', 'A4', 'Poor', 3);
