-- Drop the existing check constraint (which might be the one we just made, or the original one)
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check;

-- Add the new check constraint including 'location'
ALTER TABLE messages ADD CONSTRAINT messages_type_check 
CHECK (type IN ('text', 'image', 'audio', 'location'));
