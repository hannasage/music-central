-- Update RLS policies to require authentication

-- Drop the existing policy that allows all operations
DROP POLICY IF EXISTS "Allow all operations on albums" ON albums;

-- Create new policies that require authentication
CREATE POLICY "Authenticated users can view albums" ON albums
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert albums" ON albums
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update albums" ON albums
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete albums" ON albums
    FOR DELETE USING (auth.role() = 'authenticated');