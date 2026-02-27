require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('./models/Message');

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await Message.deleteMany({});
    console.log(`Deleted ${result.deletedCount} messages`);
    process.exit(0);
})();
