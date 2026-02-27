const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'user_status_change',
            'property_approved',
            'property_rejected',
            'user_suspended',
            'user_banned',
            'bulk_action',
            'settings_change',
            'content_moderation',
            'other'
        ]
    },
    targetType: {
        type: String,
        enum: ['user', 'property', 'system', 'bulk'],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    details: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: { type: String, default: '' },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
adminLogSchema.index({ admin: 1, createdAt: -1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });

const AdminLog = mongoose.model('AdminLog', adminLogSchema);
module.exports = AdminLog;
