# Complete System Workflow

## Big Picture — How Everything Connects

```
FACEBOOK MESSENGER
      ↓ (user sends message)
META SERVERS
      ↓ (forwards to your webhook)
N8N ON RENDER
      ↓ (processes message)
      ├──→ OPENROUTER AI (generates reply)
      ├──→ SUPABASE (saves lead data)
      └──→ FACEBOOK API (sends reply back)
                ↓
         USER GETS REPLY
         
Meanwhile...

SUPABASE (has all lead data)
      ↓ (realtime updates)
NEXT.JS DASHBOARD ON VERCEL
      ↓ (you see everything)
YOU (monitor and manage)
```

---

## Part 1 — Facebook Messenger Flow

### What Happens When User Sends a Message

```
Step 1: User opens Facebook
        Finds your page "Bajaj EMI Bot"
        Types "hi" and sends

Step 2: Facebook receives the message
        Looks up your webhook URL
        Sends POST request to n8n within 1 second

Step 3: n8n receives the POST
        Immediately replies 200 OK to Facebook
        (Facebook requires this within 20 seconds)
        Then processes the message separately

Step 4: n8n figures out who sent it
        senderId = unique Facebook user ID
        messageText = "hi"

Step 5: n8n checks Supabase
        "Has this person messaged before?"
        If yes → load their existing data
        If no  → start fresh

Step 6: n8n checks what data is missing
        Missing: mobile, name, DOB, PAN, Aadhaar

Step 7: n8n sends to OpenRouter AI
        "User said hi, we need mobile first,
         reply in Hinglish asking for mobile"

Step 8: OpenRouter replies
        "Hi! Mobile number bhejiye 😊"

Step 9: n8n sends that to Facebook API
        Facebook delivers to user instantly

Step 10: User sees the reply
         Conversation started ✅
```

---

## Part 2 — Complete Conversation Flow

### Full Conversation Example

```
USER: hi
BOT:  Hi! Mobile number bhejiye 😊

USER: 9876543210
      [n8n validates: is it 10 digits starting 6-9? YES]
      [n8n saves mobile to Supabase]
BOT:  Full name bhejiye (Aadhaar ke jaisa)

USER: Rahul Kumar
      [n8n validates: only letters? YES]
      [n8n saves name to Supabase]
BOT:  DOB bhejiye DD/MM/YYYY format mein

USER: 15/06/1995
      [n8n validates: correct format? YES]
      [n8n saves dob to Supabase]
BOT:  PAN number bhejiye

USER: ABCDE1234F
      [n8n validates: correct PAN format? YES]
      [n8n saves pan to Supabase]
BOT:  Aadhaar number bhejiye (12 digit)

USER: 123456789012
      [n8n validates: 12 digits? YES]
      [n8n saves aadhaar to Supabase]
      [n8n marks lead status = processing]
BOT:  Active rahiye mai process krta hu ❤️

--- ALL DATA COLLECTED ---
Lead status in dashboard: PROCESSING
```

### What Happens With Wrong Input

```
USER: 12345
      [n8n validates: only 5 digits, not valid mobile]
      [n8n does NOT save anything]
BOT:  Galat number h, 10 digit bhejiye

USER: ABC
      [n8n validates: too short for name]
BOT:  Name sahi nhi laga, dobara bhejiye

USER: 15-06-1995
      [n8n validates: wrong format, needs /]
BOT:  DOB DD/MM/YYYY format mein bhejiye
```

---

## Part 3 — n8n Workflow Internals

### Every Node Explained

```
NODE 1: FB Verify Webhook (GET)
├── Purpose: One-time Facebook verification
├── Triggers: When you click Verify in Meta portal
├── Does: Returns hub.challenge back to Facebook
└── After setup: Never used again

NODE 2: FB Messages Webhook (POST)  
├── Purpose: Receives all real user messages
├── Triggers: Every time user sends message
├── Input: Full Facebook webhook payload
└── Output: Passes to next node

NODE 3: Respond 200 OK
├── Purpose: Tell Facebook "got it"
├── Must happen: Within 20 seconds
├── Runs: Parallel with message processing
└── If missed: Facebook retries and may disable webhook

NODE 4: Extract Message
├── Purpose: Pull out useful data from Facebook payload
├── Gets: senderId (who) + messageText (what)
├── Skips: Echo messages, delivery receipts, read receipts
└── Output: { senderId, messageText, skip: false }

NODE 5: Should Skip?
├── Purpose: Filter out non-message events
├── IF skip=true: Stop processing (end)
└── IF skip=false: Continue to fetch lead

NODE 6: Fetch Lead
├── Purpose: Load existing user data from Supabase
├── Query: GET /leads?messenger_id=eq.{senderId}
├── IF found: Returns existing mobile, name, DOB, pan, aadhaar
└── IF not found: Returns empty object

NODE 7: Build Context
├── Purpose: Figure out conversation state
├── Parses: conversation_history JSON
├── Calculates: Which fields are missing
├── Adds: Current message to history
└── Output: { missingFields, allDone, conversationHistory }

NODE 8: Validate Input
├── Purpose: Auto-detect what user just sent
├── Checks format of message:
│   10 digits starting 6-9 → mobile
│   AAAAA1234A format → PAN
│   12 digits → Aadhaar
│   DD/MM/YYYY → DOB
│   Letters only after mobile collected → name
└── Output: { field: 'mobile', value: '9876543210' }

NODE 9: Has Valid Field?
├── Purpose: Did we get a valid field to save?
├── IF yes: Go save to Supabase first, then AI
└── IF no: Skip saving, go straight to AI

NODE 10: Prepare Save Data
├── Purpose: Build the object to save
├── Adds: New field + updated state + conversation history
└── Calculates: New state based on what's collected

NODE 11: Save to Supabase
├── Purpose: Persist the new data
├── Method: POST with Prefer: merge-duplicates
├── This is UPSERT: creates new or updates existing
└── Lead now has one more field filled

NODE 12: Build AI Prompt
├── Purpose: Tell OpenRouter exactly what to do
├── Includes:
│   - System prompt (Hinglish, one line, bot rules)
│   - What fields are collected so far
│   - What field to ask for next
│   - Last 8 messages of conversation
└── Output: { systemPrompt, messages }

NODE 13: OpenRouter AI
├── Purpose: Generate the actual reply
├── API: POST https://openrouter.ai/api/v1/chat/completions
├── Model: anthropic/claude-3-haiku
├── Max tokens: 100 (forces short reply)
└── Returns: One line Hinglish response

NODE 14: Extract Reply
├── Purpose: Pull text from OpenRouter response
├── Gets: choices[0].message.content
├── Forces: Single line only
└── Fallback: Pre-written reply if AI fails

NODE 15: Send to Facebook
├── Purpose: Deliver reply to user
├── API: POST graph.facebook.com/v18.0/me/messages
├── Uses: FB_PAGE_ACCESS_TOKEN
└── User sees reply within 1-2 seconds

NODE 16: Save History
├── Purpose: Remember the conversation
├── Saves: Full conversation_history back to Supabase
└── Used: Next message to give AI context

NODE 17: All Data Collected?
├── IF yes: Mark lead as processing, log completion
└── IF no: End workflow, wait for next message
```

---

## Part 4 — Supabase Database Flow

### How Data Builds Up Over Conversation

```
After message 1 (hi):
leads table row:
{
  messenger_id: "123456789",
  status: "new",
  state: "collecting_mobile",
  conversation_history: '[{"role":"user","content":"hi"},{"role":"assistant","content":"Mobile number bhejiye"}]'
}

After message 2 (9876543210):
{
  messenger_id: "123456789",
  mobile: "9876543210",
  status: "new", 
  state: "collecting_name",
  conversation_history: '[...4 messages now...]'
}

After all 5 fields:
{
  messenger_id: "123456789",
  mobile: "9876543210",
  name: "Rahul Kumar",
  dob: "15/06/1995",
  pan: "ABCDE1234F",
  aadhaar: "123456789012",
  status: "processing",
  state: "automation_started"
}
```

### automation_logs Table

```
Every important action gets logged:
{
  lead_messenger_id: "123456789",
  step: "data_collection",
  status: "info",
  message: "Field saved: mobile",
  created_at: "2026-03-09 15:00:00"
}

{
  lead_messenger_id: "123456789", 
  step: "all_data_collected",
  status: "success",
  message: "All 5 fields collected. Ready for processing.",
  created_at: "2026-03-09 15:05:00"
}
```

---

## Part 5 — Next.js Dashboard Flow

### How Dashboard Gets Data

```
SUPABASE (live database)
      ↓ Realtime websocket connection
NEXT.JS (subscribed to changes)
      ↓ Updates React state
DASHBOARD UI (re-renders automatically)
      ↓
YOU SEE NEW LEAD INSTANTLY
(no page refresh needed)
```

### Each Page Flow

```
/dashboard page:
  1. Page loads
  2. Fetches count of leads by status from Supabase
  3. Fetches last 20 rows from automation_logs
  4. Sets up realtime subscription on both tables
  5. When new lead comes in → counter updates live
  6. When new log comes in → activity feed updates live

/leads page:
  1. Page loads
  2. Fetches all leads from Supabase
     SELECT * FROM leads ORDER BY created_at DESC
  3. Renders table with name, mobile, status, timestamps
  4. Search box → filters client-side (no DB query)
  5. Status filter → filters client-side
  6. CSV Export → converts current data to CSV file
  
  Click on a lead:
  7. Expands row
  8. Shows all fields: mobile, name, DOB, PAN (masked), Aadhaar (masked)
  9. Shows conversation history
  10. Shows logs from automation_logs

  Retry button:
  11. POST /api/retry with { leadId }
  12. API route calls n8n webhook
  13. n8n re-processes the lead
  14. Status updates to "retrying"
  15. Toast notification shown

/settings page:
  1. Page loads
  2. Fetches all rows from bot_settings table
  3. Fills form fields with current values
  4. User edits fields
  5. Click Save → updates bot_settings in Supabase
  6. n8n reads system_prompt on next message
  7. Changes take effect IMMEDIATELY (no redeploy)
```

### Authentication Flow

```
User visits any page
      ↓
NextAuth middleware checks for session
      ↓
No session? → Redirect to /login
      ↓
User enters email + password
      ↓
NextAuth checks admin_users table in Supabase
      ↓
bcrypt compares password hash
      ↓
Match? → Create JWT session (8 hours)
      ↓
Redirect to /dashboard
      ↓
All API routes also check session
Unauthorized? → 401 response
```

---

## Part 6 — Complete Testing Guide

### Before Testing — Verify Setup

```
Checklist:
□ n8n workflow is Published (green button)
□ Render is awake (open n8n URL in browser)
□ Facebook webhook shows "Active" in Meta portal
□ Supabase leads table has all columns
□ Realtime enabled on leads and automation_logs
□ Dashboard is running (npm run dev or Vercel)
□ You're logged into dashboard
```

---

### Test 1 — Webhook is Alive

Open this URL in browser:
```
https://n8n-1-zlf1.onrender.com/webhook/bajaj-verify?hub.mode=subscribe&hub.verify_token=bajaj123&hub.challenge=TESTME
```

**Expected result:** Browser shows `TESTME`

**If fails:**
- Workflow not published → toggle Active in n8n
- Render sleeping → wait 60 seconds, try again
- Wrong verify token → check Return Challenge node code

---

### Test 2 — n8n Receives Facebook Messages

1. Go to your Facebook page
2. Click **Send Message**
3. Type `hi` and send
4. Immediately go to n8n → **Executions tab**

**Expected result:** Green execution appears within 5 seconds

**If fails:**
- Check Meta portal → webhook subscriptions active?
- Check POST webhook URL is correct
- Check workflow is Published not just Saved

---

### Test 3 — Supabase Gets Data

After Test 2:
1. Go to **Supabase → Table Editor → leads**
2. Look for new row

**Expected result:**
```
messenger_id: your_facebook_id
status: new
state: collecting_mobile
conversation_history: [{"role":"user"...}]
```

**If fails:**
- Click the failed execution in n8n
- Find which node has red error
- Check Supabase URL and service key in that node

---

### Test 4 — Bot Replies

After sending `hi`:

**Expected result:** Bot replies within 3-5 seconds:
```
"Hi! Mobile number bhejiye 😊"
```

**If no reply:**
- Check OpenRouter API key in n8n OpenRouter node
- Check Facebook Page Access Token in Send to Facebook node
- Check n8n execution → which node failed?

**If reply is in English not Hinglish:**
- System prompt not working
- Go to settings page → edit system prompt
- Make sure Hinglish instruction is there

---

### Test 5 — Full Conversation Test

Send these messages one by one. Wait for reply each time:

```
Message 1: hi
Expected:  Mobile number bhejiye

Message 2: 9876543210
Expected:  Full name bhejiye

Message 3: Rahul Kumar
Expected:  DOB bhejiye DD/MM/YYYY format mein

Message 4: 15/06/1995
Expected:  PAN number bhejiye

Message 5: ABCDE1234F
Expected:  Aadhaar number bhejiye (12 digit)

Message 6: 123456789012
Expected:  Active rahiye mai process krta hu ❤️
```

**Check after each message:**
- Supabase leads table → field should be saved
- n8n Executions → should show green run

---

### Test 6 — Wrong Input Handling

```
Send: 12345 (wrong mobile)
Expected: Galat number h, 10 digit bhejiye

Send: ABC123 (wrong PAN format)  
Expected: PAN galat h, ABCDE1234F format mein

Send: 1234 (wrong Aadhaar, too short)
Expected: Aadhaar 12 digit ka hona chahiye
```

---

### Test 7 — Dashboard Shows Lead

1. After Test 5 complete
2. Open dashboard → **/leads page**
3. Should see Rahul Kumar's lead

**Expected:**
```
Name: Rahul Kumar
Mobile: 9876543210
Status: processing
Step: automation_started
```

**If not showing:**
- Check Supabase Realtime is enabled
- Refresh the page manually
- Check dashboard is using correct Supabase URL

---

### Test 8 — Retry Button Works

1. Find any lead with status "failed" or "processing"
2. Click **Retry** button
3. Check n8n Executions tab

**Expected:**
- New execution appears in n8n
- Lead status changes to "retrying"
- Toast notification shows "Retry triggered"

---

### Test 9 — Logs Are Showing

1. Click any lead in dashboard
2. Click **Logs** button

**Expected:**
```
[info]    data_collection     Field saved: mobile
[info]    data_collection     Field saved: name
[info]    data_collection     Field saved: dob
[info]    data_collection     Field saved: pan
[info]    data_collection     Field saved: aadhaar
[success] all_data_collected  All 5 fields collected
```

---

### Test 10 — Settings Save Works

1. Go to **/settings page**
2. Change system prompt slightly
3. Click Save
4. Send a message on Facebook
5. Bot should use new prompt

**Expected:** Changes reflected immediately, no redeploy needed

---

## Part 7 — How to Debug Issues

### n8n Execution Failed — How to Read Error

```
1. Go to n8n → Executions tab
2. Click the red failed execution
3. You see all nodes — red ones failed
4. Click the red node
5. Look at INPUT and OUTPUT panels
6. Error message tells you exactly what's wrong

Common errors:
"401 Unauthorized"     → Wrong API key
"404 Not Found"        → Wrong URL
"Connection timeout"   → Render sleeping
"Invalid JSON"         → Body format wrong
```

### Messages Not Coming Through

```
Check in this order:
1. Is n8n Published? (not just saved)
2. Is Render awake? (open URL in browser)
3. Is webhook subscribed in Meta portal?
4. Is the POST URL correct in Meta portal?
5. Check Meta → Webhooks → "Show Recent Errors"
```

### AI Replying Wrong

```
Check in this order:
1. Is OpenRouter API key correct?
2. Does OpenRouter account have credits?
3. Is model name exactly: anthropic/claude-3-haiku
4. Check Build AI Prompt node output in n8n
5. Edit system prompt in dashboard settings
```

---

## Part 8 — Production Monitoring

### Daily Checks

```
1. Open dashboard → check total leads count
2. Check failed leads → retry if needed
3. Check n8n Executions → any red runs?
4. Check Render → still running?
5. Check UptimeRobot → any downtime alerts?
```

### When Something Breaks

```
Bot not replying:
→ Check Render is awake
→ Check n8n workflow is Published
→ Check Facebook webhook is active

Lead not in dashboard:
→ Check Supabase connection
→ Check Realtime is enabled

Dashboard login not working:
→ Check NEXTAUTH_SECRET in .env
→ Check admin_users table has your account

Wrong AI replies:
→ Edit system prompt in /settings
→ Changes take effect immediately
```

---

## Summary — Full Flow in 30 Seconds

```
1. User messages Facebook page
2. Facebook → n8n (POST webhook)
3. n8n extracts message, loads lead from Supabase
4. n8n validates input, saves new field if valid
5. n8n asks OpenRouter: "what to reply?"
6. OpenRouter generates Hinglish one-liner
7. n8n sends reply to user via Facebook API
8. n8n saves conversation history to Supabase
9. Dashboard updates in real time
10. You see lead, can retry/manage from dashboard
11. When all 5 fields collected → marked processing
12. Phase 2 (future): Puppeteer automates Bajaj website
```
