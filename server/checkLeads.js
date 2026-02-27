require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('./models/Lead');
const User = require('./models/User');
const Property = require('./models/Property');

const checkLeads = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to database\n');

        // Find seller
        const seller = await User.findOne({ email: 'praneethvvsss123@gmail.com' });
        
        if (!seller) {
            console.log('❌ Seller not found');
            process.exit(1);
        }
        
        console.log('✓ Seller:', seller.name, '\n');

        // Find all leads for this seller
        const leads = await Lead.find({ seller: seller._id })
            .populate('buyer', 'name email phone')
            .populate('property', 'title price')
            .sort({ 'scores.total': -1 });

        console.log(`📊 Found ${leads.length} leads:\n`);

        leads.forEach((lead, i) => {
            console.log(`${i + 1}. ${lead.buyer?.name || 'Unknown'}`);
            console.log(`   Property: ${lead.property?.title || 'Unknown'}`);
            console.log(`   Tier: ${lead.tier}`);
            console.log(`   Score: ${lead.scores.total}/100`);
            console.log(`   Views: ${lead.tracking.viewCount}`);
            console.log(`   Time: ${Math.floor(lead.tracking.pageViewTime / 60)}m`);
            console.log(`   Message Sent: ${lead.tracking.messageSent ? 'Yes' : 'No'}`);
            console.log(`   Status: ${lead.status}`);
            console.log('');
        });

        // Group by tier
        const grouped = {
            HOT: leads.filter(l => l.tier === 'HOT'),
            WARM: leads.filter(l => l.tier === 'WARM'),
            COLD: leads.filter(l => l.tier === 'COLD'),
            LOW: leads.filter(l => l.tier === 'LOW')
        };

        console.log('📈 Summary:');
        console.log(`   🔥 HOT: ${grouped.HOT.length}`);
        console.log(`   ⚡ WARM: ${grouped.WARM.length}`);
        console.log(`   💙 COLD: ${grouped.COLD.length}`);
        console.log(`   🌫️ LOW: ${grouped.LOW.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkLeads();
