const mongoose = require('mongoose');
const User = require('./models/User');
const Property = require('./models/Property');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const properties = [
    {
        title: 'Luxury 3BHK Apartment in Whitefield',
        propertyType: 'Apartment',
        listingType: 'Sale',
        description: 'Beautiful 3-bedroom apartment with modern amenities, spacious balcony, and excellent ventilation. Located in a prime area with easy access to metro and shopping centers.',
        location: 'Whitefield, Bangalore',
        address: '123 Tech Park Road, Whitefield',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560066',
        landmark: 'Near Whitefield Metro Station',
        coordinates: { lat: 12.9698, lng: 77.7499 },
        price: 7500000,
        negotiable: true,
        maintenanceCharges: 5000,
        area: 1400,
        areaUnit: 'sqft',
        bedrooms: 3,
        bathrooms: 2,
        balconies: 2,
        floorNumber: 5,
        totalFloors: 15,
        furnishingStatus: 'Semi Furnished',
        propertyAge: 3,
        constructionStatus: 'Ready to Move',
        availableFrom: new Date(),
        occupancyStatus: 'Vacant',
        listingStatus: 'Active',
        images: [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
            'https://images.unsplash.com/photo-1512917774080-9b274b3f0df0?w=800'
        ],
        features: ['Gym', 'Swimming Pool', 'Security', 'Parking', 'Garden', 'Power Backup'],
        vastuInfo: 'North-facing apartment with excellent natural light',
        approvalStatus: 'approved'
    },
    {
        title: 'Modern 2BHK Villa in Indiranagar',
        propertyType: 'Villa',
        listingType: 'Sale',
        description: 'Spacious 2-bedroom villa with private garden, modern kitchen, and attached garage. Perfect for families looking for a peaceful residential area.',
        location: 'Indiranagar, Bangalore',
        address: '456 Garden Lane, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        landmark: 'Near Indiranagar Lake',
        coordinates: { lat: 12.9716, lng: 77.6412 },
        price: 12000000,
        negotiable: false,
        maintenanceCharges: 3000,
        area: 2200,
        areaUnit: 'sqft',
        bedrooms: 2,
        bathrooms: 2,
        balconies: 1,
        floorNumber: 0,
        totalFloors: 1,
        furnishingStatus: 'Unfurnished',
        propertyAge: 5,
        constructionStatus: 'Ready to Move',
        availableFrom: new Date(),
        occupancyStatus: 'Vacant',
        listingStatus: 'Active',
        images: [
            'https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=800',
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
        ],
        features: ['Garden', 'Garage', 'Security Gate', 'Water Tank', 'Solar Panel'],
        vastuInfo: 'East-facing villa with positive energy flow',
        approvalStatus: 'approved'
    },
    {
        title: 'Premium 4BHK Penthouse in Koramangala',
        propertyType: 'Apartment',
        listingType: 'Sale',
        description: 'Stunning penthouse with panoramic city views, premium finishes, and state-of-the-art amenities. Located in the heart of Bangalore\'s vibrant neighborhood.',
        location: 'Koramangala, Bangalore',
        address: '789 Premium Heights, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034',
        landmark: 'Near Koramangala Market',
        coordinates: { lat: 12.9352, lng: 77.6245 },
        price: 18500000,
        negotiable: true,
        maintenanceCharges: 8000,
        area: 2800,
        areaUnit: 'sqft',
        bedrooms: 4,
        bathrooms: 3,
        balconies: 3,
        floorNumber: 20,
        totalFloors: 25,
        furnishingStatus: 'Fully Furnished',
        propertyAge: 2,
        constructionStatus: 'Ready to Move',
        availableFrom: new Date(),
        occupancyStatus: 'Vacant',
        listingStatus: 'Active',
        images: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
            'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800'
        ],
        features: ['Gym', 'Swimming Pool', 'Concierge', 'Parking', 'Home Theater', 'Rooftop Garden'],
        vastuInfo: 'South-west facing penthouse with excellent prosperity',
        approvalStatus: 'approved'
    },
    {
        title: 'Cozy 1BHK Studio in MG Road',
        propertyType: 'Studio',
        listingType: 'Rent',
        description: 'Compact and well-designed studio apartment perfect for professionals. Fully furnished with modern amenities and located in a prime commercial area.',
        location: 'MG Road, Bangalore',
        address: '321 Business Plaza, MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        landmark: 'Near MG Road Metro Station',
        coordinates: { lat: 12.9352, lng: 77.6245 },
        price: 25000,
        negotiable: false,
        maintenanceCharges: 2000,
        area: 450,
        areaUnit: 'sqft',
        bedrooms: 1,
        bathrooms: 1,
        balconies: 0,
        floorNumber: 8,
        totalFloors: 12,
        furnishingStatus: 'Fully Furnished',
        propertyAge: 1,
        constructionStatus: 'Ready to Move',
        availableFrom: new Date(),
        occupancyStatus: 'Vacant',
        listingStatus: 'Active',
        images: [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
            'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'
        ],
        features: ['WiFi', 'AC', 'Parking', 'Security', 'Housekeeping'],
        vastuInfo: 'North-facing studio with positive vibes',
        approvalStatus: 'approved'
    }
];

async function addProperties() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find or create seller user
        let seller = await User.findOne({ name: 'praneeth', role: 'seller' });
        
        if (!seller) {
            console.log('Seller not found. Creating new seller user...');
            seller = await User.create({
                name: 'praneeth',
                email: `praneeth${Date.now()}@example.com`,
                password: 'password123',
                role: 'seller',
                phoneNumber: '9876543210',
                profession: 'Real Estate Developer',
                company: 'Praneeth Properties',
                ownerRating: 4.8,
                profileCompleted: true,
                accountStatus: 'active'
            });
            console.log('✓ Seller created:', seller.name);
        } else {
            console.log('✓ Seller found:', seller.name);
        }

        // Add properties
        const createdProperties = [];
        for (const propData of properties) {
            const property = await Property.create({
                ...propData,
                seller: seller._id
            });
            createdProperties.push(property);
            console.log(`✓ Property created: ${property.title}`);
        }

        console.log(`\n✅ Successfully added ${createdProperties.length} properties for seller: ${seller.name}`);
        console.log(`Seller ID: ${seller._id}`);
        console.log(`Seller Email: ${seller.email}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

addProperties();
