const axios = require('axios');
require('dotenv').config();

async function testBooking() {
    try {
        console.log('Testing booking endpoint...');
        const response = await axios.post('https://api.calendly.com/invitees', {
            // This is the payload from the previous script
            event_type: 'https://api.calendly.com/event_types/9625eb4b-899a-4ef7-912a-a1d68fc79708',
            start_time: '2026-05-20T14:00:00Z',
            invitee: {
                email: 'test@example.com',
                name: 'Test User',
                timezone: 'America/New_York'
            }
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.CALENDLY_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Success:', response.data);
    } catch (error) {
        console.log('Error Type:', error.response ? 'API Error' : 'Network/Other Error');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Message:', error.message);
        }
    }
}

testBooking();
