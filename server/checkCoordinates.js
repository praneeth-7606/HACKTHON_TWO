const mongoose = require('mongoose');
require('dotenv').config();

const Property = require('./models/Property');

const checkCoordinates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const properties = await Property.find();
        
        console.log('🏠 Properties with Coordinates:\n');
        console.log('='.repeat(80));
        
        properties.forEach((prop, index) => {
            console.log(`\n${index + 1}. ${prop.title}`);
            console.log(`   ID: ${prop._id}`);
            console.log(`   Location: ${prop.location}, ${prop.city}`);
            console.log(`   Coordinates: ${prop.coordinates ? `${prop.coordinates.lat}, ${prop.coordinates.lng}` : '❌ NOT SET'}`);
        });
        
        console.log('\n' + '='.repeat(80));
        console.log(`\n📊 Total: ${properties.length} properties\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkCoordinates();
