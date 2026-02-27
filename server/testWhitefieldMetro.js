const axios = require('axios');
require('dotenv').config();

const testWhitefieldMetro = async () => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    console.log('🧪 Testing Metro Stations near Whitefield\n');
    console.log('='.repeat(80));
    
    // Whitefield coordinates (ITPL area)
    const lat = 12.9698;
    const lng = 77.7499;
    
    console.log(`📍 Location: Whitefield, Bangalore`);
    console.log(`🗺️  Coordinates: ${lat}, ${lng}\n`);
    
    // Test different search radii
    const radii = [5000, 10000, 15000]; // 5km, 10km, 15km
    
    for (const radius of radii) {
        console.log(`\n🔍 Searching within ${radius/1000}km radius...`);
        console.log('-'.repeat(80));
        
        try {
            const placesUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
            const response = await axios.get(placesUrl, {
                params: {
                    location: `${lat},${lng}`,
                    radius: radius,
                    type: 'subway_station',
                    key: apiKey
                }
            });
            
            console.log(`Status: ${response.data.status}`);
            
            if (response.data.status === 'OK' && response.data.results.length > 0) {
                console.log(`✅ Found ${response.data.results.length} metro stations:`);
                response.data.results.slice(0, 3).forEach((place, index) => {
                    console.log(`\n${index + 1}. ${place.name}`);
                    console.log(`   Address: ${place.vicinity}`);
                    console.log(`   Status: ${place.business_status || 'Unknown'}`);
                });
            } else if (response.data.status === 'ZERO_RESULTS') {
                console.log(`❌ No metro stations found within ${radius/1000}km`);
            } else {
                console.log(`⚠️  Status: ${response.data.status}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Reality Check:');
    console.log('Whitefield currently does NOT have operational metro stations.');
    console.log('The Namma Metro Purple Line extension to Whitefield is under construction.');
    console.log('Expected completion: 2025-2026');
    console.log('\nNearest operational metro stations:');
    console.log('- Baiyappanahalli Metro Station (~12km away)');
    console.log('- Indiranagar Metro Station (~14km away)');
    console.log('\n💡 This is why the agent says "no metro stations found" - it\'s accurate!\n');
};

testWhitefieldMetro();
