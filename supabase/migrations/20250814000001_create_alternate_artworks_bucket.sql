-- Create storage bucket for alternate album artworks
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'alternate-artworks',
  'alternate-artworks', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Create policy to allow public read access to alternate artworks
CREATE POLICY "Public read access for alternate artworks" ON storage.objects
FOR SELECT USING (bucket_id = 'alternate-artworks');

-- Create policy to allow authenticated users to upload alternate artworks
CREATE POLICY "Authenticated users can upload alternate artworks" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'alternate-artworks' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow users to update their own uploads
CREATE POLICY "Users can update their own alternate artworks" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'alternate-artworks' 
  AND auth.uid() = owner
) WITH CHECK (
  bucket_id = 'alternate-artworks' 
  AND auth.uid() = owner
);

-- Create policy to allow users to delete their own uploads
CREATE POLICY "Users can delete their own alternate artworks" ON storage.objects
FOR DELETE USING (
  bucket_id = 'alternate-artworks' 
  AND auth.uid() = owner
);