const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Property = require('./models/Property');

const seedProperties = async () => {
    try {
        console.log('🏠 Starting property seeding...');
        console.log('📡 Connecting to MongoDB...');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find Praneeth (seller)
        const praneeth = await User.findOne({ email: 'praneethvvsss123@gmail.com' });
        
        if (!praneeth) {
            console.error('❌ Seller "Praneeth" not found! Please run seed.js first.');
            process.exit(1);
        }

        console.log(`✅ Found seller: ${praneeth.name}\n`);

        // Clear existing properties
        console.log('🗑️  Clearing existing properties...');
        await Property.deleteMany({ seller: praneeth._id });
        console.log('✅ Existing properties cleared\n');

        console.log('🏗️  Creating 7 premium properties...\n');

        const properties = await Property.create([
            {
                title: 'Luxury 3BHK Apartment in Koramangala',
                description: 'Spacious 3BHK apartment in the heart of Koramangala, one of Bangalore\'s most sought-after neighborhoods. This property features modern architecture, premium fittings, and is located close to Sony World Junction, Forum Mall, and multiple dining options. Perfect for IT professionals and families who value convenience and lifestyle. The apartment offers excellent ventilation, natural lighting, and a peaceful environment despite being in a prime location.',
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
                features: ['Parking', 'Gym', 'Swimming Pool', 'Security', 'Power Backup', 'Lift', 'Club House', 'Children Play Area', 'Intercom', 'Visitor Parking'],
                images: [
                    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
                    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
                    'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800'
                ],
                seller: praneeth._id,
                listingStatus: 'Active',
                furnishingStatus: 'Semi Furnished',
                floorNumber: 5,
                totalFloors: 12,
                propertyAge: 2,
                negotiable: true,
                maintenanceCharges: 3500,
                vastuInfo: 'East-facing property ensures morning sunlight and positive energy. Main entrance in the northeast direction brings prosperity. Kitchen in southeast corner as per Vastu guidelines. Bedrooms positioned for optimal energy flow.',
                aiBrokerSummary: 'Prime Koramangala location with excellent connectivity to IT hubs, metro station within 1km, surrounded by restaurants, cafes, and shopping centers. East-facing ensures morning sunlight and positive energy as per Vastu. Ideal for families and working professionals seeking urban lifestyle with all modern amenities.',
                likes: [],
                visitCount: 0
            },
            {
                title: 'Modern 2BHK in Indiranagar',
                description: 'Contemporary 2BHK apartment in the vibrant Indiranagar neighborhood, known for its cosmopolitan culture and excellent infrastructure. Located on 12th Main Road, this property is walking distance from 100 Feet Road, CMH Road, and Indiranagar Metro Station. The area is famous for its restaurants, pubs, boutiques, and cafes. Perfect for young professionals and couples who want to be in the center of Bangalore\'s social scene while enjoying a comfortable home.',
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
                features: ['Parking', 'Gym', 'Security', 'Power Backup', 'Lift', 'Intercom', 'CCTV', 'Visitor Parking', 'Rainwater Harvesting'],
                images: [
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
                    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
                    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800'
                ],
                seller: praneeth._id,
                listingStatus: 'Active',
                furnishingStatus: 'Fully Furnished',
                floorNumber: 3,
                totalFloors: 8,
                propertyAge: 3,
                negotiable: true,
                maintenanceCharges: 2800,
                vastuInfo: 'North-facing property brings prosperity and positive energy as per Vastu. Main door opens to auspicious direction. Living room in northeast for positive vibes. Balcony placement ensures good air circulation.',
                aiBrokerSummary: 'Excellent Indiranagar location with vibrant nightlife, dining, and shopping. North-facing as per Vastu brings prosperity and positive energy. Metro connectivity, hospitals, and schools within 2km radius. Fully furnished with modern amenities, ready to move in. Perfect for young professionals and small families.',
                likes: [],
                visitCount: 0
            },
            {
                title: 'Spacious 4BHK Villa in Whitefield',
                description: 'Independent villa with private garden in the peaceful Whitefield area, Bangalore\'s IT hub. This property is located on ITPL Main Road, close to major tech parks including ITPL, Prestige Tech Park, and RMZ Ecoworld. The villa features spacious rooms, modern kitchen, servant quarters, and a beautiful garden. Surrounded by international schools like Inventure Academy and TISB, and hospitals like Columbia Asia. Ideal for large families who want space, privacy, and proximity to work.',
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
                features: ['Parking', 'Garden', 'Security', 'Power Backup', 'Servant Room', 'Modular Kitchen', 'Terrace', 'Bore Well', 'Rainwater Harvesting', 'Solar Panels'],
                images: [
                    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
                    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
                    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800'
                ],
                seller: praneeth._id,
                listingStatus: 'Active',
                furnishingStatus: 'Semi Furnished',
                floorNumber: 0,
                totalFloors: 2,
                propertyAge: 1,
                negotiable: true,
                maintenanceCharges: 5000,
                vastuInfo: 'South-facing villa ensures wealth and prosperity as per Vastu. Main entrance in east direction. Kitchen in southeast corner. Master bedroom in southwest for stability. Garden in north and east for positive energy flow.',
                aiBrokerSummary: 'Premium villa in Whitefield tech hub with excellent infrastructure. South-facing as per Vastu ensures wealth and prosperity. Close to ITPL, international schools, and hospitals. Large garden, servant quarters, and solar panels for sustainable living. Perfect for executives and large families seeking luxury and convenience.',
                likes: [],
                visitCount: 0
            },
            {
                title: 'Cozy 2BHK in HSR Layout',
                description: 'Well-maintained 2BHK apartment in the family-friendly HSR Layout, Sector 2. This area is known for its excellent infrastructure, safety, and community living. The property is close to reputed schools like Greenwood High and Inventure Academy, hospitals like Sakra World Hospital and Narayana Health, and shopping complexes like Forum Mall and Central Mall. The apartment complex has a strong residents association and regular community events. Perfect for families with children.',
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
                features: ['Parking', 'Gym', 'Swimming Pool', 'Security', 'Power Backup', 'Lift', 'Children Play Area', 'Jogging Track', 'Indoor Games', 'Library'],
                images: [
                    'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800',
                    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
                    'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800'
                ],
                seller: praneeth._id,
                listingStatus: 'Active',
                furnishingStatus: 'Semi Furnished',
                floorNumber: 4,
                totalFloors: 10,
                propertyAge: 4,
                negotiable: true,
                maintenanceCharges: 2500,
                vastuInfo: 'West-facing property ensures evening sunlight and good ventilation. Balconies positioned for optimal air flow. Living areas in northeast and north for positive energy. Bedrooms in southwest and south for stability and rest.',
                aiBrokerSummary: 'Family-friendly HSR Layout with excellent schools, hospitals, and parks nearby. West-facing ensures evening sunlight and good ventilation. Close to Outer Ring Road for easy commute to IT corridors. Safe neighborhood with active community. Ideal for families with children seeking quality education and peaceful living.',
                likes: [],
                visitCount: 0
            },
            {
                title: 'Premium 3BHK Penthouse in Jayanagar',
                description: 'Luxurious penthouse with private terrace garden in the prestigious Jayanagar 4th Block. This property combines traditional Bangalore charm with modern amenities. Jayanagar is known for its tree-lined streets, parks, and cultural heritage. The penthouse offers panoramic views of the city, spacious rooms, and a 1000 sqft terrace garden perfect for parties and relaxation. Close to Jayanagar Shopping Complex, Jayanagar Metro Station, and multiple parks. Ideal for those who appreciate heritage and luxury.',
                price: 9500000,
                propertyType: 'Apartment',
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
                features: ['Parking', 'Terrace Garden', 'Gym', 'Security', 'Power Backup', 'Lift', 'Club House', 'BBQ Area', 'Jacuzzi', 'Home Theater'],
                images: [
                    'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800',
                    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800',
                    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800'
                ],
                seller: praneeth._id,
                listingStatus: 'Active',
                furnishingStatus: 'Fully Furnished',
                floorNumber: 12,
                totalFloors: 12,
                propertyAge: 1,
                negotiable: false,
                maintenanceCharges: 4500,
                vastuInfo: 'North-facing penthouse brings prosperity and positive energy as per Vastu. Terrace garden in north and east for maximum positive energy. Living areas positioned for natural light. Master bedroom in southwest corner for stability and peace.',
                aiBrokerSummary: 'Prestigious Jayanagar penthouse with traditional Bangalore charm and modern luxury. North-facing as per Vastu brings prosperity and positive energy. Private terrace garden, jacuzzi, and home theater for entertainment. Close to metro, shopping complexes, and parks. Perfect for affluent families who value heritage, culture, and luxury living.',
                likes: [],
                visitCount: 0
            },
            {
                title: 'Elegant 3BHK in Marathahalli',
                description: 'Modern 3BHK apartment in Marathahalli, strategically located at the junction of Outer Ring Road and Old Airport Road. This area is a major IT hub with easy access to tech parks in Whitefield, Bellandur, and Sarjapur Road. The property is close to Marathahalli Bridge, Innovative Multiplex, and multiple shopping centers. Excellent connectivity via BMTC buses and upcoming metro line. Perfect for IT professionals working in East Bangalore who want to minimize commute time.',
                price: 7800000,
                propertyType: 'Apartment',
                bedrooms: 3,
                bathrooms: 2,
                area: 1450,
                areaUnit: 'sqft',
                location: 'Outer Ring Road, Marathahalli',
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560037',
                coordinates: {
                    lat: 12.9591,
                    lng: 77.6974
                },
                features: ['Parking', 'Gym', 'Swimming Pool', 'Security', 'Power Backup', 'Lift', 'Club House', 'Badminton Court', 'Yoga Room', 'Amphitheater'],
                images: [
                    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
                    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
                ],
                seller: praneeth._id,
                listingStatus: 'Active',
                furnishingStatus: 'Semi Furnished',
                floorNumber: 7,
                totalFloors: 15,
                propertyAge: 2,
                negotiable: true,
                maintenanceCharges: 3200,
                vastuInfo: 'East-facing apartment ensures morning sunlight and positive energy flow. Main entrance in northeast direction. Living room positioned for natural light. Kitchen in southeast corner as per Vastu principles. Bedrooms in southwest for peaceful rest.',
                aiBrokerSummary: 'Strategic Marathahalli location with excellent connectivity to IT corridors. East-facing ensures morning sunlight and positive energy. Close to Outer Ring Road for easy access to Whitefield, Bellandur, and Sarjapur. Modern amenities including badminton court and yoga room. Ideal for IT professionals and nuclear families seeking convenience and lifestyle.',
                likes: [],
                visitCount: 0
            },
            {
                title: 'Serene 2BHK in Electronic City',
                description: 'Peaceful 2BHK apartment in Electronic City Phase 1, Bangalore\'s largest IT hub. This property is located close to major tech parks including Infosys, Wipro, TCS, and Biocon. The area has excellent infrastructure with schools, hospitals, shopping malls, and entertainment options. The apartment complex is gated with 24/7 security and offers a serene environment away from city chaos. Perfect for IT professionals working in Electronic City who want to live close to work and enjoy a balanced lifestyle.',
                price: 5500000,
                propertyType: 'Apartment',
                bedrooms: 2,
                bathrooms: 2,
                area: 1050,
                areaUnit: 'sqft',
                location: 'Electronic City Phase 1',
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560100',
                coordinates: {
                    lat: 12.8456,
                    lng: 77.6603
                },
                features: ['Parking', 'Gym', 'Swimming Pool', 'Security', 'Power Backup', 'Lift', 'Club House', 'Convenience Store', 'ATM', 'Medical Center'],
                images: [
                    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
                    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
                    'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800'
                ],
                seller: praneeth._id,
                listingStatus: 'Active',
                furnishingStatus: 'Fully Furnished',
                floorNumber: 6,
                totalFloors: 14,
                propertyAge: 3,
                negotiable: true,
                maintenanceCharges: 2200,
                vastuInfo: 'North-facing property brings prosperity and wealth as per Vastu. Main door in northeast for positive energy. Living areas in north and east. Kitchen in southeast corner. Bedrooms in southwest and south for stability and peaceful sleep.',
                aiBrokerSummary: 'Serene Electronic City location with walking distance to major IT companies. North-facing as per Vastu brings prosperity. Fully furnished and ready to move in. Gated community with excellent security and amenities. Perfect for IT professionals seeking work-life balance with minimal commute and peaceful living environment.',
                likes: [],
                visitCount: 0
            }
        ]);

        console.log('✅ Properties created successfully!\n');
        console.log('📊 Summary:');
        console.log('='.repeat(80));
        
        properties.forEach((prop, index) => {
            console.log(`\n${index + 1}. ${prop.title}`);
            console.log(`   💰 Price: ₹${(prop.price / 100000).toFixed(2)} Lakhs`);
            console.log(`   📍 Location: ${prop.location}, ${prop.city}`);
            console.log(`   🏠 Type: ${prop.bedrooms} BHK ${prop.propertyType}`);
            console.log(`   📐 Area: ${prop.area} ${prop.areaUnit}`);
            console.log(`   🧭 Vastu: ${prop.vastuInfo ? '✅ Compliant' : '❌ Not specified'}`);
            console.log(`   🏢 Floor: ${prop.floorNumber}/${prop.totalFloors}`);
        });
        
        console.log('\n' + '='.repeat(80));
        console.log(`\n🎉 Total Properties Created: ${properties.length}`);
        console.log(`👤 Seller: ${praneeth.name} (${praneeth.email})`);
        console.log('\n✨ All properties have:');
        console.log('   ✅ Complete addresses in Bangalore');
        console.log('   ✅ Vastu compliance details');
        console.log('   ✅ Rich descriptions and amenities');
        console.log('   ✅ AI-generated summaries');
        console.log('   ✅ Ready for AI agent queries\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

seedProperties();
