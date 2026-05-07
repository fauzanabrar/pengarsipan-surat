-- Drop existing tables and enums to start fresh
-- WARNING: This will delete all data!

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quiz_topics CASCADE;
DROP TABLE IF EXISTS course_modules CASCADE;
DROP TABLE IF EXISTS topic_courses CASCADE;
DROP TABLE IF EXISTS topic_quizzes CASCADE;
DROP TABLE IF EXISTS topic_series CASCADE;
DROP TABLE IF EXISTS video_episodes CASCADE;
DROP TABLE IF EXISTS blog_contents CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS library_items CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS video_series CASCADE;

-- Drop PR-related tables
DROP TABLE IF EXISTS approval_logs CASCADE;
DROP TABLE IF EXISTS pr_items CASCADE;
DROP TABLE IF EXISTS purchase_requests CASCADE;

-- Drop users table (optional - comment out if you want to keep users)
DROP TABLE IF EXISTS users CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS pr_state CASCADE;
DROP TYPE IF EXISTS role CASCADE;
DROP TYPE IF EXISTS module_type CASCADE;
DROP TYPE IF EXISTS difficulty_level CASCADE;
