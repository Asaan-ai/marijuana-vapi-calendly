const axios = require('axios');
require('dotenv').config();

async function testBookingV3() {
    try {
        console.log('Testing booking with correct location object...');
        const response = await axios.post('https://api.calendly.com/invitees', {
            event_type: 'https://api.calendly.com/event_types/9625eb4b-899a-4ef7-912a-a1d68fc79708',
            start_time: '2026-05-20T16:00:00Z',
            invitee: {
                email: 'test@example.com',
                name: 'Test Success',
                timezone: 'America/New_York'
            },
            location: {
                kind: 'physical',
                location: ' 2125 Biscayne Blvd, Suite 226, Edgewater, Miami, FL 33137'
            }
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.CALENDLY_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Success:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

testBookingV3();
