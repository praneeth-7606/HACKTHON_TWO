require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seedAdmin() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
        
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log(`   Name: ${existingAdmin.name}`);
            console.log(`   Email: ${existingAdmin.email}`);
            console.log(`   Role: ${existingAdmin.role}`);
            process.exit(0);
        }

        // Create admin user
        const adminUser = await User.create({
            name: 'Admin',
            email: 'admin@gmail.com',
            password: 'admin123',
            role: 'admin',
            profileCompleted: true,
            accountStatus: 'active',
            isActive: true
        });

        console.log('\n✅ Admin user created successfully!');
        console.log(`   Name: ${adminUser.name}`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Password: admin123`);
        console.log(`   Role: ${adminUser.role}`);
        console.log('\n🎉 You can now login with these credentials!');
        console.log('   URL: http://localhost:5173/auth');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

seedAdmin();
