const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Property = require('./models/Property');

const addWhitefieldProperty = async () => {
    try {
        console.log('🏠 Adding Whitefield property...\n');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find seller (praneeth)
        const seller = await User.findOne({ email: 'praneethvvsss123@gmail.com' });
        
        if (!seller) {
            console.error('❌ Seller not found!');
            process.exit(1);
        }

        console.log(`✅ Found seller: ${seller.name}\n`);

        // Create new Whitefield property
        const property = await Property.create({
            title: 'Premium Commercial Site in Whitefield',
            description: 'Excellent commercial site located in the heart of Whitefield, Bangalore\'s premier IT hub. This prime plot is strategically positioned near major tech parks including ITPL, Prestige Tech Park, and RMZ Ecoworld. Perfect for building a commercial complex, office space, or retail establishment. The area has excellent infrastructure with wide roads, metro connectivity (upcoming), and is surrounded by residential complexes ensuring high footfall. Close to international schools, hospitals, and shopping malls. Ideal for investors and businesses looking to establish presence in Whitefield.',
            
            price: 25000000, // 2.5 Crores
            propertyType: 'Plot',
            listingType: 'Sale',
            
            // Location
            location: 'ITPL Main Road, Whitefield',
            address: 'ITPL Main Road, Near Prestige Tech Park',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560066',
            landmark: 'Near ITPL and Prestige Tech Park',
            coordinates: {
                lat: 12.9698,
                lng: 77.7499
            },
            
            // Specifications
            area: 5000,
            areaUnit: 'sqft',
            bedrooms: null,
            bathrooms: null,
            balconies: null,
            floorNumber: null,
            totalFloors: null,
            furnishingStatus: 'Unfurnished',
            propertyAge: 0,
            constructionStatus: 'Ready to Move',
            
            // Pricing
            negotiable: true,
            maintenanceCharges: null,
            
            // Availability
            availableFrom: new Date(),
            occupancyStatus: 'Vacant',
            listingStatus: 'Active',
            
            // Features
            features: [
                'Corner Plot',
                'Wide Road Access',
                'Clear Title',
                'BMRDA Approved',
                'Commercial Zone',
                'High Visibility',
                'Metro Connectivity (Upcoming)',
                'Near IT Parks',
                'Water Connection',
                'Electricity Connection',
                'Drainage System',
                'Street Lights'
            ],
            
            // Images
            images: [
                'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
                'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
                'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'
            ],
            
            // Vastu Info
            vastuInfo: 'East-facing commercial plot ensuring maximum morning sunlight and positive energy flow. Main entrance can be positioned in the northeast direction for prosperity. Ideal for commercial establishments as per Vastu principles. The plot orientation allows for optimal building design with natural light and ventilation.',
            
            // AI Broker Summary
            aiBrokerSummary: 'Prime commercial plot in Whitefield IT hub with excellent ROI potential. Located on ITPL Main Road with high visibility and footfall. Surrounded by major tech parks (ITPL, Prestige Tech Park, RMZ Ecoworld) ensuring consistent demand. Upcoming metro connectivity will further boost property value. Clear title, BMRDA approved, ready for immediate construction. Perfect for commercial complex, office building, or retail establishment. Strong rental and resale potential due to Whitefield\'s continuous growth as Bangalore\'s premier IT destination.',
            
            // Seller
            seller: seller._id,
            
            // Stats
            visitCount: 0,
            interestCount: 0,
            likes: [],
            comments: [],
            opinions: []
        });

        console.log('✅ Property created successfully!\n');
        console.log('='.repeat(80));
        console.log(`\n📋 Property Details:`);
        console.log(`   ID: ${property._id}`);
        console.log(`   Title: ${property.title}`);
        console.log(`   💰 Price: ₹${(property.price / 10000000).toFixed(2)} Crores`);
        console.log(`   📍 Location: ${property.location}, ${property.city}`);
        console.log(`   🏠 Type: ${property.propertyType}`);
        console.log(`   📐 Area: ${property.area} ${property.areaUnit}`);
        console.log(`   🧭 Coordinates: ${property.coordinates.lat}, ${property.coordinates.lng}`);
        console.log(`   📊 Status: ${property.listingStatus}`);
        console.log(`   👤 Seller: ${seller.name} (${seller.email})`);
        console.log(`   🧭 Vastu: East-facing (Positive energy)`);
        console.log(`\n✨ Features:`);
        property.features.forEach((feature, index) => {
            console.log(`   ${index + 1}. ${feature}`);
        });
        console.log('\n' + '='.repeat(80));
        console.log('\n🎉 Whitefield commercial site added successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

addWhitefieldProperty();
