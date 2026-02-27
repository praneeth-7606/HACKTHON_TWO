const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Score breakdown
    scores: {
        profile: { type: Number, default: 0 },
        exploration: { type: Number, default: 0 },
        engagement: { type: Number, default: 0 },
        aiInteraction: { type: Number, default: 0 },
        ownerContact: { type: Number, default: 0 },
        bonus: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    
    // Tracking data
    tracking: {
        // Property page tracking
        viewCount: { type: Number, default: 0 },
        pageViewTime: { type: Number, default: 0 }, // seconds
        scrollDepth: { type: Number, default: 0 }, // percentage
        imagesViewed: { type: Boolean, default: false },
        locationViewed: { type: Boolean, default: false },
        
        // Q&A tracking
        qaOpened: { type: Boolean, default: false },
        qaViewTime: { type: Number, default: 0 }, // seconds
        qaAnswersRead: { type: Number, default: 0 },
        qaTotalAnswers: { type: Number, default: 0 },
        
        // Engagement tracking
        liked: { type: Boolean, default: false },
        saved: { type: Boolean, default: false },
        shared: { type: Boolean, default: false },
        
        // AI interaction tracking
        aiQuestionsAsked: { type: Number, default: 0 },
        aiQuestionsAboutViewing: { type: Boolean, default: false },
        aiQuestionsAboutPrice: { type: Boolean, default: false },
        aiQuestionsAboutDocs: { type: Boolean, default: false },
        
        // Owner contact tracking
        messageSent: { type: Boolean, default: false },
        messageLength: { type: Number, default: 0 },
        messageMentionsViewing: { type: Boolean, default: false },
        messageTimestamp: { type: Date },
        
        // Timing
        firstViewedAt: { type: Date },
        lastActiveAt: { type: Date },
        messageDelay: { type: Number, default: 0 } // hours from first view to message
    },
    
    // Lead tier
    tier: {
        type: String,
        enum: ['HOT', 'WARM', 'COLD', 'LOW'],
        default: 'LOW'
    },
    
    // Status
    status: {
        type: String,
        enum: ['NEW', 'CONTACTED', 'RESPONDED', 'QUALIFIED', 'CONVERTED', 'LOST'],
        default: 'NEW'
    },
    
    // SLA tracking
    sla: {
        expectedResponseTime: { type: Number }, // minutes
        responseDeadline: { type: Date },
        responded: { type: Boolean, default: false },
        respondedAt: { type: Date },
        slaBreached: { type: Boolean, default: false },
        calculationDetails: {
            baseSLA: { type: Number },
            queueSize: { type: Number },
            activeLeads: { type: Number },
            queueMultiplier: { type: String },
            activeMultiplier: { type: String }
        }
    },
    
    // === TEAM MEMBER TRANSFER ===
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null = assigned to seller, otherwise assigned to team member
    },
    
    transferredFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Original seller who transferred the lead
    },
    
    transferredAt: { type: Date, default: null },
    
    transferHistory: [
        {
            from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            transferredAt: { type: Date, default: Date.now },
            reason: { type: String, default: '' }
        }
    ],
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
leadSchema.index({ buyer: 1, property: 1 }, { unique: true });
leadSchema.index({ seller: 1, tier: 1, createdAt: -1 });
leadSchema.index({ 'scores.total': -1 });

// Update timestamp on save
leadSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

const Lead = mongoose.model('Lead', leadSchema);
module.exports = Lead;
