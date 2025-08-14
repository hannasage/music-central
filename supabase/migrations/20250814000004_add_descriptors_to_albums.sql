-- Add descriptors field to albums table for flags like "Vinyl Exclusive", "Alternate Cover", "Bonus Tracks"
ALTER TABLE albums ADD COLUMN descriptors TEXT[] DEFAULT '{}';

-- Add comment explaining the field
COMMENT ON COLUMN albums.descriptors IS 'Album descriptors/flags: Vinyl Exclusive, Alternate Cover, Bonus Tracks, etc.';