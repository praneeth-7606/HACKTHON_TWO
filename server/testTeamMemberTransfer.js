require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('./models/Lead');
const User = require('./models/User');
const Property = require('./models/Property');

const DB = process.env.MONGODB_URI;

async function testTransfer() {
    try {
        await mongoose.connect(DB);
        console.log('✅ Connected to database');

        // Find the team member
        const teamMember = await User.findOne({ email: 'vedagiripraneeth1@gmail.com' });
        if (!teamMember) {
            console.log('❌ Team member not found');
            return;
        }
        console.log('✅ Team member found:', teamMember.name, '- ID:', teamMember._id);
        console.log('   isTeamMember:', teamMember.isTeamMember);
        console.log('   teamLeaderId:', teamMember.teamLeaderId);

        // Find all leads
        const allLeads = await Lead.find({})
            .select('_id buyer property seller assignedTo transferredFrom transferredAt')
            .populate('buyer', 'name email')
            .populate('property', 'title')
            .populate('seller', 'name email');

        console.log('\n📋 All leads in database:', allLeads.length);
        
        for (const lead of allLeads) {
            console.log(`\nLead ${lead._id}:`);
            console.log(`  Buyer: ${lead.buyer?.name} (${lead.buyer?.email})`);
            console.log(`  Property: ${lead.property?.title}`);
            console.log(`  Seller: ${lead.seller?.name} (${lead.seller?.email})`);
            console.log(`  assignedTo: ${lead.assignedTo || 'null (seller)'}`);
            console.log(`  transferredFrom: ${lead.transferredFrom || 'null'}`);
            console.log(`  transferredAt: ${lead.transferredAt || 'null'}`);
        }

        // Find leads assigned to team member
        const assignedLeads = await Lead.find({ assignedTo: teamMember._id })
            .populate('buyer', 'name email')
            .populate('property', 'title')
            .populate('seller', 'name email');

        console.log(`\n✅ Leads assigned to team member ${teamMember.name}:`, assignedLeads.length);
        
        for (const lead of assignedLeads) {
            console.log(`\nAssigned Lead ${lead._id}:`);
            console.log(`  Buyer: ${lead.buyer?.name} (${lead.buyer?.email})`);
            console.log(`  Property: ${lead.property?.title}`);
            console.log(`  Seller: ${lead.seller?.name} (${lead.seller?.email})`);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

testTransfer();
