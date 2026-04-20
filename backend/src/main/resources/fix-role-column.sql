-- Fix the role column size in users table to accommodate longer enum values
-- like GEO_MANAGER (11 chars), CONTRACTOR (10 chars), etc.

ALTER TABLE users MODIFY COLUMN role VARCHAR(20);
