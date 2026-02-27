const mongoose = require('mongoose');
require('dotenv').config();

const Property = require('./models/Property');
const User = require('./models/User');

const listProperties = async () => {
    try {
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected!\n');

        const properties = await Property.find().populate('seller', 'name email');
        
        console.log('🏠 Properties in Database:\n');
        console.log('='.repeat(80));
        
        properties.forEach((prop, index) => {
            console.log(`\n${index + 1}. ${prop.title}`);
            console.log(`   💰 Price: ₹${(prop.price / 100000).toFixed(2)} Lakhs`);
            console.log(`   📍 Location: ${prop.location}, ${prop.city}, ${prop.state}`);
            console.log(`   🏠 Type: ${prop.bedrooms} BHK ${prop.propertyType}`);
            console.log(`   📐 Area: ${prop.area} ${prop.areaUnit}`);
            console.log(`   🏢 Floor: ${prop.floorNumber}/${prop.totalFloors}`);
            console.log(`   🪑 Furnishing: ${prop.furnishingStatus}`);
            console.log(`   📊 Status: ${prop.listingStatus}`);
            console.log(`   👤 Seller: ${prop.seller.name} (${prop.seller.email})`);
            console.log(`   🧭 Vastu: ${prop.vastuInfo ? '✅ ' + prop.vastuInfo.substring(0, 60) + '...' : '❌ Not specified'}`);
            console.log(`   🤖 AI Summary: ${prop.aiBrokerSummary.substring(0, 80)}...`);
        });
        
        console.log('\n' + '='.repeat(80));
        console.log(`\n📊 Total Properties: ${properties.length}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

listProperties();
