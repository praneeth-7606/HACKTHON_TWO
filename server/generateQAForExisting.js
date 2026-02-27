/**
 * Script to generate Q&A for existing properties
 * Run: node server/generateQAForExisting.js
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Property = require('./models/Property');
const questionGeneratorAgent = require('./services/questionGeneratorAgent');

const generateQAForAllProperties = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all properties without Q&A
        const properties = await Property.find({
            $or: [
                { sellerQA: { $exists: false } },
                { sellerQA: { $size: 0 } }
            ]
        });

        console.log(`📋 Found ${properties.length} properties without Q&A\n`);

        if (properties.length === 0) {
            console.log('✅ All properties already have Q&A generated!');
            process.exit(0);
        }

        let successCount = 0;
        let failCount = 0;

        for (const property of properties) {
            try {
                console.log(`\n🏡 Processing: ${property.title}`);
                console.log(`   ID: ${property._id}`);
                console.log(`   Type: ${property.propertyType} | Price: ₹${(property.price / 100000).toFixed(1)}L`);

                // Generate questions
                const questions = await questionGeneratorAgent.generateQuestions(property);
                
                if (questions && questions.length > 0) {
                    property.sellerQA = questions;
                    property.qaCompleted = false; // Mark as not completed
                    await property.save();
                    
                    console.log(`   ✅ Generated ${questions.length} questions`);
                    successCount++;
                } else {
                    console.log(`   ❌ Failed to generate questions`);
                    failCount++;
                }

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (err) {
                console.error(`   ❌ Error: ${err.message}`);
                failCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Success: ${successCount} properties`);
        console.log(`❌ Failed: ${failCount} properties`);
        console.log(`📝 Total: ${properties.length} properties`);
        console.log('='.repeat(60));

        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal Error:', error);
        process.exit(1);
    }
};

// Run the script
generateQAForAllProperties();
