-- Add optional expiry for KDS tokens
-- If NULL, token never expires (default for kitchen tablets)
-- If set, token expires at that timestamp

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS kds_token_expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS kds_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Add last_used tracking for audit purposes
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS kds_token_last_used_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS kds_token_last_used_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN restaurants.kds_token_expires_at IS 'Optional expiry for KDS token. NULL = never expires (recommended for permanent kitchen tablets)';
COMMENT ON COLUMN restaurants.kds_token_last_used_at IS 'Last time the KDS token was used to access the KDS';
