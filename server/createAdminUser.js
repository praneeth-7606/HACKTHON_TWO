require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdminUser() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');

        console.log('\n🎯 Admin User Creation Tool\n');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists:');
            console.log(`   Name: ${existingAdmin.name}`);
            console.log(`   Email: ${existingAdmin.email}`);
            
            const proceed = await question('\nDo you want to create another admin? (yes/no): ');
            if (proceed.toLowerCase() !== 'yes') {
                console.log('Exiting...');
                process.exit(0);
            }
        }

        // Get admin details
        const name = await question('Enter admin name: ');
        const email = await question('Enter admin email: ');
        const password = await question('Enter admin password (min 8 characters): ');

        if (!name || !email || !password) {
            console.log('❌ All fields are required!');
            process.exit(1);
        }

        if (password.length < 8) {
            console.log('❌ Password must be at least 8 characters!');
            process.exit(1);
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('\n⚠️  User with this email already exists.');
            const convert = await question('Convert this user to admin? (yes/no): ');
            
            if (convert.toLowerCase() === 'yes') {
                existingUser.role = 'admin';
                await existingUser.save();
                console.log('\n✅ User converted to admin successfully!');
                console.log(`   Name: ${existingUser.name}`);
                console.log(`   Email: ${existingUser.email}`);
                console.log(`   Role: ${existingUser.role}`);
            } else {
                console.log('Exiting...');
            }
            process.exit(0);
        }

        // Create new admin user
        const adminUser = await User.create({
            name,
            email,
            password,
            role: 'admin',
            profileCompleted: true,
            accountStatus: 'active',
            isActive: true
        });

        console.log('\n✅ Admin user created successfully!');
        console.log(`   Name: ${adminUser.name}`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Role: ${adminUser.role}`);
        console.log('\n🎉 You can now login with these credentials!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        rl.close();
        mongoose.connection.close();
        process.exit(0);
    }
}

createAdminUser();
