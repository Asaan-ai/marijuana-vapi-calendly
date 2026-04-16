const axios = require('axios');
require('dotenv').config();

async function listEventTypes() {
    try {
        const response = await axios.get('https://api.calendly.com/event_types', {
            params: {
                organization: process.env.CALENDLY_ORGANIZATION_URI
            },
            headers: {
                'Authorization': `Bearer ${process.env.CALENDLY_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Event Types:');
        response.data.collection.forEach(type => {
            console.log(`- Name: ${type.name}`);
            console.log(`  URI: ${type.uri}`);
            console.log(`  Active: ${type.active}`);
            console.log('---');
        });
    } catch (error) {
        console.error('Error fetching event types:', error.response ? error.response.data : error.message);
    }
}

listEventTypes();
