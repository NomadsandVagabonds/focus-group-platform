-- Migration: Remove outdated question_type CHECK constraint
-- Issue: Original constraint only allows 11 question types, but codebase implements 24
-- Impact: Blocks INSERT operations for array variants, new text types, and special types
-- Date: 2026-01-19

-- Drop the existing CHECK constraint on question_type
ALTER TABLE questions 
DROP CONSTRAINT IF EXISTS questions_question_type_check;

-- The question_type column will now accept any TEXT value
-- Validation is handled at the application layer in TypeScript (QuestionType enum)
