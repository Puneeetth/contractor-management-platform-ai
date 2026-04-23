-- Database Migration to fix contract status column length
-- File: V1_3__FixContractStatusColumn.sql
-- Description: Increase status column length to accommodate 'UPCOMING' status

ALTER TABLE contracts MODIFY COLUMN status VARCHAR(10) NOT NULL;