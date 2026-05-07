-- Clean existing data before schema migration
-- This removes all data from tables that will be affected by the new schema

-- Delete data from dependent tables first
DELETE FROM quiz_attempts;
DELETE FROM quiz_questions;
DELETE FROM quiz_topics;
DELETE FROM course_modules;
DELETE FROM topic_courses;
DELETE FROM topic_quizzes;
DELETE FROM topic_series;
DELETE FROM video_episodes;
DELETE FROM blog_contents;

-- Delete data from main tables
DELETE FROM quizzes;
DELETE FROM courses;
DELETE FROM blog_posts;
DELETE FROM library_items;
DELETE FROM topics;
DELETE FROM video_series;

-- Delete existing PR data (if any)
DELETE FROM approval_logs;
DELETE FROM pr_items;
DELETE FROM purchase_requests;

-- Note: We keep users table data but you may want to clean it too
-- DELETE FROM users;
