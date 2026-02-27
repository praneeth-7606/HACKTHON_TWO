require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('./models/Lead');

const clearAllLeads = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        const result = await Lead.deleteMany({});
        console.log(`Deleted ${result.deletedCount} leads`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

clearAllLeads();
