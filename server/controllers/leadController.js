const Lead = require('../models/Lead');
const Property = require('../models/Property');
const User = require('../models/User');
const { getOrCreateLead, updateLeadTracking, calculateLeadScore } = require('../services/leadScoringService');

/**
 * Track property view
 */
exports.trackPropertyView = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const buyerId = req.user.id;
        
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ status: 'fail', message: 'Property not found' });
        }
        
        const lead = await getOrCreateLead(buyerId, propertyId, property.seller);
        
        // Update view count
        lead.tracking.viewCount += 1;
        lead.tracking.lastActiveAt = new Date();
        await lead.save();
        
        // Recalculate score
        await calculateLeadScore(lead._id);
        
        res.status(200).json({
            status: 'success',
            data: { leadId: lead._id }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

/**
 * Track time spent on property page
 */
exports.trackTimeSpent = async (req, res) => {
    try {
        const { propertyId, timeSpent, scrollDepth, imagesViewed, locationViewed } = req.body;
        const buyerId = req.user.id;
        
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ status: 'fail', message: 'Property not found' });
        }
        
        const lead = await getOrCreateLead(buyerId, propertyId, property.seller);
        
        // Cap time at 10 minutes (600 seconds) to prevent tab-left-open issues
        const cappedTime = Math.min(timeSpent || 0, 600);
        
        await updateLeadTracking(lead._id, {
            pageViewTime: cappedTime,
            scrollDepth: scrollDepth || lead.tracking.scrollDepth,
            imagesViewed: imagesViewed || lead.tracking.imagesViewed,
            locationViewed: locationViewed || lead.tracking.locationViewed
        });
        
        res.status(200).json({ status: 'success' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

/**
 * Track Q&A interaction
 */
exports.trackQAInteraction = async (req, res) => {
    try {
        const { propertyId, qaOpened, qaViewTime, qaAnswersRead, qaTotalAnswers } = req.body;
        const buyerId = req.user.id;
        
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ status: 'fail', message: 'Property not found' });
        }
        
        const lead = await getOrCreateLead(buyerId, propertyId, property.seller);
        
        // Cap Q&A time at 5 minutes (300 seconds)
        const cappedTime = Math.min(qaViewTime || 0, 300);
        
        await updateLeadTracking(lead._id, {
            qaOpened: qaOpened || lead.tracking.qaOpened,
            qaViewTime: cappedTime,
            qaAnswersRead: qaAnswersRead || lead.tracking.qaAnswersRead,
            qaTotalAnswers: qaTotalAnswers || lead.tracking.qaTotalAnswers
        });
        
        res.status(200).json({ status: 'success' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

/**
 * Track engagement (like, save, share)
 */
exports.trackEngagement = async (req, res) => {
    try {
        const { propertyId, action } = req.body; // action: 'like', 'save', 'share'
        const buyerId = req.user.id;
        
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ status: 'fail', message: 'Property not found' });
        }
        
        const lead = await getOrCreateLead(buyerId, propertyId, property.seller);
        
        const trackingUpdate = {};
        if (action === 'like') trackingUpdate.liked = true;
        if (action === 'save') trackingUpdate.saved = true;
        if (action === 'share') trackingUpdate.shared = true;
        
        await updateLeadTracking(lead._id, trackingUpdate);
        
        res.status(200).json({ status: 'success' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

/**
 * Track AI interaction
 */
exports.trackAIInteraction = async (req, res) => {
    try {
        const { propertyId, questionType } = req.body; // questionType: 'viewing', 'price', 'docs', 'general'
        const buyerId = req.user.id;
        
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ status: 'fail', message: 'Property not found' });
        }
        
        const lead = await getOrCreateLead(buyerId, propertyId, property.seller);
        
        const trackingUpdate = {
            aiQuestionsAsked: lead.tracking.aiQuestionsAsked + 1
        };
        
        if (questionType === 'viewing') trackingUpdate.aiQuestionsAboutViewing = true;
        if (questionType === 'price') trackingUpdate.aiQuestionsAboutPrice = true;
        if (questionType === 'docs') trackingUpdate.aiQuestionsAboutDocs = true;
        
        await updateLeadTracking(lead._id, trackingUpdate);
        
        res.status(200).json({ status: 'success' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

/**
 * Track owner contact (message sent)
 */
exports.trackOwnerContact = async (req, res) => {
    try {
        const { propertyId, messageLength, mentionsViewing } = req.body;
        const buyerId = req.user.id;
        
        const property = await Property.findById(propertyId).populate('seller', 'name email');
        if (!property) {
            return res.status(404).json({ status: 'fail', message: 'Property not found' });
        }
        
        const lead = await getOrCreateLead(buyerId, propertyId, property.seller._id);
        
        // Calculate message delay in hours
        const firstViewedAt = lead.tracking.firstViewedAt || new Date();
        const messageDelay = (Date.now() - firstViewedAt.getTime()) / (1000 * 60 * 60);
        
        await updateLeadTracking(lead._id, {
            messageSent: true,
            messageLength: messageLength || 0,
            messageMentionsViewing: mentionsViewing || false,
            messageTimestamp: new Date(),
            messageDelay: messageDelay
        });
        
        // Update lead status and calculate SLA
        lead.status = 'CONTACTED';
        await lead.save();
        
        // Recalculate score (this will set SLA with dynamic algorithm)
        const scoreResult = await calculateLeadScore(lead._id);
        
        // Send buyer acknowledgement email
        if (scoreResult.success && scoreResult.sla) {
            const emailService = require('./emailService');
            const User = require('../models/User');
            const buyer = await User.findById(buyerId);
            
            const slaMinutes = scoreResult.sla.expectedResponseTime;
            const slaHours = Math.floor(slaMinutes / 60);
            const slaRemainingMinutes = slaMinutes % 60;
            
            let slaText = '';
            if (slaHours > 0) {
                slaText = slaRemainingMinutes > 0 
                    ? `${slaHours} hour${slaHours > 1 ? 's' : ''} ${slaRemainingMinutes} minutes`
                    : `${slaHours} hour${slaHours > 1 ? 's' : ''}`;
            } else {
                slaText = `${slaMinutes} minutes`;
            }
            
            const tierEmoji = {
                'HOT': '🔥',
                'WARM': '⚡',
                'COLD': '💙',
                'LOW': '🌫️'
            };
            
            const acknowledgementHtml = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; background: #f8fafc;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">✅ Interest Registered!</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">We've notified the seller about your interest</p>
                    </div>
                    
                    <div style="background: white; padding: 32px 24px;">
                        <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                            Hi <strong>${buyer.name}</strong>,
                        </p>
                        
                        <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                            Thank you for expressing interest in <strong style="color: #10b981;">${property.title}</strong>! Your inquiry has been successfully registered and the seller has been notified.
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 2px solid #10b981;">
                            <h3 style="color: #065f46; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">📊 Your Priority Status</h3>
                            <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: #047857; font-size: 14px; font-weight: 600;">Priority Level:</span>
                                    <span style="font-size: 24px;">${tierEmoji[scoreResult.tier]} ${scoreResult.tier}</span>
                                </div>
                            </div>
                            <div style="background: white; padding: 16px; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: #047857; font-size: 14px; font-weight: 600;">Your Score:</span>
                                    <span style="color: #10b981; font-size: 24px; font-weight: 800;">${scoreResult.scores.total}/100</span>
                                </div>
                            </div>
                        </div>
                        
                        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
                            <p style="color: #1e40af; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                                ⏰ Expected Response Time
                            </p>
                            <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
                                Based on your engagement level and the seller's current workload (<strong>${scoreResult.sla.calculationDetails?.queueSize || 0} leads in queue</strong>, <strong>${scoreResult.sla.calculationDetails?.activeLeads || 0} pending responses</strong>), you can expect a response within <strong>${slaText}</strong>.
                            </p>
                        </div>
                        
                        <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 12px; margin: 24px 0;">
                            <p style="color: #92400e; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                                💡 What Happens Next?
                            </p>
                            <ul style="color: #78350f; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                                <li>The seller will review your inquiry</li>
                                <li>You'll receive a notification when they respond</li>
                                <li>Check your messages on EstatePulse platform</li>
                                <li>We'll keep you updated via email</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 32px 0 24px 0;">
                            <a href="http://localhost:5173/messages" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
                                💬 View Messages
                            </a>
                        </div>
                        
                        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                            We'll notify you immediately when the seller responds!<br>
                            <strong style="color: #10b981;">Team EstatePulse</strong>
                        </p>
                    </div>
                    
                    <div style="background: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
                            EstatePulse AI — Smart Property Matching<br>
                            Connecting you with the right properties
                        </p>
                    </div>
                </div>
            `;
            
            await emailService.sendEmail({
                to: buyer.email,
                subject: `✅ Your Interest in ${property.title} Has Been Registered`,
                html: acknowledgementHtml
            });
        }
        
        res.status(200).json({ 
            status: 'success',
            data: { 
                leadId: lead._id,
                tier: scoreResult.tier,
                score: scoreResult.scores.total,
                sla: scoreResult.sla
            }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

/**
 * Get seller's leads dashboard
 */
exports.getSellerLeads = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const { tier, status, excludeTransferred } = req.query;
        
        const query = { seller: sellerId };
        
        if (excludeTransferred === 'true') {
            // Match leads where assignedTo is null or doesn't exist
            query.$or = [
                { assignedTo: null },
                { assignedTo: { $exists: false } }
            ];
        }
        
        if (tier) query.tier = tier;
        if (status) query.status = status;
        
        const leads = await Lead.find(query)
            .lean()
            .sort({ 'scores.total': -1, createdAt: -1 });
        
        console.log('[GET_SELLER_LEADS] Found leads:', leads.length);
        
        // Populate manually
        for (let lead of leads) {
            const buyer = await User.findById(lead.buyer).select('name email phone profession');
            const property = await Property.findById(lead.property).select('title price images');
            lead.buyer = buyer;
            lead.property = property;
        }
        
        // Group by tier
        const grouped = {
            HOT: leads.filter(l => l.tier === 'HOT'),
            WARM: leads.filter(l => l.tier === 'WARM'),
            COLD: leads.filter(l => l.tier === 'COLD'),
            LOW: leads.filter(l => l.tier === 'LOW')
        };
        
        res.status(200).json({
            status: 'success',
            data: { 
                leads,
                grouped,
                counts: {
                    total: leads.length,
                    hot: grouped.HOT.length,
                    warm: grouped.WARM.length,
                    cold: grouped.COLD.length,
                    low: grouped.LOW.length
                }
            }
        });
    } catch (err) {
        console.error('[GET_SELLER_LEADS] Error:', err);
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

/**
 * Get single lead details
 */
exports.getLeadDetails = async (req, res) => {
    try {
        const { leadId } = req.params;
        
        const lead = await Lead.findById(leadId)
            .populate('buyer', 'name email phone profession address')
            .populate('property', 'title price images bedrooms area location city')
            .populate('seller', 'name email');
        
        if (!lead) {
            return res.status(404).json({ status: 'fail', message: 'Lead not found' });
        }
        
        res.status(200).json({
            status: 'success',
            data: { lead }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

/**
 * Mark lead as responded
 */
exports.markLeadResponded = async (req, res) => {
    try {
        const { leadId } = req.params;
        
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({ status: 'fail', message: 'Lead not found' });
        }
        
        lead.sla.responded = true;
        lead.sla.respondedAt = new Date();
        
        // Check if SLA was breached
        if (lead.sla.responseDeadline && new Date() > lead.sla.responseDeadline) {
            lead.sla.slaBreached = true;
        }
        
        lead.status = 'RESPONDED';
        await lead.save();
        
        res.status(200).json({
            status: 'success',
            data: { lead }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

module.exports = exports;
