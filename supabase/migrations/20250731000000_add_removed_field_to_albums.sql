-- Add removed field for soft delete functionality
-- This allows marking albums as removed/sold/traded without losing data
ALTER TABLE albums ADD COLUMN removed BOOLEAN DEFAULT false NOT NULL;

-- Update any existing albums to explicitly set removed = false
UPDATE albums SET removed = false WHERE removed IS NULL;

-- Create index for performance when filtering out removed albums
CREATE INDEX idx_albums_removed ON albums(removed);

-- Create composite index for common queries (active albums only)
CREATE INDEX idx_albums_active_created_at ON albums(created_at) WHERE removed = false;
CREATE INDEX idx_albums_active_featured ON albums(featured) WHERE removed = false;
CREATE INDEX idx_albums_active_artist ON albums(artist) WHERE removed = false;

-- Add comment for documentation
COMMENT ON COLUMN albums.removed IS 'Soft delete flag - true when album is removed from collection (sold, traded, etc)';