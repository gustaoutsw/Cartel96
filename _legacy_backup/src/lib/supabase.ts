import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vxjwwcfwhlijligsagrc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4and3Y2Z3aGxpamxpZ3NhZ3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MzY4NzMsImV4cCI6MjA4MzIxMjg3M30.JxcIl_kMjbQxdzbyC6JrtTHm7D_v5PnRQjYDROME_-Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);