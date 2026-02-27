require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('./models/Lead');
const Property = require('./models/Property');

const fixExistingLeads = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to database\n');

        // Find all leads
        const leads = await Lead.find({});
        console.log(`Found ${leads.length} leads to check\n`);

        for (const lead of leads) {
            let needsUpdate = false;
            const updates = {};

            // Fix 1: Lowercase status to uppercase
            if (lead.status && lead.status.toLowerCase() === lead.status) {
                updates.status = lead.status.toUpperCase();
                needsUpdate = true;
                console.log(`❌ Lead ${lead._id}: status is lowercase '${lead.status}'`);
            }

            // Fix 2: Missing seller - get from property
            if (!lead.seller) {
                const property = await Property.findById(lead.property);
                if (property && property.seller) {
                    updates.seller = property.seller;
                    needsUpdate = true;
                    console.log(`❌ Lead ${lead._id}: missing seller, adding from property`);
                } else {
                    console.log(`❌ Lead ${lead._id}: cannot find seller, will delete this lead`);
                    await Lead.deleteOne({ _id: lead._id });
                    console.log(`   🗑️ Deleted invalid lead\n`);
                    continue;
                }
            }

            if (needsUpdate) {
                await Lead.updateOne({ _id: lead._id }, { $set: updates });
                console.log(`   ✅ Fixed lead ${lead._id}\n`);
            } else {
                console.log(`✓ Lead ${lead._id}: OK\n`);
            }
        }

        console.log('\n✅ All leads fixed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

fixExistingLeads();
