-- Drop the existing check constraint
ALTER TABLE messages DROP CONSTRAINT messages_type_check;

-- Add the new check constraint including 'audio'
ALTER TABLE messages ADD CONSTRAINT messages_type_check CHECK (type IN ('text', 'image', 'audio'));
