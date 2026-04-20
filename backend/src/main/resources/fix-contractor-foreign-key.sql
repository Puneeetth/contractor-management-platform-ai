-- Fix the foreign key constraint in contracts table to reference contractors instead of users

-- First, drop any existing contracts to avoid foreign key issues
-- Uncomment the following line if you want to clear existing contracts
-- DELETE FROM contracts;

-- Drop the existing foreign key constraint
ALTER TABLE contracts DROP FOREIGN KEY FKf7p85d9kir2jb99ippss5s2h1;

-- Add the new foreign key constraint pointing to contractors table
ALTER TABLE contracts ADD CONSTRAINT FK_contracts_contractor 
FOREIGN KEY (contractor_id) REFERENCES contractors(id);
