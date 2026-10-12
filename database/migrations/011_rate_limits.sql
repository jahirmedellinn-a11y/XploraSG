CREATE TABLE IF NOT EXISTS public.rate_limits (
    id VARCHAR(255) PRIMARY KEY,
    endpoint VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 1,
    last_request TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON public.rate_limits(endpoint);
