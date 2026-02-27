const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const listUsers = async () => {
    try {
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected!\n');

        const users = await User.find({}).select('name email role phone company');
        
        console.log('👥 Users in Database:\n');
        console.log('='.repeat(80));
        
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name} (${user.role.toUpperCase()})`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   🔑 Password: 123456789 (hashed in DB)`);
            if (user.phone) console.log(`   📱 Phone: ${user.phone}`);
            if (user.company) console.log(`   🏢 Company: ${user.company}`);
        });
        
        console.log('\n' + '='.repeat(80));
        console.log(`\n📊 Total Users: ${users.length}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

listUsers();
