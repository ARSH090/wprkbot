-- 1. Leads table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  messenger_id VARCHAR(50) UNIQUE NOT NULL,
  state VARCHAR(60) DEFAULT 'idle',
  full_name VARCHAR(120),
  mobile VARCHAR(15),
  approved_amount VARCHAR(20),
  job_status VARCHAR(50) DEFAULT 'pending',
  rejection_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  alternate_attempt INTEGER DEFAULT 0,
  original_name VARCHAR(120),
  original_mobile VARCHAR(15),
  screenshot_urls TEXT[],
  otp1_attempts INTEGER DEFAULT 0,
  otp2_attempts INTEGER DEFAULT 0,
  session_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. OTP sessions
CREATE TABLE otp_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  messenger_id VARCHAR(50),
  otp_round INTEGER,
  otp_value VARCHAR(10),
  submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- 3. Automation logs
CREATE TABLE automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  messenger_id VARCHAR(50),
  step VARCHAR(100),
  status VARCHAR(50),
  message TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bot prompts (editable from UI)
CREATE TABLE bot_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state_name VARCHAR(80) UNIQUE NOT NULL,
  response_text TEXT NOT NULL,
  description TEXT,
  scenario_name VARCHAR(80) DEFAULT 'default',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bot settings (all configurable from UI)
CREATE TABLE bot_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(80) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  label VARCHAR(120),
  description TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Scenarios
CREATE TABLE scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(80) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Team members (handled by Supabase Auth)
-- Use Supabase Auth built-in users table + this profiles table:
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name VARCHAR(120),
  role VARCHAR(20) DEFAULT 'operator',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Insert default bot settings
INSERT INTO bot_settings (key, value, label, description) VALUES
('trackloom_url', 'https://trackloom.com/464314?a=UN11887', 'Trackloom URL', 'The intake form URL — change this if the link changes'),
('bajaj_url', 'https://bajajfinserv.in/webfor', 'Bajaj Website URL', 'Bajaj EMI card application URL'),
('vendor_name', 'Rishi', 'Vendor Name', 'Fixed vendor name for Trackloom form — do not change unless told'),
('email_field_value', 'k', 'Email Field Value', 'Value to put in email field on Trackloom'),
('otp_timeout_minutes', '5', 'OTP Timeout (minutes)', 'How long to wait for lead to send OTP'),
('max_otp_attempts', '3', 'Max OTP Attempts', 'How many wrong OTPs allowed before stopping'),
('max_retries', '3', 'Max Automation Retries', 'How many times to retry on timeout error'),
('admin_messenger_id', '', 'Admin Messenger ID', 'Your Facebook Messenger ID for admin notifications'),
('bot_enabled', 'true', 'Bot Status', 'Master on/off switch for the bot'),
('fb_page_access_token', '', 'FB Page Access Token', 'From Facebook Developer Console', TRUE),
('fb_verify_token', 'bajaj_verify_2024', 'FB Webhook Verify Token', 'Custom token for webhook verification');

-- Insert default prompts
INSERT INTO bot_prompts (state_name, response_text, description) VALUES
('greeting', 'Hi! Bajaj EMI Card ke liye aapka naam aur mobile number bhejiye ❤️', 'First message when lead contacts'),
('awaiting_details_invalid', 'Naam aur 10 digit mobile number bhejiye', 'When format is wrong'),
('confirm_details', '{name} - {mobile} sahi hai? Haan/Nahi', 'Confirm before starting'),
('processing_start', 'Active rahiye mai process krta hu ❤️', 'When automation starts'),
('otp1_request', 'Otp dizea 🔢', 'First OTP request'),
('otp_wrong', 'Galat hai otp, sahi se bhejiye', 'When OTP is incorrect'),
('otp2_request', 'Ek last otp dizea 🔢', 'Second OTP request'),
('congratulations', 'Congratulations! ₹{amount} ka offer aaya ❤️', 'After approval'),
('rejected', 'Ni ho skta aapka cibil score achha ni hai aapko kisi or ke documents se Krna prega', 'After rejection'),
('ask_alt_docs', 'Kisi aur ke documents se try karein? Haan likhiye', 'Offer alternative docs'),
('alt_docs_prompt', 'Unka naam aur mobile number bhejiye', 'Ask for alt person details'),
('existing_card', 'Aapka card already hai sir ❤️ Wallet Care lena chahte hain?', 'If already has card'),
('completed', 'Ho gaya ❤️ Aapka process complete hua. Card active ho jayega jaldi', 'On success'),
('timeout_error', 'Server problem aa rahi hai, thodi der baad try karein 🙏', 'On connection timeout'),
('processing_wait', 'Processing chal raha hai... thoda wait karein ❤️', 'During processing');

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies (authenticated users can access)
CREATE POLICY "Authenticated access" ON leads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated access" ON bot_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated access" ON bot_prompts FOR ALL USING (auth.role() = 'authenticated');
