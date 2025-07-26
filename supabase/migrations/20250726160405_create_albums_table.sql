-- Create albums table with enhanced schema for vinyl catalog
CREATE TABLE albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    year INTEGER NOT NULL,
    spotify_id TEXT UNIQUE,
    genres TEXT[] DEFAULT '{}',
    audio_features JSONB,
    personal_vibes TEXT[] DEFAULT '{}',
    thoughts TEXT,
    cover_art_url TEXT,
    streaming_links JSONB DEFAULT '{}',
    tracks JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_albums_artist ON albums(artist);
CREATE INDEX idx_albums_year ON albums(year);
CREATE INDEX idx_albums_spotify_id ON albums(spotify_id);
CREATE INDEX idx_albums_genres ON albums USING GIN(genres);
CREATE INDEX idx_albums_personal_vibes ON albums USING GIN(personal_vibes);
CREATE INDEX idx_albums_created_at ON albums(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_albums_updated_at 
    BEFORE UPDATE ON albums 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) - can be customized later for user-specific data
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations for now (modify as needed for authentication)
CREATE POLICY "Allow all operations on albums" ON albums
    FOR ALL USING (true) WITH CHECK (true);