require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('./models/Lead');
const User = require('./models/User');
const Property = require('./models/Property');

const testLeadCreation = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to database');

        // Find a buyer and seller
        const buyer = await User.findOne({ email: 'praneethvvsss@gmail.com' });
        const seller = await User.findOne({ email: 'praneethvvsss123@gmail.com' });
        
        if (!buyer || !seller) {
            console.log('❌ Buyer or seller not found');
            process.exit(1);
        }
        
        console.log('✓ Found buyer:', buyer.name);
        console.log('✓ Found seller:', seller.name);

        // Find a property
        const property = await Property.findOne({ seller: seller._id });
        
        if (!property) {
            console.log('❌ No property found for seller');
            process.exit(1);
        }
        
        console.log('✓ Found property:', property.title);

        // Try to create a lead
        console.log('\n📝 Creating test lead...');
        
        const lead = await Lead.create({
            buyer: buyer._id,
            property: property._id,
            seller: seller._id,
            tracking: {
                firstViewedAt: new Date(),
                lastActiveAt: new Date(),
                viewCount: 1
            }
        });

        console.log('✅ Lead created successfully!');
        console.log('Lead ID:', lead._id);
        console.log('Tier:', lead.tier);
        console.log('Score:', lead.scores.total);

        // Clean up - delete test lead
        await Lead.deleteOne({ _id: lead._id });
        console.log('\n🧹 Test lead deleted');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

testLeadCreation();
