const axios = require('axios');
require('dotenv').config();

const testGoogleMapsAPI = async () => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    console.log('🧪 Testing Google Maps API Setup\n');
    console.log('='.repeat(80));
    
    if (!apiKey) {
        console.log('❌ GOOGLE_MAPS_API_KEY not found in .env file');
        process.exit(1);
    }
    
    console.log('✅ API Key found:', apiKey.substring(0, 20) + '...\n');
    
    // Test 1: Geocoding API
    console.log('Test 1: Geocoding API');
    console.log('-'.repeat(80));
    try {
        const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
        const response = await axios.get(geocodeUrl, {
            params: {
                address: 'Koramangala, Bangalore',
                key: apiKey
            }
        });
        
        if (response.data.status === 'OK') {
            console.log('✅ Geocoding API: WORKING');
            console.log(`   Location: ${response.data.results[0].formatted_address}`);
            console.log(`   Coordinates: ${response.data.results[0].geometry.location.lat}, ${response.data.results[0].geometry.location.lng}`);
        } else {
            console.log(`❌ Geocoding API: ${response.data.status}`);
            console.log(`   Error: ${response.data.error_message || 'Unknown error'}`);
        }
    } catch (error) {
        console.log('❌ Geocoding API: ERROR');
        console.log(`   ${error.message}`);
    }
    
    console.log('');
    
    // Test 2: Distance Matrix API
    console.log('Test 2: Distance Matrix API');
    console.log('-'.repeat(80));
    try {
        const distanceUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';
        const response = await axios.get(distanceUrl, {
            params: {
                origins: 'Koramangala, Bangalore',
                destinations: 'MG Road Metro Station, Bangalore',
                key: apiKey,
                units: 'metric'
            }
        });
        
        if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
            const element = response.data.rows[0].elements[0];
            console.log('✅ Distance Matrix API: WORKING');
            console.log(`   Distance: ${element.distance.text}`);
            console.log(`   Duration: ${element.duration.text}`);
        } else {
            console.log(`❌ Distance Matrix API: ${response.data.status}`);
            console.log(`   Error: ${response.data.error_message || 'Unknown error'}`);
        }
    } catch (error) {
        console.log('❌ Distance Matrix API: ERROR');
        console.log(`   ${error.message}`);
    }
    
    console.log('');
    
    // Test 3: Places API (Nearby Search)
    console.log('Test 3: Places API (Nearby Search)');
    console.log('-'.repeat(80));
    try {
        const placesUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
        const response = await axios.get(placesUrl, {
            params: {
                location: '12.9352,77.6245', // Koramangala coordinates
                radius: 5000,
                type: 'bus_station',
                key: apiKey
            }
        });
        
        if (response.data.status === 'OK') {
            console.log('✅ Places API: WORKING');
            console.log(`   Found ${response.data.results.length} bus stations`);
            if (response.data.results.length > 0) {
                console.log(`   Nearest: ${response.data.results[0].name}`);
                console.log(`   Address: ${response.data.results[0].vicinity}`);
            }
        } else {
            console.log(`❌ Places API: ${response.data.status}`);
            console.log(`   Error: ${response.data.error_message || 'Unknown error'}`);
        }
    } catch (error) {
        console.log('❌ Places API: ERROR');
        console.log(`   ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 Summary:');
    console.log('If all 3 tests show ✅, your Google Maps API is fully configured!');
    console.log('If you see ❌, follow the instructions in GOOGLE_MAPS_SETUP.md\n');
};

testGoogleMapsAPI();
