const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'seller', 'buyer'],
        default: 'buyer'
    },
    phoneNumber: { type: String, default: '' },
    profession: { type: String, default: '' },
    address: { type: String, default: '' },
    profileCompleted: { type: Boolean, default: false },
    ownerRating: {
        type: Number,
        default: 4.5,
        min: 0,
        max: 5
    },
    bio: { type: String, default: '' },
    company: { type: String, default: '' }, // For Sellers
    budgetRange: { type: String, default: '' }, // For Buyers
    preferredLocation: { type: String, default: '' }, // For Buyers
    avatarUrl: { type: String, default: '' },
    leadScore: { type: Number, default: 0 }, // For buyers
    savedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }], // Saved properties for buyers
    
    // === ADMIN CONTROLS ===
    isActive: { type: Boolean, default: true }, // Admin can activate/deactivate users
    accountStatus: { 
        type: String, 
        enum: ['active', 'inactive', 'suspended', 'banned'], 
        default: 'active' 
    },
    statusReason: { type: String, default: '' }, // Reason for status change
    lastStatusChange: { type: Date, default: null },
    statusChangedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    
    // === USER ANALYTICS ===
    totalTimeSpent: { type: Number, default: 0 }, // in minutes
    lastActive: { type: Date, default: Date.now },
    loginCount: { type: Number, default: 0 },
    propertiesBought: { type: Number, default: 0 },
    propertiesRented: { type: Number, default: 0 },
    
    // === SELLER PERFORMANCE RATING (Layer 1 & 2) ===
    sellerRating: {
        // Overall score (0-100)
        score: { type: Number, default: 100, min: 0, max: 100 },
        
        // Component scores
        responseRate: { type: Number, default: 100 }, // % of leads responded to within SLA
        responseTime: { type: Number, default: 100 }, // Based on avg response time vs SLA
        slaCompliance: { type: Number, default: 100 }, // % of leads with no SLA breach
        buyerSatisfaction: { type: Number, default: 100 }, // Buyer ratings
        
        // Tracking
        totalLeads: { type: Number, default: 0 },
        respondedLeads: { type: Number, default: 0 },
        slaBreaches: { type: Number, default: 0 },
        consecutiveBreaches: { type: Number, default: 0 }, // Consecutive SLA breaches
        
        // Tier
        tier: {
            type: String,
            enum: ['elite', 'excellent', 'good', 'fair', 'poor'],
            default: 'excellent'
        },
        
        // Last updated
        lastUpdated: { type: Date, default: Date.now }
    },
    
    // === ACCOUNT FLAGS & SUSPENSION ===
    accountFlags: {
        isFlagged: { type: Boolean, default: false },
        flagReason: { type: String, default: '' },
        flaggedAt: { type: Date, default: null },
        requiresAdminReview: { type: Boolean, default: false }
    },
    
    suspension: {
        isSuspended: { type: Boolean, default: false },
        suspensionReason: { type: String, default: '' },
        suspendedAt: { type: Date, default: null },
        suspendedUntil: { type: Date, default: null },
        requiresAdminApproval: { type: Boolean, default: false }
    },
    
    // === TEAM MEMBER SYSTEM ===
    teamMembers: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            email: { type: String, required: true },
            name: { type: String, required: true },
            role: { type: String, default: 'sales' }, // sales, support, etc.
            addedAt: { type: Date, default: Date.now },
            status: { type: String, enum: ['active', 'inactive'], default: 'active' }
        }
    ],
    
    isTeamMember: { type: Boolean, default: false },
    teamLeaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    teamRole: { type: String, default: '' }, // Role within the team
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method — always compares against this.password (the hashed value)
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
