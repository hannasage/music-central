-- Update RLS policies to allow public read access while keeping write operations admin-only

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view albums" ON albums;
DROP POLICY IF EXISTS "Authenticated users can insert albums" ON albums;
DROP POLICY IF EXISTS "Authenticated users can update albums" ON albums;
DROP POLICY IF EXISTS "Authenticated users can delete albums" ON albums;

-- Create new policies
-- Allow anyone to read albums (public access)
CREATE POLICY "Anyone can view albums" ON albums
    FOR SELECT USING (true);

-- Only authenticated users can insert, update, delete (admin-only operations)
CREATE POLICY "Authenticated users can insert albums" ON albums
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update albums" ON albums
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete albums" ON albums
    FOR DELETE USING (auth.role() = 'authenticated');