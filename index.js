const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// --- Configuration ---
const CALENDLY_TOKEN = process.env.CALENDLY_ACCESS_TOKEN;
const TIMEZONE = 'America/New_York'; // Miami Time

const EVENT_TYPES = {
    new: {
        uri: 'https://api.calendly.com/event_types/9625eb4b-899a-4ef7-912a-a1d68fc79708',
        location: {
            kind: 'physical',
            location: '2125 Biscayne Blvd, Suite 226, Edgewater, Miami, FL 33137'
        }
    },
    renewal: {
        uri: 'https://api.calendly.com/event_types/bc03b534-ca6b-4895-86cf-3a3a8575d942',
        location: {
            kind: 'physical',
            location: '2125 Biscayne Blvd, Suite 226, Edgewater, Miami, FL 33137'
        }
    }
};

const calendly = axios.create({
    baseURL: 'https://api.calendly.com',
    headers: {
        'Authorization': `Bearer ${CALENDLY_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

// --- tool logic ---

async function checkAvailability(args) {
    const type = args.type === 'renewal' ? 'renewal' : 'new';
    const eventType = EVENT_TYPES[type];

    let start = new Date();
    let end = new Date();

    // 1. Add a 5-minute buffer to 'start' so it's never in the past for Calendly
    start.setMinutes(start.getMinutes() + 5);

    // 2. Handle the date input
    if (args.date && !args.date.includes('week') && !args.date.includes('month')) {
        // AI sent a specific date string
        const parsedDate = new Date(args.date);
        if (!isNaN(parsedDate)) {
            start = parsedDate;
            if (start < new Date()) {
                start = new Date();
                start.setMinutes(start.getMinutes() + 5);
            }
            end = new Date(args.date);
            end.setHours(23, 59, 59, 999);
        }
    } else {
        // AI sent nothing or "this week" -> Check next 7 days
        end.setDate(end.getDate() + 7);
        end.setHours(23, 59, 59, 999);
    }

    try {
        console.log(`Checking availability from ${start.toISOString()} to ${end.toISOString()}`);
        const response = await calendly.get('/event_type_available_times', {
            params: {
                event_type: eventType.uri,
                start_time: start.toISOString(),
                end_time: end.toISOString()
            }
        });

        const slots = response.data.collection
            .filter(slot => slot.status === 'available')
            .map(slot => slot.start_time);

        if (slots.length === 0) {
            return `I checked our schedule but don't see any open slots for those dates. Would you like to check another week?`;
        }

        // Format slots for the AI to read back to the caller
        const formattedSlots = slots.slice(0, 6).map(s => {
            const d = new Date(s);
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: TIMEZONE });
            const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE });
            return `${dateStr} at ${timeStr} (ID: ${s})`;
        }).join('\n');

        return `I found these openings:\n${formattedSlots}\n\nWhich one of these works for you?`;
    } catch (error) {
        const detail = error.response?.data?.message || error.message;
        console.error('Availability Error:', detail);
        throw new Error(`Calendly Error: ${detail}`);
    }
}

async function bookAppointment(args) {
    const type = args.type === 'renewal' ? 'renewal' : 'new';
    const eventType = EVENT_TYPES[type];

    try {
        const response = await calendly.post('/invitees', {
            event_type: eventType.uri,
            start_time: args.startTime,
            invitee: {
                email: args.email,
                name: args.name,
                timezone: TIMEZONE
            },
            // Added phone number for text notifications
            text_reminders_number: args.phone,
            location: {
                kind: 'physical',
                location: '2125 Biscayne Blvd, Suite 226, Edgewater, Miami, FL 33137'
            }
        });

        return `Perfect! I've booked your ${type} appointment for ${new Date(args.startTime).toLocaleString('en-US', { timeZone: TIMEZONE })}. You'll receive a confirmation email and text message at ${args.phone} shortly.`;
    } catch (error) {
        const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error('Booking Error:', detail);
        throw new Error(`Calendly Deep Error: ${detail}`);
    }
}

// --- Root Route for Verification ---
app.get('/', (req, res) => {
    res.send('<h1>🚀 Vapi-Calendly Bridge is Online!</h1><p>The API is ready for Vapi POST requests.</p>');
});

// --- Vapi Webhook Endpoint ---
app.post('/vapi-tool', async (req, res) => {
    console.log(`\n[${new Date().toLocaleTimeString()}] 📥 Incoming Webhook`);
    console.log('Body:', JSON.stringify(req.body, null, 2));

    try {
        const { message } = req.body;

        if (!message) {
            console.log('⚠️ No message object in request body');
            return res.status(200).json({ status: 'ok' });
        }

        if (message.type !== 'tool-calls') {
            console.log(`ℹ️ Ignoring message type: ${message.type}`);
            return res.status(200).json({ status: 'ok' });
        }

        const results = [];

        for (const toolCall of message.toolCalls) {
            const func = toolCall.function;
            const name = func.name;
            const args = typeof func.arguments === 'string' ? JSON.parse(func.arguments) : func.arguments;

            console.log(`▶️ Processing Tool: ${name}`);

            let resultMessage;
            try {
                if (name === 'checkAvailability') {
                    resultMessage = await checkAvailability(args);
                } else if (name === 'bookAppointment') {
                    resultMessage = await bookAppointment(args);
                } else {
                    resultMessage = `Unknown tool: ${name}`;
                }
            } catch (err) {
                console.error(`❌ Error in ${name}:`, err.message);
                resultMessage = `Error: ${err.message}`;
            }

            results.push({
                toolCallId: toolCall.id,
                result: resultMessage
            });
        }

        console.log('📤 Sending Results:', JSON.stringify(results, null, 2));
        return res.status(200).json({ results });

    } catch (error) {
        console.error('🔥 Fatal Webhook Error:', error);
        return res.status(200).json({
            results: [{ error: "Internal server error." }]
        });
    }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`\n🚀 Vapi-Calendly Bridge is live!`);
        console.log(`📡 Endpoint: http://localhost:${PORT}/vapi-tool`);
        console.log(`🛠️ Mode: Appointment Booking\n`);
    });
}

module.exports = app;
