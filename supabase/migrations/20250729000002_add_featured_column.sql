-- Add featured column to albums table
ALTER TABLE albums ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index on featured column for performance
CREATE INDEX idx_albums_featured ON albums(featured) WHERE featured = true;

-- Optional: Comment to document the column
COMMENT ON COLUMN albums.featured IS 'Indicates if the album is featured in the main carousel';