const axios = require('axios');
require('dotenv').config();

async function getEventTypeDetails() {
    try {
        const response = await axios.get('https://api.calendly.com/event_types/9625eb4b-899a-4ef7-912a-a1d68fc79708', {
            headers: {
                'Authorization': `Bearer ${process.env.CALENDLY_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Event Type Details:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

getEventTypeDetails();
