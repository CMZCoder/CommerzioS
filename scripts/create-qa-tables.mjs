// Script to create Q&A tables
import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTables() {
    const client = await pool.connect();
    try {
        console.log('Creating listing_questions table...');
        await client.query(`
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
    `);
        console.log('✓ listing_questions table created');

        console.log('Creating listing_answers table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS listing_answers (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id VARCHAR NOT NULL REFERENCES listing_questions(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
        console.log('✓ listing_answers table created');

        console.log('Creating indexes...');
        await client.query(`CREATE INDEX IF NOT EXISTS idx_qa_questions_service_id ON listing_questions(service_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_qa_questions_user_id ON listing_questions(user_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_qa_answers_question_id ON listing_answers(question_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_qa_answers_user_id ON listing_answers(user_id);`);
        console.log('✓ All indexes created');

        console.log('\n✅ Q&A tables created successfully!');
    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

createTables();
