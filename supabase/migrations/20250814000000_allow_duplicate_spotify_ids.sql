-- Remove UNIQUE constraint from spotify_id to allow duplicate variants, alternate covers, and vinyl exclusives
ALTER TABLE albums DROP CONSTRAINT IF EXISTS albums_spotify_id_key;

-- Keep the index for performance but remove uniqueness
DROP INDEX IF EXISTS idx_albums_spotify_id;
CREATE INDEX idx_albums_spotify_id ON albums(spotify_id);