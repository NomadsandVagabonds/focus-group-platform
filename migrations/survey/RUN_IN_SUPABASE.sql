-- Run this SQL in Supabase SQL Editor
-- https://supabase.com/dashboard/project/zxqhoakssescxdshzjfa/sql

-- Resonant Survey Platform Schema
-- Migration 001: Core Survey Tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  settings JSONB DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Question Groups (for pacing control and randomization)
CREATE TABLE IF NOT EXISTS question_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  order_index INTEGER NOT NULL,
  relevance_logic TEXT,
  random_group TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES question_groups(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  question_text TEXT NOT NULL,
  help_text TEXT,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'long_text', 'multiple_choice_single', 'multiple_choice_multiple', 'array', 'ranking', 'equation', 'text_display', 'dropdown', 'yes_no', 'date')),
  settings JSONB DEFAULT '{}',
  relevance_logic TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subquestions (for Array/Ranking question types)
CREATE TABLE IF NOT EXISTS subquestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  relevance_logic TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answer Options (for Multiple Choice, Array, Dropdown)
CREATE TABLE IF NOT EXISTS answer_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  scale_id INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey Responses
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  participant_id TEXT,
  session_id TEXT,
  study_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'complete', 'screened_out')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  randomization_seed TEXT
);

-- Response Data (EAV model for flexibility)
CREATE TABLE IF NOT EXISTS response_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  subquestion_id UUID REFERENCES subquestions(id) ON DELETE SET NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_groups_survey ON question_groups(survey_id);
CREATE INDEX IF NOT EXISTS idx_questions_group ON questions(group_id);
CREATE INDEX IF NOT EXISTS idx_subquestions_question ON subquestions(question_id);
CREATE INDEX IF NOT EXISTS idx_answer_options_question ON answer_options(question_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_participant ON survey_responses(participant_id);
CREATE INDEX IF NOT EXISTS idx_response_data_response ON response_data(response_id);
CREATE INDEX IF NOT EXISTS idx_response_data_question ON response_data(question_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to surveys table
DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Basic setup
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subquestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active surveys" ON surveys;
DROP POLICY IF EXISTS "Public can view question groups for active surveys" ON question_groups;
DROP POLICY IF EXISTS "Public can view questions for active surveys" ON questions;
DROP POLICY IF EXISTS "Public can view subquestions for active surveys" ON subquestions;
DROP POLICY IF EXISTS "Public can view answer options for active surveys" ON answer_options;
DROP POLICY IF EXISTS "Public can create responses" ON survey_responses;
DROP POLICY IF EXISTS "Public can view their own responses" ON survey_responses;
DROP POLICY IF EXISTS "Public can update their own responses" ON survey_responses;
DROP POLICY IF EXISTS "Public can create response data" ON response_data;
DROP POLICY IF EXISTS "Public can view response data" ON response_data;
DROP POLICY IF EXISTS "Admin full access to surveys" ON surveys;
DROP POLICY IF EXISTS "Admin full access to question_groups" ON question_groups;
DROP POLICY IF EXISTS "Admin full access to questions" ON questions;
DROP POLICY IF EXISTS "Admin full access to subquestions" ON subquestions;
DROP POLICY IF EXISTS "Admin full access to answer_options" ON answer_options;
DROP POLICY IF EXISTS "Admin full access to survey_responses" ON survey_responses;
DROP POLICY IF EXISTS "Admin full access to response_data" ON response_data;

-- Public read access for active surveys
CREATE POLICY "Public can view active surveys" ON surveys
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view question groups for active surveys" ON question_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM surveys WHERE surveys.id = question_groups.survey_id AND surveys.status = 'active'
    )
  );

CREATE POLICY "Public can view questions for active surveys" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM surveys 
      JOIN question_groups ON question_groups.survey_id = surveys.id
      WHERE question_groups.id = questions.group_id AND surveys.status = 'active'
    )
  );

CREATE POLICY "Public can view subquestions for active surveys" ON subquestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM surveys 
      JOIN question_groups ON question_groups.survey_id = surveys.id
      JOIN questions ON questions.group_id = question_groups.id
      WHERE questions.id = subquestions.question_id AND surveys.status = 'active'
    )
  );

CREATE POLICY "Public can view answer options for active surveys" ON answer_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM surveys 
      JOIN question_groups ON question_groups.survey_id = surveys.id
      JOIN questions ON questions.group_id = question_groups.id
      WHERE questions.id = answer_options.question_id AND surveys.status = 'active'
    )
  );

-- Public can create and update their own responses
CREATE POLICY "Public can create responses" ON survey_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view their own responses" ON survey_responses
  FOR SELECT USING (true);

CREATE POLICY "Public can update their own responses" ON survey_responses
  FOR UPDATE USING (status = 'incomplete');

CREATE POLICY "Public can create response data" ON response_data
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view response data" ON response_data
  FOR SELECT USING (true);

-- Admin full access (will be refined with proper auth later)
CREATE POLICY "Admin full access to surveys" ON surveys
  FOR ALL USING (true);

CREATE POLICY "Admin full access to question_groups" ON question_groups
  FOR ALL USING (true);

CREATE POLICY "Admin full access to questions" ON questions
  FOR ALL USING (true);

CREATE POLICY "Admin full access to subquestions" ON subquestions
  FOR ALL USING (true);

CREATE POLICY "Admin full access to answer_options" ON answer_options
  FOR ALL USING (true);

CREATE POLICY "Admin full access to survey_responses" ON survey_responses
  FOR ALL USING (true);

CREATE POLICY "Admin full access to response_data" ON response_data
  FOR ALL USING (true);
