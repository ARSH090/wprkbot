"use client";

import { useState } from "react";

const STATUS = {
    done: { label: "WORKING", color: "#00FF87", bg: "#00FF8712" },
    partial: { label: "PARTIAL", color: "#F59E0B", bg: "#F59E0B12" },
    broken: { label: "NOT WORKING", color: "#EF4444", bg: "#EF444412" },
    pending: { label: "NOT BUILT", color: "#6366F1", bg: "#6366F112" },
};

const PAGES = [
    { page: "/dashboard", status: "done", note: "Real-time stats, activity feed — fully working" },
    { page: "/leads", status: "done", note: "Search, filter, CSV export, retry button — working" },
    { page: "/settings", status: "done", note: "OpenRouter key, system prompt, n8n URL — working" },
    { page: "/training", status: "partial", note: "Prompt editor works, document upload is mock only" },
    { page: "/connect", status: "broken", note: "No real Facebook OAuth — manual token only" },
    { page: "/team", status: "broken", note: "Hardcoded dummy data — no real Supabase table" },
    { page: "/login", status: "done", note: "NextAuth email/password — working" },
];

const TASKS = [
    {
        id: "T1",
        priority: "P0",
        title: "Fix /connect — Real Facebook OAuth",
        color: "#EF4444",
        icon: "💬",
        time: "~45 min",
        why: "Without this, you manually copy-paste tokens every time. Real OAuth = admin connects FB page from dashboard in 3 clicks.",
        prompt: `You are working on an existing Next.js 14 dashboard for a Bajaj EMI Card bot.

EXISTING PROJECT CONTEXT:
- Next.js 14 App Router, Tailwind CSS dark theme
- NextAuth.js for auth (email/password)
- Supabase for database
- Facebook Messenger API integration
- n8n on Render for automation
- OpenRouter for AI (NOT OpenAI)

ENVIRONMENT VARIABLES ALREADY SET:
  FACEBOOK_APP_ID = from Meta Developer Portal
  FACEBOOK_APP_SECRET = from Meta Developer Portal
  NEXT_PUBLIC_SUPABASE_URL = set
  SUPABASE_SERVICE_KEY = set
  NEXTAUTH_SECRET = set

TASK: Fix the /connect page with REAL Facebook OAuth.

Current state: /connect page is a mock with no real functionality.
Goal: Admin can connect their Facebook Page from the dashboard UI.

BUILD THIS COMPLETE FLOW:

1. FILE: app/(dashboard)/connect/page.jsx
   
   Show connection status at top:
   - Check bot_settings table for 'fb_page_access_token' key
   - If exists: show GREEN banner "✅ Connected to Facebook — Page: [page_name]"
   - If not: show RED banner "❌ Not Connected"

   CONNECTION WIZARD (4 steps shown as progress):
   
   STEP 1 — Connect with Facebook button:
   - Big blue "Connect Facebook Page" button
   - Clicking it redirects to FB OAuth:
     https://www.facebook.com/v18.0/dialog/oauth?
       client_id={FACEBOOK_APP_ID}
       &redirect_uri={NEXTAUTH_URL}/api/facebook/callback
       &scope=pages_manage_metadata,pages_messaging,pages_read_engagement
       &response_type=code
   
   STEP 2 — After OAuth returns, shows list of user's FB Pages
   - User selects which page to use for the bot
   - Each page shown with name, page ID, category
   
   STEP 3 — Generate Page Access Token
   - After page selected, auto-generate long-lived page token
   - Show token (masked) with copy button
   - Save to bot_settings table: key='fb_page_access_token', value=token
   - Also save: key='fb_page_id', value=pageId
   - Also save: key='fb_page_name', value=pageName
   
   STEP 4 — Webhook status
   - Show webhook URL: https://n8n-1-zlf1.onrender.com/webhook/bajaj-verify
   - Show verify token: bajaj123
   - Instructions to paste these in Meta Developer Portal
   - "Test Connection" button that sends a test message to the page
   - Shows ✅ or ❌ result

2. FILE: app/api/facebook/callback/route.js
   
   Handles the OAuth redirect from Facebook.
   
   GET handler:
   - Gets 'code' from query params
   - Exchanges code for user access token:
     GET https://graph.facebook.com/v18.0/oauth/access_token
       ?client_id={FACEBOOK_APP_ID}
       &client_secret={FACEBOOK_APP_SECRET}  
       &redirect_uri={NEXTAUTH_URL}/api/facebook/callback
       &code={code}
   - Gets list of pages with their tokens:
     GET https://graph.facebook.com/v18.0/me/accounts
       ?access_token={userAccessToken}
   - Gets long-lived token:
     GET https://graph.facebook.com/v18.0/oauth/access_token
       ?grant_type=fb_exchange_token
       &client_id={FACEBOOK_APP_ID}
       &client_secret={FACEBOOK_APP_SECRET}
       &fb_exchange_token={shortLivedToken}
   - Redirects to /connect?pages=[JSON encoded pages list]

3. FILE: app/api/facebook/pages/route.js
   
   POST handler — saves selected page token to Supabase:
   - Gets { pageId, pageAccessToken, pageName } from body
   - Upserts to bot_settings:
     fb_page_access_token = pageAccessToken
     fb_page_id = pageId  
     fb_page_name = pageName
   - Returns { success: true }

4. FILE: app/api/facebook/test/route.js
   
   POST handler — sends test message:
   - Gets fb_page_access_token from bot_settings
   - Gets fb_page_id from bot_settings
   - Gets admin_messenger_id from bot_settings (or uses page_id for testing)
   - Calls: POST https://graph.facebook.com/v18.0/me/messages
   - Test message: "✅ Bot connection test successful!"
   - Returns { success: true/false }

5. FILE: app/api/facebook/disconnect/route.js
   
   POST handler — disconnects Facebook:
   - Deletes fb_page_access_token from bot_settings
   - Deletes fb_page_id from bot_settings
   - Returns { success: true }

DESIGN: Dark theme matching existing dashboard. 
Steps shown as numbered progress indicator.
Each step card has icon, title, description, action button.
Already-completed steps show green checkmark.
Loading spinners on all async actions.

Use the existing Supabase client from lib/supabase.js.
Protect all API routes with NextAuth session check.
Use existing dark theme Tailwind classes from the project.`,
    },
    {
        id: "T2",
        priority: "P0",
        title: "Fix /team page — Real Supabase Data",
        color: "#6366F1",
        icon: "👥",
        time: "~30 min",
        why: "Currently shows fake hardcoded data. Real team management lets you add your 2 team members with proper roles.",
        prompt: `You are working on an existing Next.js 14 dashboard for a Bajaj EMI Card bot.

EXISTING PROJECT CONTEXT:
- Next.js 14 App Router, Tailwind CSS dark theme
- NextAuth.js for auth (email/password stored in Supabase)
- Supabase for all data
- OpenRouter AI (NOT OpenAI)
- All pages protected behind NextAuth session

TASK: Fix the /team page to use real Supabase data.

STEP 1 — Create Supabase table (run this SQL in Supabase SQL editor):

CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(20) DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
  invited_by VARCHAR(255),
  invite_token VARCHAR(64),
  invite_accepted BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the initial admin (yourself)
INSERT INTO team_members (email, full_name, role, invite_accepted)
VALUES ('your-email@example.com', 'Admin', 'admin', true);

STEP 2 — Build the /team page: app/(dashboard)/team/page.jsx

SECTION 1 — Header stats:
- Total members: [count]
- Admins: [count]  
- Operators: [count]
- Max team size: 5 (show warning if at 5)

SECTION 2 — Current Members table:
Fetch from team_members table via Supabase client.
Columns: Avatar (colored initials), Name, Email, Role badge, Status, Joined, Actions

Role badges:
- admin: orange badge
- operator: blue badge  
- viewer: gray badge

Status:
- invite_accepted=true: "Active" green dot
- invite_accepted=false: "Pending" yellow dot

Actions:
- Change role dropdown (admin only)
- Remove button (cannot remove yourself, cannot remove last admin)

Your own row has a "You" badge, no remove button.

SECTION 3 — Invite New Member:
Form with: Email input + Role dropdown (admin/operator/viewer) + Invite button

On submit:
- Validate email format
- Check not already in team
- Check team size < 5
- Generate invite_token (random 32 chars)
- INSERT into team_members with invite_accepted=false
- Send invite email using Supabase Auth: supabase.auth.admin.inviteUserByEmail(email)
- Show success: "Invite sent to [email]"

Role descriptions shown as helper text:
- Admin: Can change all settings, links, prompts, manage team
- Operator: Can view leads, retry applications, cannot change settings
- Viewer: Read-only access to dashboard and leads

SECTION 4 — Pending Invites:
List of team_members where invite_accepted=false
Each shows: email, role, invited_by, days ago, Resend button, Cancel button

STEP 3 — API Routes:

app/api/team/route.js:
  GET: fetch all team_members from Supabase
  POST: add new team member, generate invite token

app/api/team/[id]/route.js:
  PATCH: update role
  DELETE: remove member (check: cannot remove self, cannot remove last admin)

app/api/team/resend/route.js:
  POST: { memberId } → resend invite email

STEP 4 — Role-based access check:
In the middleware or page headers, check if current user is 'admin' role.
If operator/viewer tries to visit /team → redirect to /dashboard with toast "Access denied".

Check current user's role by querying team_members where email = session.user.email.

DESIGN: Match existing dark theme. 
Loading skeleton while fetching.
Toast notifications for success/error (use a simple useState toast).
Confirmation dialog before removing a member.`,
    },
    {
        id: "T3",
        priority: "P0",
        title: "Fix Render n8n — Move Secrets to Env Vars",
        color: "#F59E0B",
        icon: "🔐",
        time: "~20 min",
        why: "Hardcoded secrets in workflow nodes is a major security risk. If someone sees your workflow, they get your FB token, Supabase key, OpenRouter key.",
        prompt: `You are working on an n8n workflow hosted on Render.com for a Bajaj EMI Card bot.

CURRENT SITUATION:
- n8n is self-hosted on Render free tier
- URL: https://n8n-1-zlf1.onrender.com
- All secrets are currently HARDCODED in workflow nodes:
  * SUPABASE_URL hardcoded in HTTP Request nodes
  * SUPABASE_SERVICE_KEY hardcoded in HTTP Request nodes
  * OPENROUTER_API_KEY hardcoded in OpenRouter AI node
  * FB_PAGE_ACCESS_TOKEN hardcoded in Send to Facebook node
  * FB_VERIFY_TOKEN = bajaj123 hardcoded in Return Challenge node

TASK: Move all secrets to Render environment variables.

STEP 1 — Add environment variables in Render Dashboard:
Go to render.com → your n8n service → Environment tab → Add these:

Variable Name              | Value
---------------------------|------------------------------------------
SUPABASE_URL               | https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY       | eyJ...your service role key
OPENROUTER_API_KEY         | sk-or-v1-xxxxx
FB_PAGE_ACCESS_TOKEN       | your facebook page access token
FB_VERIFY_TOKEN            | bajaj123
N8N_ENCRYPTION_KEY         | (random 32 char string - generate new one)

STEP 2 — Update n8n workflow to use env variables:

In n8n, environment variables are accessed as:
{{ $env.VARIABLE_NAME }}

Update each node:

NODE: Supabase HTTP Request nodes (all of them)
Change hardcoded headers from:
  apikey: hardcoded_key
  Authorization: Bearer hardcoded_key
To:
  apikey: {{ $env.SUPABASE_SERVICE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_KEY }}

Change hardcoded URLs from:
  https://hardcoded.supabase.co/rest/v1/...
To:
  {{ $env.SUPABASE_URL }}/rest/v1/...

NODE: OpenRouter AI HTTP Request node
Change header from:
  Authorization: Bearer hardcoded_openrouter_key
To:
  Authorization: Bearer {{ $env.OPENROUTER_API_KEY }}

NODE: Send to Facebook HTTP Request node
Change URL from:
  https://graph.facebook.com/v18.0/me/messages?access_token=hardcoded_token
To:
  https://graph.facebook.com/v18.0/me/messages?access_token={{ $env.FB_PAGE_ACCESS_TOKEN }}

NODE: Return Challenge (GET webhook verify node)
Change hardcoded verify token comparison from:
  if (query['hub.verify_token'] === 'bajaj123')
To:
  if (query['hub.verify_token'] === $env.FB_VERIFY_TOKEN)

STEP 3 — Add UptimeRobot to prevent Render sleep:
Render free tier sleeps after 15 minutes inactivity.
Fix: Set up UptimeRobot to ping every 5 minutes.

Instructions:
1. Go to uptimerobot.com → Sign up free
2. Add New Monitor:
   - Monitor Type: HTTP(s)
   - Friendly Name: Bajaj n8n Keep Alive
   - URL: https://n8n-1-zlf1.onrender.com/healthz
   - Monitoring Interval: every 5 minutes
3. Save → n8n will never sleep again

STEP 4 — Test after changes:
1. Send a test message to your Facebook page
2. Check n8n Executions tab — should show green
3. Check that all nodes executed without credential errors
4. If any node fails, check the error — likely env var name mismatch

IMPORTANT NOTES FOR n8n ENV VARS:
- n8n must be RESTARTED on Render after adding env vars
- In Render: Manual Deploy → Deploy Latest Commit (forces restart)
- Env vars are only available after restart
- Test each node individually using n8n's "Execute Node" feature

Write step-by-step instructions with exact screenshots descriptions for each step.`,
    },
    {
        id: "T4",
        priority: "P1",
        title: "Complete /training page — Document Upload",
        color: "#3ECF8E",
        icon: "🧠",
        time: "~1 hour",
        why: "Currently a visual mock. Real document upload lets you train the bot from real Messenger screenshots and PDFs.",
        prompt: `You are working on an existing Next.js 14 dashboard for a Bajaj EMI Card bot.

EXISTING PROJECT CONTEXT:
- Next.js 14 App Router, Tailwind CSS dark theme
- NextAuth.js auth (all pages protected)
- Supabase for database + storage
- OpenRouter API → model: anthropic/claude-3-haiku
  - API URL: https://openrouter.ai/api/v1/chat/completions
  - Auth: "Authorization: Bearer sk-or-v1-xxxxx"
  - Extra headers: "HTTP-Referer: https://bajajbot.com", "X-Title: Bajaj EMI Bot"
  - Env var: OPENROUTER_API_KEY
- The /training page UI already exists but document upload is a mock

TASK: Make the document upload REAL on /training page.

The /training page already has tabs. Add real functionality to these tabs:

TAB 1: "Prompt Editor" (already working — keep as-is)
- Reads/writes system_prompt to bot_settings table
- No changes needed here

TAB 2: "Upload Training Docs" (currently mock — make real)

Build this:
a) Drag-and-drop upload zone for:
   - Images (PNG, JPG) — for Messenger chat screenshots
   - PDF files — for conversation guides
   - Max file size: 5MB each
   - Max 10 files at once

b) On file drop/select:
   - Upload to Supabase Storage bucket: 'training-screenshots'
   - Show upload progress bar
   - After upload, call /api/training/analyze to process file

c) FILE: app/api/training/analyze/route.js
   POST handler:
   - Gets { fileUrl, fileName, fileType } from body
   - If image: call OpenRouter with vision:
     {
       model: "anthropic/claude-3-haiku",
       messages: [{
         role: "user",
         content: [
           { type: "image_url", image_url: { url: fileUrl } },
           { type: "text", text: "This is a screenshot from a Bajaj EMI card bot conversation on Facebook Messenger. Analyze: 1) What state is the conversation in? 2) What did the bot say? 3) What did the customer say? 4) What would be the ideal bot response? Return as JSON: { state, botMessage, customerMessage, idealResponse, suggestedPromptUpdate }" }
         ]
       }]
     }
   - If PDF: extract text (use pdf-parse npm package), then send text to Claude for analysis
   - Save analysis to Supabase table 'training_docs':
     id, file_url, file_name, file_type, analysis (JSON), applied (boolean), created_at
   - Return { analysis }

d) After analysis returns:
   - Show analysis card below the upload:
     "📊 Analysis Result"
     State detected: [state]
     Bot said: "[message]"
     Customer said: "[message]"
     Suggested improvement: "[text]"
   - "Apply to Prompt" button → appends suggestion to system_prompt in bot_settings
   - "Dismiss" button → marks as dismissed

e) "Uploaded Documents" list below:
   - Shows all rows from training_docs table
   - Each shows: file name, upload date, analysis summary, Applied/Pending badge
   - Delete button (removes from Supabase storage + DB)

TAB 3: "Live Chat Simulator" (currently mock — make real)

Build this:
a) Chat window with message bubbles
b) Input box at bottom
c) On message submit:
   - Add user message to chat
   - Show typing indicator (animated dots)
   - Call /api/training/simulate

d) FILE: app/api/training/simulate/route.js
   POST handler:
   - Gets { message, history } from body
   - Loads current system_prompt from bot_settings table
   - Calls OpenRouter:
     URL: https://openrouter.ai/api/v1/chat/completions
     Headers:
       Authorization: Bearer [OPENROUTER_API_KEY]
       HTTP-Referer: https://bajajbot.com
       X-Title: Bajaj EMI Bot
       Content-Type: application/json
     Body:
       model: anthropic/claude-3-haiku
       messages: [
         { role: "system", content: system_prompt },
         ...history (last 10 messages),
         { role: "user", content: message }
       ]
       max_tokens: 150
   - Returns { reply }

e) Show bot reply in chat
f) "Reset Chat" button clears history
g) "Quick Test" buttons at top:
   - "Test: Normal flow" → types "bajaj card chahiye"
   - "Test: OTP wrong" → types "12345" (wrong OTP)
   - "Test: CIBIL reject" → sends mock rejection scenario

SUPABASE TABLE TO CREATE:
CREATE TABLE training_docs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  analysis JSONB,
  applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

NPM PACKAGES NEEDED:
- pdf-parse (for PDF text extraction)
- Install: npm install pdf-parse

DESIGN: Match existing dark theme. 
Drag-drop zone: dashed border, darkens on hover.
Upload progress: thin green progress bar.
Analysis card: bordered card with color-coded sections.
Chat simulator: iMessage-style bubbles, dark background.`,
    },
    {
        id: "T5",
        priority: "P1",
        title: "Phase 2 — Puppeteer Automation Service",
        color: "#FF6B00",
        icon: "🤖",
        time: "~3 hours",
        why: "This is the core automation — actually filling the Bajaj EMI card form automatically. Without this, everything is manual.",
        prompt: `You are building Phase 2 of a Bajaj EMI Card bot system.

EXISTING SYSTEM CONTEXT:
- Next.js dashboard on Vercel
- n8n on Render (https://n8n-1-zlf1.onrender.com) handles Messenger conversation
- Supabase database with leads table
- When all 5 fields collected (mobile, name, dob, pan, aadhaar), lead status = 'processing'
- At this point, n8n calls a webhook to trigger automation

TASK: Build a Node.js Puppeteer microservice that runs on Render.com (free tier).

THE AUTOMATION FLOW (based on real screenshots):
1. Open trackloom.com/464314?a=UN11887 (intake form)
2. Fill: Customer Name, Mobile, Email='k', Vendor='Rishi'
3. Click Continue → redirects to bajajfinserv.in/webfor
4. Enter mobile number using BACKSPACE TRICK (not copy-paste)
5. Click Terms checkbox → Click GET OTP
6. Ask user for OTP via Messenger (wait up to 5 min)
7. Enter OTP in 6-box field → Submit
8. Check for Congratulations page OR rejection
9. If approved: continue to Wallet Setup
10. Wallet Setup: check PEP checkbox → GET OTP → ask user → submit
11. Take screenshot → save to Supabase → notify admin

CREATE THESE FILES:

FILE 1: package.json
{
  "name": "bajaj-puppeteer-service",
  "version": "1.0.0",
  "engines": { "node": "18.x" },
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "express": "^4.18.2",
    "puppeteer": "^21.0.0",
    "puppeteer-extra": "^3.3.6",
    "puppeteer-extra-plugin-stealth": "^2.11.2",
    "@supabase/supabase-js": "^2.38.0",
    "cors": "^2.8.5",
    "axios": "^1.6.0"
  }
}

FILE 2: render.yaml (for Render deployment)
services:
  - type: web
    name: bajaj-puppeteer
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: FB_PAGE_ACCESS_TOKEN
        sync: false
      - key: PORT
        value: 3001

FILE 3: server.js (COMPLETE - write every function fully)

const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

puppeteer.use(StealthPlugin());

const app = express();
app.use(express.json());
app.use(cors());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sessions = new Map();

// Auto-cleanup sessions older than 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > 30 * 60 * 1000) {
      session.browser.close().catch(() => {});
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

// Helper: send Facebook message
async function sendFBMessage(messengerId, text) {
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  await axios.post(
    'https://graph.facebook.com/v18.0/me/messages',
    { recipient: { id: messengerId }, message: { text }, messaging_type: 'RESPONSE' },
    { params: { access_token: token } }
  );
}

// Helper: log to Supabase
async function log(messengerId, step, status, message) {
  await supabase.from('automation_logs').insert({
    lead_messenger_id: messengerId,
    step, status, message,
    created_at: new Date().toISOString()
  });
}

// Helper: update lead in Supabase  
async function updateLead(messengerId, data) {
  await supabase.from('leads')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('messenger_id', messengerId);
}

// Helper: upload screenshot to Supabase storage
async function uploadScreenshot(base64Data, sessionId) {
  const fileName = 'screenshots/' + sessionId + '_' + Date.now() + '.png';
  const buffer = Buffer.from(base64Data, 'base64');
  const { data } = await supabase.storage
    .from('screenshots')
    .upload(fileName, buffer, { contentType: 'image/png', upsert: true });
  const { data: urlData } = supabase.storage
    .from('screenshots')
    .getPublicUrl(fileName);
  return urlData.publicUrl;
}

// Helper: wait for OTP from lead (polls Supabase otp_sessions table)
async function waitForOTP(messengerId, round, timeoutMinutes = 5) {
  const deadline = Date.now() + timeoutMinutes * 60 * 1000;
  while (Date.now() < deadline) {
    const { data } = await supabase
      .from('otp_sessions')
      .select('otp_value')
      .eq('messenger_id', messengerId)
      .eq('otp_round', round)
      .eq('submitted', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      // Mark as submitted
      await supabase.from('otp_sessions')
        .update({ submitted: true })
        .eq('messenger_id', messengerId)
        .eq('otp_round', round)
        .eq('submitted', false);
      return data[0].otp_value;
    }
    await new Promise(r => setTimeout(r, 10000)); // wait 10 seconds
  }
  return null; // timeout
}

// ENDPOINT 1: Start full automation
app.post('/automate/start', async (req, res) => {
  const { messengerId, mobile, name, dob, pan, aadhaar, sessionId } = req.body;
  
  // Read settings from Supabase
  const { data: settings } = await supabase
    .from('bot_settings')
    .select('key, value');
  const cfg = {};
  settings.forEach(s => cfg[s.key] = s.value);
  
  const trackloomUrl = cfg.trackloom_url || 'https://trackloom.com/464314?a=UN11887';
  const vendorName = cfg.vendor_name || 'Rishi';
  const emailValue = cfg.email_field_value || 'k';

  res.json({ success: true, message: 'Automation started' });

  // Run automation async (don't block the response)
  (async () => {
    let browser, page;
    try {
      await log(messengerId, 'START', 'info', 'Starting browser automation');
      await updateLead(messengerId, { status: 'processing', state: 'automation_started' });

      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', '--disable-gpu',
          '--no-first-run', '--no-zygote', '--single-process'
        ]
      });
      page = await browser.newPage();
      sessions.set(sessionId, { browser, page, createdAt: Date.now(), messengerId });
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 390, height: 844 }); // mobile viewport

      // STEP 1: Fill Trackloom form
      await log(messengerId, 'TRACKLOOM', 'info', 'Opening Trackloom form');
      await page.goto(trackloomUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const inputs = await page.$$('input:not([type="hidden"])');
      if (inputs.length >= 4) {
        await inputs[0].click({ clickCount: 3 }); await inputs[0].type(name, { delay: 50 });
        await inputs[1].click({ clickCount: 3 }); await inputs[1].type(mobile, { delay: 50 });
        await inputs[2].click({ clickCount: 3 }); await inputs[2].type(emailValue, { delay: 50 });
        await inputs[3].click({ clickCount: 3 }); await inputs[3].type(vendorName, { delay: 50 });
      }
      
      const continueBtn = await page.$('button[type="submit"], button');
      await continueBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      await log(messengerId, 'TRACKLOOM', 'success', 'Form submitted, redirected to Bajaj');

      // STEP 2: Enter mobile with backspace trick
      await log(messengerId, 'MOBILE_ENTRY', 'info', 'Entering mobile number');
      
      const mobileInput = await page.waitForSelector(
        'input[type="tel"], input[placeholder*="mobile"], input[placeholder*="Mobile"], input[placeholder*="number"]',
        { timeout: 15000 }
      );
      await mobileInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      
      // Type all digits except last
      for (let i = 0; i < mobile.length - 1; i++) {
        await page.keyboard.type(mobile[i], { delay: 80 });
      }
      await page.waitForTimeout(400);
      // Backspace trick
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(600);
      // Retype last digit → triggers Terms checkbox
      await page.keyboard.type(mobile[mobile.length - 1], { delay: 100 });
      await page.waitForTimeout(1200);
      
      // Check Terms checkbox
      const checkbox = await page.$('input[type="checkbox"]');
      if (checkbox) { await checkbox.click(); await page.waitForTimeout(300); }
      
      // Click GET OTP
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.includes('OTP') || b.textContent.includes('otp'));
        if (btn) btn.click();
      });
      await page.waitForTimeout(2000);
      await log(messengerId, 'OTP1_REQUESTED', 'success', 'OTP requested from Bajaj');

      // STEP 3: Ask user for OTP via Messenger
      await sendFBMessage(messengerId, 'Otp dizea 🔢');
      await updateLead(messengerId, { state: 'collecting_otp1' });
      
      const otp1 = await waitForOTP(messengerId, 1, 5);
      if (!otp1) {
        await sendFBMessage(messengerId, 'OTP time out ho gaya, dobara try karein 🙏');
        await updateLead(messengerId, { status: 'failed', state: 'otp1_timeout' });
        await log(messengerId, 'OTP1', 'failure', 'OTP timeout after 5 minutes');
        await browser.close();
        sessions.delete(sessionId);
        return;
      }

      // STEP 4: Submit OTP 1
      await page.waitForSelector('input[maxlength="1"]', { timeout: 10000 });
      const otpBoxes = await page.$$('input[maxlength="1"]');
      for (let i = 0; i < Math.min(6, otpBoxes.length); i++) {
        await otpBoxes[i].click();
        await otpBoxes[i].type(otp1[i] || '', { delay: 80 });
      }
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.toUpperCase().includes('SUBMIT') || b.textContent.toUpperCase().includes('VERIFY'));
        if (btn) btn.click();
      });
      await page.waitForTimeout(5000);
      await log(messengerId, 'OTP1_SUBMITTED', 'success', 'OTP 1 submitted');

      // STEP 5: Detect page after OTP
      const content = await page.content();
      
      if (content.includes('already have the Insta EMI')) {
        await sendFBMessage(messengerId, 'Aapka card already hai sir ❤️ Wallet Care lena chahte hain?');
        await updateLead(messengerId, { status: 'existing_card', state: 'existing_card' });
        await log(messengerId, 'EXISTING_CARD', 'info', 'User already has EMI card');
        await browser.close(); sessions.delete(sessionId); return;
      }
      
      if (content.includes('Connection timeout')) {
        // Click retry up to 3 times
        for (let attempt = 0; attempt < 3; attempt++) {
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('RETRY'));
            if (btn) btn.click();
          });
          await page.waitForTimeout(5000);
          const newContent = await page.content();
          if (!newContent.includes('Connection timeout')) break;
          if (attempt === 2) {
            await sendFBMessage(messengerId, 'Server problem aa rahi hai, thodi der baad try karein 🙏');
            await updateLead(messengerId, { status: 'failed', state: 'timeout' });
            await browser.close(); sessions.delete(sessionId); return;
          }
        }
      }
      
      const isApproved = content.includes('Congratulations') || content.includes('55,000') || 
                         content.includes('80,000') || content.includes('loan offer');
      
      if (!isApproved) {
        await sendFBMessage(messengerId, 'Ni ho skta aapka cibil score achha ni hai aapko kisi or ke documents se Krna prega');
        await updateLead(messengerId, { status: 'failed', state: 'cibil_rejected' });
        await log(messengerId, 'CIBIL_CHECK', 'failure', 'Application rejected - low CIBIL');
        await browser.close(); sessions.delete(sessionId); return;
      }

      // Extract approved amount
      const amountMatch = content.match(/₹([\d,]+)/);
      const approvedAmount = amountMatch ? amountMatch[1] : 'approved';
      await sendFBMessage(messengerId, 'Congratulations! ₹' + approvedAmount + ' ka offer aaya ❤️');
      await log(messengerId, 'APPROVED', 'success', 'Application approved: ₹' + approvedAmount);

      // STEP 6: Wallet Setup
      await page.waitForTimeout(2000);
      
      // Check PEP checkbox
      await page.evaluate(() => {
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          if (!cb.checked) cb.click();
        });
      });
      await page.waitForTimeout(500);
      
      // Click GET OTP for wallet
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.includes('GET OTP') || b.textContent.includes('Get OTP'));
        if (btn) btn.click();
      });
      await page.waitForTimeout(2000);
      await log(messengerId, 'WALLET_OTP_REQUESTED', 'success', 'Wallet OTP requested');

      // Ask user for wallet OTP
      await sendFBMessage(messengerId, 'Ek last otp dizea 🔢');
      await updateLead(messengerId, { state: 'collecting_otp2' });
      
      const otp2 = await waitForOTP(messengerId, 2, 5);
      if (!otp2) {
        await sendFBMessage(messengerId, 'OTP time out ho gaya 🙏');
        await updateLead(messengerId, { status: 'failed', state: 'otp2_timeout' });
        await browser.close(); sessions.delete(sessionId); return;
      }

      // Submit wallet OTP
      const walletOtpBoxes = await page.$$('input[maxlength="1"]');
      for (let i = 0; i < Math.min(6, walletOtpBoxes.length); i++) {
        await walletOtpBoxes[i].click();
        await walletOtpBoxes[i].type(otp2[i] || '', { delay: 80 });
      }
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.toUpperCase().includes('SUBMIT'));
        if (btn) btn.click();
      });
      await page.waitForTimeout(5000);
      await log(messengerId, 'WALLET_OTP_SUBMITTED', 'success', 'Wallet OTP submitted');

      // STEP 7: Take screenshot + notify admin
      const screenshotBase64 = await page.screenshot({ encoding: 'base64', fullPage: true });
      const screenshotUrl = await uploadScreenshot(screenshotBase64, sessionId);
      
      await updateLead(messengerId, {
        status: 'completed',
        state: 'automation_completed',
      });
      
      // Send completion to lead
      await sendFBMessage(messengerId, 'Ho gaya ❤️ Aapka process complete hua. Card active ho jayega jaldi');
      
      // Notify admin
      const adminId = cfg.admin_messenger_id;
      if (adminId) {
        await sendFBMessage(adminId, 
          '✅ KYC DONE\n' +
          'Name: ' + name + '\n' +
          'Mobile: ' + mobile + '\n' +
          'Amount: ₹' + approvedAmount + '\n' +
          'Wallet: Done ✅\n' +
          'Screenshot: ' + screenshotUrl
        );
      }
      
      await log(messengerId, 'COMPLETED', 'success', 'Full automation completed. Amount: ₹' + approvedAmount);
      
    } catch (error) {
      await log(messengerId, 'ERROR', 'failure', error.message);
      await updateLead(messengerId, { status: 'failed' });
      await sendFBMessage(messengerId, 'Kuch problem aa gayi, admin ko bata diya hai 🙏');
      if (browser) await browser.close();
      sessions.delete(sessionId);
    }
  })();
});

// ENDPOINT 2: Submit OTP (called by n8n when user sends OTP via Messenger)
app.post('/otp/submit', async (req, res) => {
  const { messengerId, otpValue, round } = req.body;
  
  // Insert into otp_sessions
  await supabase.from('otp_sessions').insert({
    messenger_id: messengerId,
    otp_round: round || 1,
    otp_value: otpValue,
    submitted: false,
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
  });
  
  res.json({ success: true });
});

// ENDPOINT 3: Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', sessions: sessions.size, timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Puppeteer service running on port ' + PORT));

---

ALSO UPDATE n8n WORKFLOW:
After "All Data Collected?" IF node returns YES:
1. Add HTTP Request node: POST to https://bajaj-puppeteer.onrender.com/automate/start
   Body: { messengerId, mobile, name, dob, pan, aadhaar, sessionId: messengerId + '_' + Date.now() }

2. Add new state handling in Validate Input node:
   When lead state = 'collecting_otp1' AND message is 4-8 digits:
   - Call POST https://bajaj-puppeteer.onrender.com/otp/submit
     Body: { messengerId, otpValue: message, round: 1 }
   - Reply: "Submit ho raha hai ❤️"

   When lead state = 'collecting_otp2' AND message is 4-8 digits:
   - Call POST https://bajaj-puppeteer.onrender.com/otp/submit  
     Body: { messengerId, otpValue: message, round: 2 }
   - Reply: "Submit ho raha hai ❤️"

ALSO CREATE otp_sessions table in Supabase:
CREATE TABLE otp_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  messenger_id VARCHAR(100),
  otp_round INTEGER DEFAULT 1,
  otp_value VARCHAR(10),
  submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes')
);`,
    },
];

export default function ContinuationPlan() {
    const [activeTask, setActiveTask] = useState(null);
    const [copied, setCopied] = useState(null);
    const [tab, setTab] = useState("status");

    const copy = (task) => {
        navigator.clipboard.writeText(task.prompt);
        setCopied(task.id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div style={{ background: "#070709", minHeight: "100vh", color: "#E2E8F0", fontFamily: "'IBM Plex Mono', monospace" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#070709,#0f0f1a,#070709)", borderBottom: "1px solid #6366F133", padding: "24px 32px" }}>
                <div style={{ fontSize: 9, color: "#6366F1", letterSpacing: "0.3em", marginBottom: 6, fontWeight: 700 }}>● PROJECT CONTINUATION PLAN</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#FFF", marginBottom: 4 }}>BAJAJ BOT — PICKING UP WHERE YOU LEFT OFF</div>
                <div style={{ fontSize: 11, color: "#52525B", marginBottom: 16 }}>
                    Based on your project docs — n8n on Render · Supabase · Next.js on Vercel · OpenRouter AI
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                        { label: "✅ Working", count: "4 pages", color: "#00FF87" },
                        { label: "⚠️ Partial", count: "1 page", color: "#F59E0B" },
                        { label: "❌ Broken", count: "2 pages", color: "#EF4444" },
                        { label: "🔧 Tasks", count: "5 prompts", color: "#6366F1" },
                    ].map(b => (
                        <div key={b.label} style={{ background: "#0d0d14", border: `1px solid ${b.color}33`, borderRadius: 8, padding: "5px 12px", fontSize: 10 }}>
                            <span style={{ color: b.color, fontWeight: 800 }}>{b.count}</span>
                            <span style={{ color: "#52525B", marginLeft: 8 }}>{b.label}</span>
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
                    {["status", "tasks & prompts"].map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "#6366F1" : "transparent", color: tab === t ? "#FFF" : "#52525B", border: `1px solid ${tab === t ? "#6366F1" : "#1E293B"}`, borderRadius: 7, padding: "5px 14px", fontSize: 9, fontWeight: 800, cursor: "pointer", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "inherit" }}>{t}</button>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 22px" }}>

                {/* STATUS TAB */}
                {tab === "status" && (
                    <div>
                        <div style={{ fontSize: 10, color: "#52525B", letterSpacing: "0.2em", marginBottom: 18 }}>CURRENT PAGE STATUS</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 32 }}>
                            {PAGES.map(p => {
                                const s = STATUS[p.status];
                                return (
                                    <div key={p.page} style={{ background: "#0d0d14", border: `1px solid ${s.color}22`, borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                                        <div style={{ fontWeight: 800, color: "#F4F4F5", fontSize: 13, minWidth: 120 }}>{p.page}</div>
                                        <div style={{ fontSize: 9, fontWeight: 800, color: s.color, background: s.bg, padding: "3px 10px", borderRadius: 6, letterSpacing: "0.1em" }}>{s.label}</div>
                                        <div style={{ fontSize: 11, color: "#71717A", flex: 1 }}>{p.note}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* What's already working */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div style={{ background: "#0d0d14", border: "1px solid #00FF8722", borderRadius: 12, padding: "18px" }}>
                                <div style={{ fontSize: 9, color: "#00FF87", letterSpacing: "0.2em", marginBottom: 14, fontWeight: 800 }}>✅ ALREADY WORKING — DON'T TOUCH</div>
                                {["Facebook webhook verified on Meta", "n8n workflow live on Render", "OpenRouter AI generating Hinglish replies", "Supabase saving all lead data", "Dashboard real-time stats", "NextAuth login protecting all pages", "Leads search, filter, CSV export", "Settings page reading/writing Supabase"].map(i => (
                                    <div key={i} style={{ fontSize: 10, color: "#52525B", marginBottom: 7, display: "flex", gap: 8 }}><span style={{ color: "#00FF87" }}>▸</span>{i}</div>
                                ))}
                            </div>
                            <div style={{ background: "#0d0d14", border: "1px solid #EF444422", borderRadius: 12, padding: "18px" }}>
                                <div style={{ fontSize: 9, color: "#EF4444", letterSpacing: "0.2em", marginBottom: 14, fontWeight: 800 }}>⚠️ CRITICAL ISSUES TO FIX FIRST</div>
                                {[
                                    { t: "Secrets hardcoded in n8n nodes — security risk", c: "#EF4444" },
                                    { t: "Render free tier sleeping — UptimeRobot not set up", c: "#EF4444" },
                                    { t: "/connect page has no real FB OAuth", c: "#F59E0B" },
                                    { t: "/team page showing dummy data", c: "#F59E0B" },
                                    { t: "No Puppeteer automation — leads stuck at 'processing'", c: "#EF4444" },
                                    { t: "Document upload on /training is visual mock only", c: "#F59E0B" },
                                ].map(i => (
                                    <div key={i.t} style={{ fontSize: 10, color: "#52525B", marginBottom: 7, display: "flex", gap: 8 }}><span style={{ color: i.c }}>▸</span>{i.t}</div>
                                ))}
                            </div>
                        </div>

                        {/* Recommended order */}
                        <div style={{ marginTop: 24, background: "#0d0d14", border: "1px solid #1E293B", borderRadius: 12, padding: "18px" }}>
                            <div style={{ fontSize: 9, color: "#52525B", letterSpacing: "0.2em", marginBottom: 14 }}>RECOMMENDED FIX ORDER</div>
                            {[
                                { n: "1", t: "T3 — Move n8n secrets to Render env vars + UptimeRobot", why: "Security + stability fix. Do this first before anything else.", c: "#F59E0B" },
                                { n: "2", t: "T2 — Fix /team page", why: "Quick win — 30 minutes. Real team management.", c: "#6366F1" },
                                { n: "3", t: "T1 — Fix /connect page Facebook OAuth", why: "Stop manual token copying. Proper OAuth flow.", c: "#EF4444" },
                                { n: "4", t: "T4 — Complete /training document upload", why: "Real AI training from screenshots.", c: "#3ECF8E" },
                                { n: "5", t: "T5 — Phase 2 Puppeteer automation", why: "The main feature — actually fills Bajaj form.", c: "#FF6B00" },
                            ].map(s => (
                                <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 10 }}>
                                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.c + "22", border: `1px solid ${s.c}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: s.c, fontWeight: 800, flexShrink: 0 }}>{s.n}</div>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "#F4F4F5" }}>{s.t}</div>
                                        <div style={{ fontSize: 10, color: "#71717A" }}>{s.why}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TASKS & PROMPTS TAB */}
                {tab === "tasks & prompts" && (
                    <div>
                        <div style={{ background: "#0d0d14", border: "1px solid #1E293B", borderRadius: 10, padding: "14px 18px", marginBottom: 24 }}>
                            <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.7 }}>
                                <strong style={{ color: "#F4F4F5" }}>How to use:</strong> Each prompt below includes your FULL project context so the AI knows exactly what exists. Copy and paste into <strong style={{ color: "#6366F1" }}>Cursor AI, Claude, or v0.dev</strong>. Give them in order: T3 → T2 → T1 → T4 → T5.
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {TASKS.map(task => (
                                <div key={task.id} style={{ background: "#0d0d14", border: `1px solid ${activeTask === task.id ? task.color + "44" : "#1E293B"}`, borderRadius: 12, overflow: "hidden" }}>
                                    <div onClick={() => setActiveTask(activeTask === task.id ? null : task.id)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                                        <div style={{ width: 38, height: 38, borderRadius: 8, background: task.color + "18", border: `1px solid ${task.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{task.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                                                <span style={{ fontSize: 9, color: task.color, fontWeight: 800, letterSpacing: "0.15em", background: task.color + "18", padding: "2px 8px", borderRadius: 5 }}>{task.id}</span>
                                                <span style={{ fontSize: 9, color: task.priority === "P0" ? "#EF4444" : "#F59E0B", fontWeight: 800 }}>{task.priority}</span>
                                                <span style={{ fontSize: 10, color: "#52525B" }}>⏱ {task.time}</span>
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "#F4F4F5" }}>{task.title}</div>
                                            <div style={{ fontSize: 10, color: "#71717A", marginTop: 2 }}>{task.why}</div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                            <button onClick={e => { e.stopPropagation(); copy(task); }} style={{ background: copied === task.id ? "#00FF87" : task.color, color: copied === task.id ? "#070709" : "#FFF", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 9, fontWeight: 800, cursor: "pointer", letterSpacing: "0.1em", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                                                {copied === task.id ? "✅ COPIED" : "📋 COPY"}
                                            </button>
                                            <span style={{ color: "#3F3F46", fontSize: 14, alignSelf: "center" }}>{activeTask === task.id ? "▲" : "▼"}</span>
                                        </div>
                                    </div>

                                    {activeTask === task.id && (
                                        <div style={{ borderTop: `1px solid ${task.color}22` }}>
                                            <div style={{ padding: "0 20px 20px" }}>
                                                <div style={{ background: "#070709", borderRadius: 8, padding: "14px", marginTop: 14, maxHeight: 440, overflowY: "auto", border: "1px solid #1E293B" }}>
                                                    <pre style={{ fontSize: 10, color: "#94A3B8", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, lineHeight: 1.75 }}>{task.prompt}</pre>
                                                </div>
                                                <button onClick={() => copy(task)} style={{ marginTop: 10, background: copied === task.id ? "#00FF87" : task.color, color: copied === task.id ? "#070709" : "#FFF", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 10, fontWeight: 800, cursor: "pointer", letterSpacing: "0.1em", fontFamily: "inherit", width: "100%" }}>
                                                    {copied === task.id ? "✅ COPIED TO CLIPBOARD" : "📋 COPY FULL PROMPT"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
