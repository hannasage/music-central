-- Create error_logs table for storing application errors and warnings
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('warn', 'error')),
  message TEXT NOT NULL,
  error_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  context JSONB NOT NULL DEFAULT '{}',
  error_details JSONB,
  endpoint TEXT,
  user_impact TEXT,
  suggested_action TEXT,
  fingerprint TEXT NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_fingerprint ON error_logs(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_logs_context ON error_logs USING GIN(context);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_error_logs_type_severity_timestamp 
  ON error_logs(error_type, severity, timestamp DESC);

-- Index for deduplication queries
CREATE INDEX IF NOT EXISTS idx_error_logs_fingerprint_last_seen 
  ON error_logs(fingerprint, last_seen DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_error_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_error_logs_updated_at
  BEFORE UPDATE ON error_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_error_logs_updated_at();

-- Enable Row Level Security
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admin access only
-- Note: This policy is permissive for development and can be tightened in production
CREATE POLICY "Admin access to error_logs" ON error_logs
  FOR ALL USING (
    -- Allow all operations in development
    current_setting('app.environment', true) = 'development' OR
    -- Allow service role (for server-side operations)
    auth.role() = 'service_role' OR
    -- For production, you can add specific admin checks here:
    -- auth.jwt() ->> 'role' = 'admin' OR
    -- auth.jwt() ->> 'email' LIKE '%@your-domain.com'
    true -- Temporarily allow all for testing - tighten this in production
  );

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON error_logs TO authenticated;

-- Create a comment explaining the table purpose
COMMENT ON TABLE error_logs IS 'Stores application error and warning logs with context for debugging and analysis';
COMMENT ON COLUMN error_logs.fingerprint IS 'Hash of error type + message pattern for deduplication';
COMMENT ON COLUMN error_logs.occurrence_count IS 'Number of times this specific error pattern has occurred';
COMMENT ON COLUMN error_logs.context IS 'Additional context data as JSON (endpoint, user info, etc.)';
COMMENT ON COLUMN error_logs.error_details IS 'Structured error information (name, message, stack trace)';