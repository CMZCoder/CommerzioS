-- Create listing_questions table
CREATE TABLE IF NOT EXISTS listing_questions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id VARCHAR NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  is_answered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create listing_answers table
CREATE TABLE IF NOT EXISTS listing_answers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id VARCHAR NOT NULL REFERENCES listing_questions(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_qa_questions_service_id ON listing_questions(service_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_user_id ON listing_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_answers_question_id ON listing_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_qa_answers_user_id ON listing_answers(user_id);
