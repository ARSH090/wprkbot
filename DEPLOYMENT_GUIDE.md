# FINAL DEPLOYMENT GUIDE
**Bajaj EMI Card Bot**
Phase 2 Complete — Go-Live Checklist
March 2026 | All code built — 3 manual steps remain

## 1. What Was Built — Implementation Summary

All 4 coding tasks from the Continuation Plan have been fully implemented. Here is a summary of every file and route that now exists in the codebase.

| Task | Files & Routes Implemented |
| :--- | :--- |
| **T1 — /connect Facebook OAuth** | • `app/connect/page.tsx` — 4-step wizard UI<br>• `/api/facebook/callback` — OAuth code exchange + long-lived token<br>• `/api/facebook/pages` — saves page token to bot_settings<br>• `/api/facebook/test` — sends test message via Graph API<br>• `/api/facebook/disconnect` — removes token from DB |
| **T2 — /team Supabase Table** | • `app/team/page.tsx` — real team dashboard UI with stats<br>• `/api/team` (GET/POST) — list members + send invites with 5-member limit<br>• `/api/team/[id]` (PATCH/DELETE) — change role + remove with admin protections<br>• `/api/team/resend` — resend Magic Link invite emails |
| **T4 — /training Doc Upload + AI** | • `app/training/page.tsx` — 3 tabs: Config, Learn, Test<br>• `/api/training/analyze` — accepts image/PDF, sends to OpenRouter vision, saves to training_docs<br>• `/api/training/simulate` — loads system_prompt from DB, calls OpenRouter, returns bot reply<br>• `pdf-parse` installed for PDF text extraction |
| **T5 — Puppeteer Service Phase 2** | • `bajaj-puppeteer-service/package.json` + `render.yaml`<br>• `server.js` — full Express + Puppeteer automation with stealth plugin<br>• `POST /automate/start` — complete async automation flow<br>• `POST /otp/submit` — receives OTP from n8n when lead replies<br>• `GET /health` — status + active session count<br>• Backspace trick, OTP polling, screenshot upload, admin notification all implemented |

---

## 2. What Remains — Your 3 Manual Steps to Go Live

Code is 100% complete. These steps cannot be automated — they require you to log in to Supabase, Render, and n8n, and to push your code. Estimated time: 45 minutes total.

### STEP 1 — Run SQL in Supabase (5 minutes)

Go to supabase.com → your project → SQL Editor → New Query → paste and run each block below.

**Table 1: team_members**
```sql
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(20) DEFAULT 'operator'
    CHECK (role IN ('admin', 'operator', 'viewer')),
  invited_by VARCHAR(255),
  invite_token VARCHAR(64),
  invite_accepted BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert yourself as first admin (replace email!)
INSERT INTO team_members (email, full_name, role, invite_accepted)
VALUES ('YOUR-EMAIL@example.com', 'Admin', 'admin', true);
```

**Table 2: training_docs**
```sql
CREATE TABLE training_docs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  analysis JSONB,
  applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Table 3: otp_sessions**
```sql
CREATE TABLE otp_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  messenger_id VARCHAR(100),
  otp_round INTEGER DEFAULT 1,
  otp_value VARCHAR(10),
  submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes')
);
```

**Storage Buckets**
Go to Supabase → Storage → New Bucket for each:
* `screenshots` (set to Public)
* `training-screenshots` (set to Public)

✅ *After Step 1: All 3 tables created. /team, /training, and Puppeteer service will now have the DB tables they need to work.*

---

### STEP 2 — Add Environment Variables on Render (10 minutes)

Go to render.com → Dashboard → click your n8n service → Environment tab → Add Environment Variable for each row below. Then click Save Changes.

**n8n Service — Add These Variables**

| Variable Name | Value / Where to Get It |
| :--- | :--- |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` (from Supabase Settings → API) |
| `SUPABASE_SERVICE_KEY` | Your service_role key (from Supabase Settings → API) |
| `OPENROUTER_API_KEY` | `sk-or-v1-xxxxx` (from openrouter.ai/keys) |
| `FB_PAGE_ACCESS_TOKEN` | Your Facebook Page token (from Meta Developer Portal) |
| `FB_VERIFY_TOKEN` | `bajaj123` (or whatever you set when verifying webhook) |
| `N8N_ENCRYPTION_KEY` | Generate: any random 32-character string |

After saving — go to **Manual Deploy → Deploy Latest Commit**. n8n must restart to load the new variables.

**Puppeteer Service — Create New Service on Render**
`bajaj-puppeteer-service` is a new folder in your repo. Create a separate Render service for it:
1. render.com → New → Web Service → connect your GitHub repo
2. Root Directory: `bajaj-puppeteer-service`
3. Build Command: `npm install`
4. Start Command: `node server.js`

Add these 3 environment variables to the Puppeteer service:
* `SUPABASE_URL` = https://xxxxx.supabase.co
* `SUPABASE_SERVICE_KEY` = your service role key
* `FB_PAGE_ACCESS_TOKEN` = your facebook page token

After deploy, test it: visit `https://bajaj-puppeteer.onrender.com/health` — should return `{ status: 'ok' }`

---

### STEP 3 — Update n8n Workflow Nodes (10 minutes)

Open n8n at https://n8n-1-zlf1.onrender.com → open your Bajaj Bot workflow → update each node listed below. In n8n, environment variables are accessed as `{{ $env.VARIABLE_NAME }}`.

| Node | Change FROM (hardcoded) | Change TO (env variable) |
| :--- | :--- | :--- |
| All Supabase HTTP nodes (URL field) | `https://xxxxx.supabase.co/rest/v1/...` | `{{ $env.SUPABASE_URL }}/rest/v1/...` |
| All Supabase HTTP nodes (apikey header) | `hardcoded service key` | `{{ $env.SUPABASE_SERVICE_KEY }}` |
| All Supabase HTTP nodes (Authorization header) | `Bearer hardcoded_key` | `Bearer {{ $env.SUPABASE_SERVICE_KEY }}` |
| OpenRouter AI node (Authorization header) | `Bearer sk-or-v1-hardcoded` | `Bearer {{ $env.OPENROUTER_API_KEY }}` |
| Send to Facebook node (URL access_token) | `?access_token=hardcoded_token` | `?access_token={{ $env.FB_PAGE_ACCESS_TOKEN }}` |
| Return Challenge node (verify token check) | `=== 'bajaj123'` | `=== $env.FB_VERIFY_TOKEN` |

**Also Add 2 New Nodes to Your Workflow**
After the 'All Data Collected?' YES branch, add a new HTTP Request node to trigger the Puppeteer service:
* Method: `POST`
* URL: `https://bajaj-puppeteer.onrender.com/automate/start`
* Body (JSON):
```json
{
  "messengerId": "{{ $json.messenger_id }}",
  "mobile":      "{{ $json.mobile }}",
  "name":        "{{ $json.name }}",
  "dob":         "{{ $json.dob }}",
  "pan":         "{{ $json.pan }}",
  "aadhaar":     "{{ $json.aadhaar }}",
  "sessionId":   "{{ $json.messenger_id }}_{{ $now.toMillis() }}"
}
```

In your Validate Input node, add handling for OTP states:
```javascript
// When lead state = 'collecting_otp1' AND message is 4-8 digits:
// POST https://bajaj-puppeteer.onrender.com/otp/submit
// { "messengerId": senderId, "otpValue": messageText, "round": 1 }
// Reply to lead: "Submit ho raha hai ❤️"

// When lead state = 'collecting_otp2' AND message is 4-8 digits:
// POST https://bajaj-puppeteer.onrender.com/otp/submit
// { "messengerId": senderId, "otpValue": messageText, "round": 2 }
// Reply to lead: "Submit ho raha hai ❤️"
```

---

### STEP 4 — UptimeRobot (5 minutes, free forever)

Render free tier shuts down after 15 minutes with no traffic. UptimeRobot pings your services every 5 minutes to keep them alive.

1. Go to uptimerobot.com → create a free account
2. Click 'Add New Monitor'
3. Monitor Type: HTTP(s)
4. Friendly Name: Bajaj n8n Keep Alive
5. URL: `https://n8n-1-zlf1.onrender.com/healthz`
6. Monitoring Interval: 5 minutes
7. Click 'Create Monitor'
8. Repeat for Puppeteer service: `https://bajaj-puppeteer.onrender.com/health`

---

### STEP 5 — Git Push to Deploy (5 minutes)

Push all code changes. Vercel auto-deploys the dashboard. Render auto-deploys n8n and the Puppeteer service.

```bash
# In your terminal, from the project root:
git add .
git commit -m "feat: Phase 2 complete — OAuth, team, training, puppeteer"
git push origin main
```

---

## 3. Final Test Checklist — Run After All Steps Done

Run each test in order. If any test fails, the note column tells you where to look.

* [ ] Dashboard loads at your Vercel URL -> *Check Vercel deployment logs*
* [ ] Login page works, redirects to /dashboard -> *Check NextAuth NEXTAUTH_SECRET env var*
* [ ] /connect shows connection status banner -> *Check bot_settings table has fb_page_access_token*
* [ ] Click 'Connect Facebook Page' → FB OAuth opens -> *Check FACEBOOK_APP_ID + FACEBOOK_APP_SECRET in .env.local*
* [ ] /team shows your email as Admin member -> *Check team_members table created + your email inserted*
* [ ] /training — upload a Messenger screenshot → AI analysis appears -> *Check OPENROUTER_API_KEY + training-screenshots Supabase bucket*
* [ ] /training — type a message in simulator → bot replies in Hinglish -> *Check system_prompt in bot_settings + OpenRouter API*
* [ ] Send 'hi' to Facebook Page → bot replies within 3 seconds -> *Check n8n Executions tab green + FB token correct*
* [ ] Complete full conversation (name, mobile, dob, pan, aadhaar) -> *Check Supabase leads table, n8n field validation nodes*
* [ ] Lead status changes to 'processing' when all 5 fields collected -> *Check n8n 'All Data Collected?' IF node*
* [ ] Puppeteer service health: /health returns `{ status: ok }` -> *Check Render Puppeteer service running + env vars set*
* [ ] Automation starts — Trackloom + Bajaj form fill begins -> *Check n8n HTTP node calling /automate/start*
* [ ] OTP message arrives on Messenger ('Otp dizea') -> *Check puppeteer service FB_PAGE_ACCESS_TOKEN*
* [ ] Lead sends OTP → Puppeteer submits it → Congratulations screen -> *Check otp_sessions table + n8n OTP routing nodes*
* [ ] Admin receives screenshot notification on Messenger -> *Check admin_messenger_id in bot_settings*
* [ ] Lead status = 'completed' in /leads dashboard -> *Check Puppeteer updateLead at end of automation*
* [ ] UptimeRobot shows both monitors as green / up -> *Check uptimerobot.com dashboard*
