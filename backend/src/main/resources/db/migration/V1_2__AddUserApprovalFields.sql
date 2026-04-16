-- Database Migration for User Approval System
-- File: V1_2__AddUserApprovalFields.sql
-- Description: Add approval workflow fields to users table

-- Add new columns to users table
ALTER TABLE users ADD COLUMN approval_reason VARCHAR(255);
ALTER TABLE users ADD COLUMN approved_by BIGINT;
ALTER TABLE users ADD COLUMN approval_date TIMESTAMP;
ALTER TABLE users ADD COLUMN registered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Add foreign key for approved_by
ALTER TABLE users ADD CONSTRAINT fk_users_approved_by 
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX idx_status ON users(status);
CREATE INDEX idx_role_status ON users(role, status);
CREATE INDEX idx_approved_by ON users(approved_by);
CREATE INDEX idx_registered_date ON users(registered_date);
CREATE INDEX idx_approval_date ON users(approval_date);

-- Update all existing users to have APPROVED status and registered_date
UPDATE users SET 
  status = 'APPROVED',
  registered_date = CURRENT_TIMESTAMP
WHERE registered_date IS NULL;

-- Optional: Set approval_date for existing users
UPDATE users SET 
  approval_date = CURRENT_TIMESTAMP
WHERE status = 'APPROVED' AND approval_date IS NULL;

-- Verify the changes
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as total_users, 
       COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_users,
       COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_users,
       COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_users
FROM users;
