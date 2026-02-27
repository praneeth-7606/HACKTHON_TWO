require('dotenv').config(); // ← MUST be first — loads .env before any module reads process.env

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const leadRoutes = require('./routes/leadRoutes');
const messageRoutes = require('./routes/messageRoutes');
const agentRoutes = require('./routes/agentRoutes');
const searchRoutes = require('./routes/searchRoutes');
const qaRoutes = require('./routes/qaRoutes');
const adminRoutes = require('./routes/admin');
const teamMemberRoutes = require('./routes/teamMemberRoutes');
const { startSLAChecker } = require('./jobs/slaBreachChecker');

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173', // Vite default port
    credentials: true
}));

// Database connection
const DB = process.env.MONGODB_URI;
mongoose.connect(DB).then(() => {
    console.log('DB connection successful!');
    // Start SLA breach checker after DB connection
    startSLAChecker();
}).catch(err => {
    console.log('DB connection error: ', err);
});

// Routes
app.use('/api/v1/users', authRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/agent', agentRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/qa', qaRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/team-members', teamMemberRoutes);

app.get('/', (req, res) => {
    res.send('EstatePulse AI Backend is running!');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});
