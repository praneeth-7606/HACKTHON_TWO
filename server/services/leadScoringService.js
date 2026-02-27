const Lead = require('../models/Lead');
const User = require('../models/User');

/**
 * Calculate profile completeness score
 */
const calculateProfileScore = (user) => {
    const requiredFields = ['name', 'email', 'phone', 'profession', 'address'];
    const completedFields = requiredFields.filter(field => user[field] && user[field].trim() !== '');
    const completionPercentage = (completedFields.length / requiredFields.length) * 100;
    
    if (completionPercentage === 100) return 15;
    if (completionPercentage >= 80) return 12;
    if (completionPercentage >= 60) return 8;
    if (completionPercentage >= 40) return 4;
    return 2;
};

/**
 * Calculate property exploration score
 */
const calculateExplorationScore = (tracking) => {
    let score = 0;
    
    // Property details (max 12 points)
    if (tracking.viewCount > 0) score += 3;
    if (tracking.scrollDepth >= 80) score += 3;
    if (tracking.pageViewTime >= 120) score += 3; // 2 minutes
    if (tracking.imagesViewed) score += 3;
    
    // Q&A section (max 13 points)
    if (tracking.qaOpened) score += 3;
    
    const qaReadPercentage = tracking.qaTotalAnswers > 0 
        ? (tracking.qaAnswersRead / tracking.qaTotalAnswers) * 100 
        : 0;
    
    if (qaReadPercentage >= 100) {
        score += 5; // Read all
    } else if (qaReadPercentage >= 50) {
        score += 5; // Read >50%
    }
    
    if (tracking.qaViewTime >= 60) score += 3; // 1 minute
    
    return Math.min(score, 25); // Cap at 25
};

/**
 * Calculate engagement score
 */
const calculateEngagementScore = (tracking) => {
    let score = 0;
    
    if (tracking.liked) score += 7;
    if (tracking.saved) score += 10;
    
    if (tracking.viewCount === 2) score += 3;
    if (tracking.viewCount >= 3) score += 5;
    
    return Math.min(score, 20); // Cap at 20
};

/**
 * Calculate AI interaction score
 */
const calculateAIInteractionScore = (tracking) => {
    let score = 0;
    const questionsAsked = tracking.aiQuestionsAsked;
    
    if (questionsAsked >= 6) {
        score = 15;
    } else if (questionsAsked >= 3) {
        score = 10;
    } else if (questionsAsked >= 1) {
        score = 5;
    }
    
    // Bonus for quality questions (capped at 15 total)
    if (tracking.aiQuestionsAboutViewing && score < 15) {
        score = Math.min(score + 5, 15);
    }
    
    return score;
};

/**
 * Calculate owner contact score
 */
const calculateOwnerContactScore = (tracking) => {
    let score = 0;
    
    if (tracking.messageSent) {
        score = 25;
        
        // Bonuses (but cap at 25 total)
        // Already at max, so no additional points
    }
    
    return score;
};

/**
 * Calculate bonus points
 */
const calculateBonusScore = (tracking, user) => {
    let bonus = 0;
    
    // Urgency bonus
    if (tracking.messageDelay <= 1) { // Within 1 hour
        bonus += 5;
    } else if (tracking.messageDelay <= 24) { // Within 24 hours
        bonus += 3;
    }
    
    // Verification bonus
    if (user.emailVerified) bonus += 2;
    if (user.phoneVerified) bonus += 3;
    
    // First inquiry bonus (check if this is their first lead)
    // This will be calculated in the controller
    
    return Math.min(bonus, 10); // Cap at 10
};

/**
 * Determine lead tier based on total score
 */
const determineTier = (totalScore) => {
    if (totalScore >= 80) return 'HOT';
    if (totalScore >= 60) return 'WARM';
    if (totalScore >= 40) return 'COLD';
    return 'LOW';
};

/**
 * Determine SLA response time based on tier, queue size, and active leads
 * Dynamic SLA considers seller's workload for fair expectations
 */
const determineSLA = async (tier, sellerId) => {
    // Base SLA from tier
    const baseSLA = {
        'HOT': 15,      // 15 minutes
        'WARM': 60,     // 1 hour
        'COLD': 240,    // 4 hours
        'LOW': 1440     // 24 hours
    };
    
    const baseSLAMinutes = baseSLA[tier] || 1440;
    
    // Get seller's current workload
    const totalLeads = await Lead.countDocuments({ seller: sellerId });
    const activeLeads = await Lead.countDocuments({ 
        seller: sellerId, 
        'sla.responded': false 
    });
    
    // Calculate multipliers
    // Queue multiplier: For every 5 leads, add 20% (max 2x)
    const queueMultiplier = Math.min(1 + (totalLeads / 5) * 0.2, 2.0);
    
    // Active multiplier: For every 3 unresponded leads, add 15%
    const activeMultiplier = 1 + (activeLeads / 3) * 0.15;
    
    // Calculate adjusted SLA
    const adjustedSLA = Math.round(baseSLAMinutes * queueMultiplier * activeMultiplier);
    
    // Maximum SLA caps per tier (prevent unreasonable delays)
    const maxSLA = {
        'HOT': 60,      // Max 1 hour for HOT
        'WARM': 180,    // Max 3 hours for WARM
        'COLD': 480,    // Max 8 hours for COLD
        'LOW': 2880     // Max 48 hours for LOW
    };
    
    const finalSLA = Math.min(adjustedSLA, maxSLA[tier]);
    
    return {
        baseSLA: baseSLAMinutes,
        adjustedSLA: finalSLA,
        queueSize: totalLeads,
        activeLeads: activeLeads,
        queueMultiplier: queueMultiplier.toFixed(2),
        activeMultiplier: activeMultiplier.toFixed(2)
    };
};

/**
 * Calculate complete lead score
 */
exports.calculateLeadScore = async (leadId) => {
    try {
        const lead = await Lead.findById(leadId).populate('buyer');
        if (!lead) throw new Error('Lead not found');
        
        const user = lead.buyer;
        const tracking = lead.tracking;
        
        // Calculate individual scores
        const profileScore = calculateProfileScore(user);
        const explorationScore = calculateExplorationScore(tracking);
        const engagementScore = calculateEngagementScore(tracking);
        const aiInteractionScore = calculateAIInteractionScore(tracking);
        const ownerContactScore = calculateOwnerContactScore(tracking);
        const bonusScore = calculateBonusScore(tracking, user);
        
        // Calculate total
        const totalScore = Math.min(
            profileScore + explorationScore + engagementScore + 
            aiInteractionScore + ownerContactScore + bonusScore,
            100
        );
        
        // Update lead
        lead.scores = {
            profile: profileScore,
            exploration: explorationScore,
            engagement: engagementScore,
            aiInteraction: aiInteractionScore,
            ownerContact: ownerContactScore,
            bonus: bonusScore,
            total: totalScore
        };
        
        lead.tier = determineTier(totalScore);
        
        // Set SLA if message was sent and not yet set
        if (tracking.messageSent && !lead.sla.expectedResponseTime) {
            const slaData = await determineSLA(lead.tier, lead.seller);
            lead.sla.expectedResponseTime = slaData.adjustedSLA;
            lead.sla.responseDeadline = new Date(Date.now() + slaData.adjustedSLA * 60 * 1000);
            
            // Store SLA calculation details for transparency
            lead.sla.calculationDetails = {
                baseSLA: slaData.baseSLA,
                queueSize: slaData.queueSize,
                activeLeads: slaData.activeLeads,
                queueMultiplier: slaData.queueMultiplier,
                activeMultiplier: slaData.activeMultiplier
            };
        }
        
        await lead.save();
        
        return {
            success: true,
            lead,
            scores: lead.scores,
            tier: lead.tier,
            sla: lead.sla
        };
    } catch (error) {
        console.error('[LEAD_SCORING] Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get or create lead (with proper race condition handling)
 */
exports.getOrCreateLead = async (buyerId, propertyId, sellerId) => {
    try {
        console.log('[GET_OR_CREATE_LEAD] Creating lead - Buyer:', buyerId, 'Property:', propertyId, 'Seller:', sellerId);
        
        // Use findOneAndUpdate with upsert to handle race conditions atomically
        const lead = await Lead.findOneAndUpdate(
            { buyer: buyerId, property: propertyId },
            {
                $setOnInsert: {
                    buyer: buyerId,
                    property: propertyId,
                    seller: sellerId,
                    tracking: {
                        firstViewedAt: new Date(),
                        lastActiveAt: new Date(),
                        viewCount: 0,
                        pageViewTime: 0,
                        scrollDepth: 0
                    },
                    scores: {
                        profile: 0,
                        exploration: 0,
                        engagement: 0,
                        aiInteraction: 0,
                        ownerContact: 0,
                        bonus: 0,
                        total: 0
                    },
                    tier: 'LOW',
                    status: 'NEW',
                    createdAt: new Date()
                },
                $set: {
                    updatedAt: new Date()
                }
            },
            {
                upsert: true,
                returnDocument: 'after',  // Use returnDocument instead of new
                setDefaultsOnInsert: true
            }
        );
        
        console.log('[GET_OR_CREATE_LEAD] Lead created/found:', lead._id, 'with seller:', lead.seller);
        return lead;
    } catch (error) {
        console.error('[GET_OR_CREATE_LEAD] Error:', error);
        throw error;
    }
};

/**
 * Update lead tracking data
 */
exports.updateLeadTracking = async (leadId, trackingData) => {
    try {
        const lead = await Lead.findById(leadId);
        if (!lead) throw new Error('Lead not found');
        
        // Update tracking data
        Object.keys(trackingData).forEach(key => {
            if (key === 'pageViewTime' || key === 'qaViewTime') {
                // Accumulate time
                lead.tracking[key] = (lead.tracking[key] || 0) + trackingData[key];
            } else {
                lead.tracking[key] = trackingData[key];
            }
        });
        
        lead.tracking.lastActiveAt = new Date();
        
        await lead.save();
        
        return {
            success: true,
            lead
        };
    } catch (error) {
        console.error('[UPDATE_LEAD_TRACKING] Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = exports;
