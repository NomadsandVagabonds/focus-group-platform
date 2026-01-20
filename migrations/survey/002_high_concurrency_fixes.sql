-- Migration: High Concurrency Fixes for Prolific Launch
-- Run this BEFORE launching a high-volume survey (5000+ participants)
-- Date: 2026-01-19
-- Updated: 2026-01-19 - Added UNIQUE constraint on survey_responses

-- ============================================================================
-- 0. MOST CRITICAL: Prevent duplicate Prolific participant responses
-- ============================================================================
-- This UNIQUE constraint prevents race conditions where the same participant
-- could accidentally get two response records created simultaneously.
-- The check-then-insert in page.tsx is NOT atomic without this.

-- First, identify and handle any existing duplicates (keep the most complete one)
-- This query shows duplicates - review before deleting
-- SELECT survey_id, participant_id, COUNT(*), array_agg(id)
-- FROM survey_responses
-- WHERE participant_id IS NOT NULL
-- GROUP BY survey_id, participant_id
-- HAVING COUNT(*) > 1;

-- Clean up duplicates if any exist (keeps the one with completed_at set, or most recent)
DELETE FROM survey_responses a
USING survey_responses b
WHERE a.id < b.id
  AND a.survey_id = b.survey_id
  AND a.participant_id = b.participant_id
  AND a.participant_id IS NOT NULL
  AND (
    b.status = 'complete' OR  -- Keep complete over incomplete
    (a.status != 'complete' AND b.started_at > a.started_at) -- Keep more recent
  );

-- Add the UNIQUE constraint for participant deduplication
-- This is PARTIAL - only applies when participant_id is NOT NULL
-- Anonymous responses (NULL participant_id) are allowed to have duplicates
ALTER TABLE survey_responses
  ADD CONSTRAINT survey_responses_unique_participant
  UNIQUE (survey_id, participant_id);

-- ============================================================================
-- 1. CRITICAL: Add unique constraint to response_data for proper upserts
-- ============================================================================
-- This prevents duplicate answer rows when concurrent requests arrive
-- The upsert logic in the API depends on this constraint

-- First, clean up any existing duplicates (keep the most recent)
DELETE FROM response_data a
USING response_data b
WHERE a.id < b.id
  AND a.response_id = b.response_id
  AND a.question_id = b.question_id
  AND COALESCE(a.subquestion_id::text, '') = COALESCE(b.subquestion_id::text, '');

-- Now add the unique constraint
ALTER TABLE response_data
  ADD CONSTRAINT response_data_unique_answer
  UNIQUE (response_id, question_id, subquestion_id);

-- ============================================================================
-- 2. Add composite indexes for high-concurrency operations
-- ============================================================================

-- Index for checking existing responses (prevents duplicate response creation)
-- Note: The UNIQUE constraint above also creates an index, but this explicit
-- index can help with non-participant lookups
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_participant
  ON survey_responses(survey_id, participant_id);

-- Index for status-based filtering (quota checking, analytics)
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_status
  ON survey_responses(survey_id, status);

-- Index for completion time analytics
CREATE INDEX IF NOT EXISTS idx_survey_responses_completed_at
  ON survey_responses(completed_at)
  WHERE completed_at IS NOT NULL;

-- Composite index for response_data upserts (the most critical for performance)
CREATE INDEX IF NOT EXISTS idx_response_data_response_question_subquestion
  ON response_data(response_id, question_id, subquestion_id);

-- ============================================================================
-- 3. Optimize quota checking
-- ============================================================================

-- Index for quota lookups by survey
CREATE INDEX IF NOT EXISTS idx_survey_quotas_survey_id
  ON survey_quotas(survey_id)
  WHERE is_active = true;

-- ============================================================================
-- 4. Session/Prolific ID index for deduplication
-- ============================================================================

-- Index for session-based lookups (Prolific SESSION_ID)
CREATE INDEX IF NOT EXISTS idx_survey_responses_session_id
  ON survey_responses(session_id)
  WHERE session_id IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================================
-- Check constraint was added:
-- SELECT conname FROM pg_constraint WHERE conname = 'response_data_unique_answer';
--
-- Check indexes were created:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'response_data';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'survey_responses';
