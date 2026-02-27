const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Property = require('./models/Property');
const Lead = require('./models/Lead');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');
        console.log('📡 Connecting to MongoDB Atlas...');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Property.deleteMany({});
        await Lead.deleteMany({});
        await Message.deleteMany({});
        await Notification.deleteMany({});
        console.log('✅ Existing data cleared');

        // Create Users
        console.log('👤 Creating users...');
        
        const hashedPassword123 = await bcrypt.hash('123456789', 10);

        // Seller - Praneeth
        const praneeth = await User.create({
            name: 'Praneeth',
            email: 'praneethvvsss123@gmail.com',
            password: hashedPassword123,
            role: 'seller',
            phone: '+91 98765 43210',
            company: 'Praneeth Properties',
            bio: 'Experienced real estate professional with 10+ years in Bangalore property market. Specializing in premium residential properties.',
            performanceScore: 95
        });

        // Buyer - Lasya
        const lasya = await User.create({
            name: 'Lasya',
            email: 'praneethvvsss@gmail.com',
            password: hashedPassword123,
            role: 'buyer',
            phone: '+91 98765 43211',
            budgetRange: '50L-1Cr',
            preferredLocation: 'Bangalore, Koramangala'
        });

        console.log('✅ Users created');

        // Create Properties with detailed locations
        console.log('🏠 Creating properties...');

        const properties = await Property.create([
            {
                title: 'Luxury 3BHK Apartment in Koramangala',
                description: 'Spacious 3BHK apartment in the heart of Koramangala with modern amenities. Close to restaurants, shopping malls, and metro station. Perfect for families.',
                price: 8500000,
                propertyType: 'Apartment',
                bedrooms: 3,
                bathrooms: 3,
                area: 1650,
                areaUnit: 'sqft',
                location: '5th Block, Koramangala',
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560095',
                coordinates: {
                    lat: 12.9352,
                    lng: 77.6245
                },
                amenities: ['Parking', 'Gym', 'Swimming Pool', 'Security', 'Power Backup', 'Lift', 'Club House'],
                images: [
                    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
                    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
                ],
                seller: praneeth._id,
                status: 'available',
                furnished: 'Semi-Furnished',
                parking: 2,
                facing: 'East',
                floorNumber: 5,
                totalFloors: 12,
                ageOfProperty: 2,
                vastu: true,
                negotiable: true,
                maintenanceCharge: 3500,
                aiBrokerSummary: 'Prime location in Koramangala with excellent connectivity. Close to Sony World Junction, Forum Mall, and multiple restaurants. Metro station within 1km. Ideal for IT professionals and families.',
                likes: [],
                visitCount: 0
            },
            {
                title: 'Modern 2BHK in Indiranagar',
                description: 'Contemporary 2BHK apartment in vibrant Indiranagar. Walking distance to 100 Feet Road, CMH Road, and metro station. Great for young professionals.',
                price: 7200000,
                propertyType: 'Apartment',
                bedrooms: 2,
                bathrooms: 2,
                area: 1200,
                areaUnit: 'sqft',
                location: '12th Main Road, Indiranagar',
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560038',
                coordinates: {
                    lat: 12.9716,
                    lng: 77.6412
                },
                amenities: ['Parking', 'Gym', 'Security', 'Power Backup', 'Lift', 'Intercom'],
                images: [
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
                    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
                ],
                seller: praneeth._id,
                status: 'available',
                furnished: 'Fully-Furnished',
                parking: 1,
                facing: 'North',
                floorNumber: 3,
                totalFloors: 8,
                ageOfProperty: 3,
                vastu: true,
                negotiable: true,
                maintenanceCharge: 2800,
                aiBrokerSummary: 'Excellent location in Indiranagar with vibrant nightlife and dining options. Close to metro station, hospitals, and shopping areas. Perfect for young professionals.',
                likes: [],
                visitCount: 0
            },
            {
                title: 'Spacious 4BHK Villa in Whitefield',
                description: 'Independent villa with garden in peaceful Whitefield area. Near tech parks, international schools, and hospitals. Ideal for large families.',
                price: 12500000,
                propertyType: 'Villa',
                bedrooms: 4,
                bathrooms: 4,
                area: 2800,
                areaUnit: 'sqft',
                location: 'ITPL Main Road, Whitefield',
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560066',
                coordinates: {
                    lat: 12.9698,
                    lng: 77.7499
                },
                amenities: ['Parking', 'Garden', 'Security', 'Power Backup', 'Servant Room', 'Modular Kitchen'],
                images: [
                    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
                    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800'
                ],
                seller: praneeth._id,
                status: 'available',
                furnished: 'Semi-Furnished',
                parking: 3,
                facing: 'South',
                floorNumber: 0,
                totalFloors: 2,
                ageOfProperty: 1,
                vastu: true,
                negotiable: true,
                maintenanceCharge: 5000,
                aiBrokerSummary: 'Premium villa in Whitefield tech hub. Close to ITPL, major IT companies, and international schools. Peaceful residential area with excellent infrastructure.',
                likes: [],
                visitCount: 0
            },
            {
                title: 'Cozy 2BHK in HSR Layout',
                description: 'Well-maintained 2BHK apartment in family-friendly HSR Layout. Near schools, hospitals, and shopping complexes. Great connectivity.',
                price: 6800000,
                propertyType: 'Apartment',
                bedrooms: 2,
                bathrooms: 2,
                area: 1100,
                areaUnit: 'sqft',
                location: 'Sector 2, HSR Layout',
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560102',
                coordinates: {
                    lat: 12.9116,
                    lng: 77.6473
                },
                amenities: ['Parking', 'Gym', 'Swimming Pool', 'Security', 'Power Backup', 'Lift'],
                images: [
                    'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800',
                    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800'
                ],
                seller: praneeth._id,
                status: 'available',
                furnished: 'Semi-Furnished',
                parking: 1,
                facing: 'West',
                floorNumber: 4,
                totalFloors: 10,
                ageOfProperty: 4,
                vastu: true,
                negotiable: true,
                maintenanceCharge: 2500,
                aiBrokerSummary: 'Family-friendly HSR Layout with excellent schools and hospitals nearby. Close to Outer Ring Road for easy commute. Safe and peaceful neighborhood.',
                likes: [],
                visitCount: 0
            },
            {
                title: 'Premium 3BHK Penthouse in Jayanagar',
                description: 'Luxurious penthouse with terrace garden in prestigious Jayanagar. Traditional Bangalore neighborhood with modern amenities.',
                price: 9500000,
                propertyType: 'Penthouse',
                bedrooms: 3,
                bathrooms: 3,
                area: 2000,
                areaUnit: 'sqft',
                location: '4th Block, Jayanagar',
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560011',
                coordinates: {
                    lat: 12.9250,
                    lng: 77.5838
                },
                amenities: ['Parking', 'Terrace Garden', 'Gym', 'Security', 'Power Backup', 'Lift', 'Club House'],
                images: [
                    'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800',
                    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800'
                ],
                seller: praneeth._id,
                status: 'available',
                furnished: 'Fully-Furnished',
                parking: 2,
                facing: 'North',
                floorNumber: 12,
                totalFloors: 12,
                ageOfProperty: 1,
                vastu: true,
                negotiable: false,
                maintenanceCharge: 4500,
                aiBrokerSummary: 'Prestigious Jayanagar location with traditional Bangalore charm. Close to shopping complexes, parks, and metro station. Excellent for families who value heritage and modernity.',
                likes: [],
                visitCount: 0
            }
        ]);

        console.log('✅ Properties created');

        // Create some sample leads
        console.log('📊 Creating sample leads...');

        await Lead.create([
            {
                buyer: lasya._id,
                property: properties[0]._id,
                seller: praneeth._id,
                interactionType: 'like',
                score: 85,
                status: 'hot'
            },
            {
                buyer: rahul._id,
                property: properties[1]._id,
                seller: praneeth._id,
                interactionType: 'visit',
                score: 75,
                status: 'warm'
            }
        ]);

        console.log('✅ Sample leads created');

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   👤 Users: ${await User.countDocuments()}`);
        console.log(`   🏠 Properties: ${await Property.countDocuments()}`);
        console.log(`   📊 Leads: ${await Lead.countDocuments()}`);
        console.log('\n🔐 Login Credentials:');
        console.log('   Seller (Praneeth):');
        console.log('   📧 Email: praneethvvsss123@gmail.com');
        console.log('   🔑 Password: 123456789');
        console.log('\n   Buyer (Lasya):');
        console.log('   📧 Email: praneethvvsss@gmail.com');
        console.log('   🔑 Password: 123456789');
        console.log('\n✨ All properties have detailed locations for Maps API!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
