# Vapi & Calendly Integration

This bridge allows your Vapi Voice Assistant to check live availability and book appointments directly into your Calendly account.

## 1. Vapi Tool Setup

You need to create two tools in your [Vapi Dashboard](https://dashboard.vapi.ai/tools).

### Tool 1: `checkAvailability`
- **Name:** `checkAvailability`
- **Async:** `No` (Set to wait for response)
- **Server URL:** `YOUR_BRIDGE_URL/vapi-tool`
- **Parameters (JSON Schema):**
```json
{
  "type": "object",
  "properties": {
    "date": {
      "type": "string",
      "description": "The date to check in YYYY-MM-DD format."
    },
    "type": {
      "type": "string",
      "description": "The visit type: 'new' or 'renewal'.",
      "enum": ["new", "renewal"]
    }
  },
  "required": ["date"]
}
```

### Tool 2: `bookAppointment`
- **Name:** `bookAppointment`
- **Async:** `No`
- **Server URL:** `YOUR_BRIDGE_URL/vapi-tool`
- **Parameters (JSON Schema):**
```json
{
  "type": "object",
  "properties": {
    "startTime": {
      "type": "string",
      "description": "The ISO 8601 start time (e.g., 2026-05-20T14:00:00Z)."
    },
    "name": {
      "type": "string",
      "description": "Full name of the patient."
    },
    "email": {
      "type": "string",
      "description": "Email address of the patient."
    },
    "type": {
      "type": "string",
      "description": "The visit type: 'new' or 'renewal'.",
      "enum": ["new", "renewal"]
    }
  },
  "required": ["startTime", "name", "email"]
}
```

---

## 2. Assistant System Prompt

Add these instructions to your Assistant's **System Prompt**:

> "You are a professional assistant for Dr. Cannabis (Medical Marijuana Doctor Miami). Your goal is to help patients book appointments.
> 
> 1. Start by identifying if the patient is a **New Patient** or a **Renewal**.
> 2. Ask for their preferred **date**.
> 3. Call `checkAvailability` for that date and type.
> 4. Present the available time slots clearly (e.g., 'I have 2:00 PM, 2:20 PM, or 3:00 PM available').
> 5. Once they choose a time, confirm their **Full Name** and **Email Address**.
> 6. Call `bookAppointment` to finalize.
> 7. All times are in Miami (America/New_York) time."

---

## 3. Running the Bridge

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Setup .env:**
   Make sure your `.env` has the `CALENDLY_ACCESS_TOKEN`.
3. **Start Server:**
   ```bash
   node index.js
   ```
4. **Expose to Internet:**
   Use `ngrok` or deploy to Vercel/Render.
   ```bash
   ngrok http 3000
   ```
   Copy the `https` URL and use it in the Vapi Tool settings.

---

## 4. Important: Token Refresh
The token provided is temporary. For a permanent solution:
1. Go to [Calendly Developer Portal](https://developer.calendly.com/).
2. Generate a **Personal Access Token**.
3. Replace `CALENDLY_ACCESS_TOKEN` in your `.env` with the new token.
