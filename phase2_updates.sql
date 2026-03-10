-- 1. ADD NEW COLUMNS TO LEADS TABLE
ALTER TABLE leads ADD COLUMN IF NOT EXISTS dob VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS loan_amount VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS secondary_name VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS secondary_mobile VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS secondary_pan VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS automation_started_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS kyc_completed_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS current_step VARCHAR(100);

-- 2. CREATE OTP_SESSIONS TABLE (Drop and recreate to match new schema if needed, or just create)
-- We will DROP it first just in case it exists from the old single-file version 
-- and has the wrong columns (the prompt asks for serial ID and lead_id).
DROP TABLE IF EXISTS otp_sessions;

CREATE TABLE otp_sessions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER,
  messenger_id VARCHAR(100),
  otp_type VARCHAR(50),
  otp_value TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  retry_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
