require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('./models/Lead');
const User = require('./models/User');

const testDynamicSLA = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to database\n');

        // Find seller
        const seller = await User.findOne({ email: 'praneethvvsss123@gmail.com' });
        if (!seller) {
            console.log('❌ Seller not found');
            process.exit(1);
        }

        // Get seller's workload
        const totalLeads = await Lead.countDocuments({ seller: seller._id });
        const activeLeads = await Lead.countDocuments({ 
            seller: seller._id, 
            'sla.responded': false 
        });

        console.log('📊 SELLER WORKLOAD');
        console.log('═══════════════════════════════════════\n');
        console.log(`Seller: ${seller.name}`);
        console.log(`Total Leads: ${totalLeads}`);
        console.log(`Active (Unresponded): ${activeLeads}\n`);

        // Test different scenarios
        const scenarios = [
            { tier: 'HOT', score: 85, name: 'High Priority Buyer' },
            { tier: 'WARM', score: 65, name: 'Medium Priority Buyer' },
            { tier: 'COLD', score: 45, name: 'Low Priority Buyer' },
            { tier: 'LOW', score: 20, name: 'Casual Browser' }
        ];

        console.log('🧪 DYNAMIC SLA CALCULATIONS');
        console.log('═══════════════════════════════════════\n');

        for (const scenario of scenarios) {
            // Base SLA
            const baseSLA = {
                'HOT': 15,
                'WARM': 60,
                'COLD': 240,
                'LOW': 1440
            }[scenario.tier];

            // Calculate multipliers
            const queueMultiplier = Math.min(1 + (totalLeads / 5) * 0.2, 2.0);
            const activeMultiplier = 1 + (activeLeads / 3) * 0.15;

            // Calculate adjusted SLA
            const adjustedSLA = Math.round(baseSLA * queueMultiplier * activeMultiplier);

            // Maximum caps
            const maxSLA = {
                'HOT': 60,
                'WARM': 180,
                'COLD': 480,
                'LOW': 2880
            }[scenario.tier];

            const finalSLA = Math.min(adjustedSLA, maxSLA);

            console.log(`${scenario.tier === 'HOT' ? '🔥' : scenario.tier === 'WARM' ? '⚡' : scenario.tier === 'COLD' ? '💙' : '🌫️'} ${scenario.tier} - ${scenario.name} (Score: ${scenario.score})`);
            console.log(`   Base SLA: ${baseSLA} min`);
            console.log(`   Queue Multiplier: ×${queueMultiplier.toFixed(2)} (${totalLeads} leads)`);
            console.log(`   Active Multiplier: ×${activeMultiplier.toFixed(2)} (${activeLeads} unresponded)`);
            console.log(`   Calculated: ${adjustedSLA} min`);
            console.log(`   Final SLA: ${finalSLA} min (${Math.floor(finalSLA / 60)}h ${finalSLA % 60}m)`);
            
            if (adjustedSLA > maxSLA) {
                console.log(`   ⚠️  Capped at maximum for ${scenario.tier} tier`);
            }
            console.log('');
        }

        console.log('═══════════════════════════════════════');
        console.log('💡 KEY INSIGHTS:\n');
        
        const queueMult = Math.min(1 + (totalLeads / 5) * 0.2, 2.0);
        const activeMult = 1 + (activeLeads / 3) * 0.15;
        
        console.log(`• With ${totalLeads} total leads and ${activeLeads} pending:`);
        console.log(`  - HOT leads get ${Math.round(15 * queueMult * activeMult)} min (vs 15 min base)`);
        console.log(`  - WARM leads get ${Math.round(60 * queueMult * activeMult)} min (vs 60 min base)`);
        console.log(`• SLA increases fairly based on seller workload`);
        console.log(`• Buyers get realistic expectations`);
        console.log(`• Sellers get manageable deadlines\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

testDynamicSLA();
