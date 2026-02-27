require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('./models/Property');

/**
 * Add MongoDB indexes for fast property search
 */
async function addSearchIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create compound index for common search filters
        await Property.collection.createIndex({
            bedrooms: 1,
            price: 1,
            city: 1,
            listingType: 1
        });
        console.log('✅ Created compound index: bedrooms + price + city + listingType');

        // Create text index for location search
        await Property.collection.createIndex({
            city: 'text',
            location: 'text',
            address: 'text',
            title: 'text'
        });
        console.log('✅ Created text index: city + location + address + title');

        // Create index for property type
        await Property.collection.createIndex({ propertyType: 1 });
        console.log('✅ Created index: propertyType');

        // Create index for creation date (for sorting)
        await Property.collection.createIndex({ createdAt: -1 });
        console.log('✅ Created index: createdAt');

        console.log('\n🎉 All search indexes created successfully!');
        console.log('📊 Property search queries will now be super fast!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    }
}

addSearchIndexes();
