-- Add user_id column to perfis to link with auth.users
ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can read own profile" 
ON public.perfis 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.perfis 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Optional: Index for performance
CREATE INDEX IF NOT EXISTS idx_perfis_user_id ON public.perfis(user_id);
