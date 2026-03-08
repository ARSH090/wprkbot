-- Run this in your Supabase SQL Editor to create the admin_users table

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: You will need to manually insert your first admin user with a hashed password.
-- Below is an example of inserting an admin user.
-- The password is 'password123' hashed with bcrypt.
-- INSERT INTO public.admin_users (email, password_hash)
-- VALUES ('admin@example.com', '$2a$10$wT0XFzZqE/.4AOB2h0lMvuLqD.CjMhZ4MvK6E2H/h6b9F/E1ePyeO');

-- Row Level Security (RLS) - Optional but recommended
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (or the service role)
CREATE POLICY "Allow server-side access to admin_users"
ON public.admin_users
FOR SELECT
TO authenticated, service_role
USING (true);
