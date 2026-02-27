const Lead = require('../models/Lead');
const User = require('../models/User');
const Property = require('../models/Property');
const emailService = require('./emailService');

/**
 * Reactivate seller account and unhide all properties
 * Called when admin changes account status from suspended to active
 */
exports.reactivateSellerAccount = async (sellerId) => {
    try {
        console.log(`[REACTIVATE] Processing seller ${sellerId}...`);

        const seller = await User.findById(sellerId);
        if (!seller || seller.role !== 'seller') {
            throw new Error('Seller not found');
        }

        // 1. Clear suspension status
        seller.suspension.isSuspended = false;
        seller.suspension.suspensionReason = '';
        seller.suspension.suspendedAt = null;
        seller.suspension.suspendedUntil = null;
        seller.suspension.requiresAdminApproval = false;
        seller.accountStatus = 'active';
        await seller.save();
        console.log(`[REACTIVATE] Seller ${seller._id} account status set to active`);

        // 2. Unhide all seller's properties
        const result = await Property.updateMany(
            { seller: sellerId },
            {
                $set: {
                    'visibility.isVisible': true,
                    'visibility.hiddenReason': '',
                    'visibility.hiddenAt': null,
                    'visibility.hiddenUntil': null,
                    'visibility.hiddenBy': null
                }
            }
        );
        console.log(`[REACTIVATE] Unhidden ${result.modifiedCount} properties for seller ${seller._id}`);

        // 3. Send welcome back email to seller
        const welcomeBackHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; background: #f8fafc;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">✅ Welcome Back!</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Your account has been reactivated</p>
                </div>
                
                <div style="background: white; padding: 32px 24px;">
                    <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi <strong>${seller.name}</strong>,
                    </p>
                    
                    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                        Your account suspension has been lifted and your account is now <strong style="color: #10b981;">ACTIVE</strong>. All your properties have been automatically restored and are now visible to buyers.
                    </p>
                    
                    <div style="background: #dcfce7; border: 2px solid #10b981; padding: 20px; border-radius: 12px; margin: 24px 0;">
                        <p style="color: #065f46; font-size: 15px; margin: 0 0 12px 0; font-weight: 700;">
                            ✓ What's Been Restored:
                        </p>
                        <ul style="color: #047857; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>Your account is now active</li>
                            <li>All your properties are visible to buyers</li>
                            <li>You can receive new leads</li>
                            <li>You can login and manage your listings</li>
                        </ul>
                    </div>
                    
                    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
                        <p style="color: #1e40af; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                            💡 Important Reminder:
                        </p>
                        <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
                            Please maintain good response times and SLA compliance to avoid future suspensions. Respond to buyer inquiries promptly and professionally.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 32px 0 24px 0;">
                        <a href="http://localhost:5173/seller-dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
                            📊 Go to Dashboard
                        </a>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                        Thank you for your commitment to providing excellent service.<br>
                        <strong style="color: #10b981;">Team EstatePulse</strong>
                    </p>
                </div>
                
                <div style="background: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
                        EstatePulse AI — Smart Property Matching<br>
                        Your account has been successfully reactivated
                    </p>
                </div>
            </div>
        `;

        await emailService.sendEmail({
            to: seller.email,
            subject: `✅ Welcome Back! Your Account Has Been Reactivated`,
            html: welcomeBackHtml
        });
        console.log(`[REACTIVATE] Welcome back email sent to ${seller.email}`);

        return {
            success: true,
            message: 'Seller account reactivated and all properties unhidden',
            seller: {
                id: seller._id,
                name: seller.name,
                email: seller.email,
                accountStatus: seller.accountStatus,
                propertiesUnhidden: result.modifiedCount
            }
        };
    } catch (error) {
        console.error('[REACTIVATE] Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Calculate seller rating based on performance metrics
 */
exports.calculateSellerRating = async (sellerId) => {
    try {
        const seller = await User.findById(sellerId);
        if (!seller || seller.role !== 'seller') {
            throw new Error('Seller not found');
        }

        // Get all leads for this seller
        const allLeads = await Lead.find({ seller: sellerId });
        const totalLeads = allLeads.length;

        if (totalLeads === 0) {
            // New seller - start with excellent rating
            seller.sellerRating.score = 100;
            seller.sellerRating.tier = 'excellent';
            await seller.save();
            return { success: true, rating: seller.sellerRating };
        }

        // Calculate response rate (% of leads responded to)
        const respondedLeads = allLeads.filter(l => l.sla.responded).length;
        const responseRate = Math.round((respondedLeads / totalLeads) * 100);

        // Calculate SLA compliance (% of leads with no breach)
        const noBreachLeads = allLeads.filter(l => !l.sla.slaBreached).length;
        const slaCompliance = Math.round((noBreachLeads / totalLeads) * 100);

        // Calculate response time score (based on average response time vs SLA)
        const respondedWithTime = allLeads.filter(l => l.sla.responded && l.sla.respondedAt);
        let responseTimeScore = 100;
        
        if (respondedWithTime.length > 0) {
            const avgResponseTime = respondedWithTime.reduce((sum, l) => {
                const delay = (l.sla.respondedAt - l.createdAt) / (1000 * 60); // minutes
                return sum + delay;
            }, 0) / respondedWithTime.length;

            // Score based on how close to SLA they respond
            const avgSLA = respondedWithTime.reduce((sum, l) => sum + l.sla.expectedResponseTime, 0) / respondedWithTime.length;
            responseTimeScore = Math.max(0, 100 - ((avgResponseTime / avgSLA - 1) * 50));
        }

        // Update seller rating components
        seller.sellerRating.responseRate = responseRate;
        seller.sellerRating.slaCompliance = slaCompliance;
        seller.sellerRating.responseTime = Math.round(responseTimeScore);
        seller.sellerRating.totalLeads = totalLeads;
        seller.sellerRating.respondedLeads = respondedLeads;
        seller.sellerRating.slaBreaches = allLeads.filter(l => l.sla.slaBreached).length;

        // Calculate overall score (weighted average)
        const overallScore = Math.round(
            (responseRate * 0.30) +
            (slaCompliance * 0.25) +
            (responseTimeScore * 0.25) +
            (seller.sellerRating.buyerSatisfaction * 0.20)
        );

        seller.sellerRating.score = Math.max(0, Math.min(100, overallScore));

        // Determine tier
        if (seller.sellerRating.score >= 90) {
            seller.sellerRating.tier = 'elite';
        } else if (seller.sellerRating.score >= 75) {
            seller.sellerRating.tier = 'excellent';
        } else if (seller.sellerRating.score >= 60) {
            seller.sellerRating.tier = 'good';
        } else if (seller.sellerRating.score >= 40) {
            seller.sellerRating.tier = 'fair';
        } else {
            seller.sellerRating.tier = 'poor';
        }

        seller.sellerRating.lastUpdated = new Date();
        await seller.save();

        return {
            success: true,
            rating: seller.sellerRating
        };
    } catch (error) {
        console.error('[SELLER_RATING] Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check for SLA breaches and trigger escalation
 */
exports.checkSLABreaches = async () => {
    try {
        console.log('[SLA_CHECK] Starting SLA breach check...');
        
        // Find all leads with SLA deadline
        const leads = await Lead.find({
            'sla.responseDeadline': { $exists: true, $ne: null },
            'sla.responded': false,
            status: { $in: ['CONTACTED'] }
        }).populate('seller').populate('buyer').populate('property');

        let stage4Count = 0;
        let stage5Count = 0;

        for (const lead of leads) {
            const now = new Date();
            const deadline = new Date(lead.sla.responseDeadline);
            const slaElapsedPercent = ((now - lead.createdAt) / (deadline - lead.createdAt)) * 100;

            console.log(`[SLA_CHECK] Lead ${lead._id}: ${slaElapsedPercent.toFixed(0)}% of SLA elapsed`);

            // STAGE 4: 150% of SLA elapsed
            if (slaElapsedPercent >= 150 && slaElapsedPercent < 200 && !lead.sla.slaBreached) {
                console.log(`[SLA_CHECK] STAGE 4 triggered for lead ${lead._id}`);
                await triggerStage4(lead);
                stage4Count++;
            }

            // STAGE 5: 200% of SLA elapsed
            if (slaElapsedPercent >= 200 && !lead.sla.slaBreached) {
                console.log(`[SLA_CHECK] STAGE 5 triggered for lead ${lead._id}`);
                await triggerStage5(lead);
                stage5Count++;
            }
        }

        console.log(`[SLA_CHECK] Completed: ${stage4Count} Stage 4, ${stage5Count} Stage 5`);
        return { success: true, stage4Count, stage5Count };
    } catch (error) {
        console.error('[SLA_CHECK] Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * STAGE 4: Critical Delay (150% of SLA)
 */
async function triggerStage4(lead) {
    try {
        console.log(`[STAGE_4] Processing lead ${lead._id}`);

        // 1. Hide property for 24 hours
        const property = lead.property;
        property.visibility.isVisible = false;
        property.visibility.hiddenReason = 'Seller SLA breach - Stage 4 (Critical Delay)';
        property.visibility.hiddenAt = new Date();
        property.visibility.hiddenUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await property.save();
        console.log(`[STAGE_4] Property ${property._id} hidden for 24 hours`);

        // 2. Flag seller account
        const seller = lead.seller;
        seller.accountFlags.isFlagged = true;
        seller.accountFlags.flagReason = 'Critical SLA breach - Stage 4';
        seller.accountFlags.flaggedAt = new Date();
        seller.accountFlags.requiresAdminReview = true;
        await seller.save();
        console.log(`[STAGE_4] Seller ${seller._id} account flagged`);

        // 3. Drop seller rating by 10 points
        seller.sellerRating.score = Math.max(0, seller.sellerRating.score - 10);
        seller.sellerRating.consecutiveBreaches += 1;
        
        // Recalculate tier
        if (seller.sellerRating.score >= 90) {
            seller.sellerRating.tier = 'elite';
        } else if (seller.sellerRating.score >= 75) {
            seller.sellerRating.tier = 'excellent';
        } else if (seller.sellerRating.score >= 60) {
            seller.sellerRating.tier = 'good';
        } else if (seller.sellerRating.score >= 40) {
            seller.sellerRating.tier = 'fair';
        } else {
            seller.sellerRating.tier = 'poor';
        }
        
        await seller.save();
        console.log(`[STAGE_4] Seller rating dropped to ${seller.sellerRating.score}`);

        // 4. Send apology email to buyer
        const buyer = lead.buyer;
        const apologyHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; background: #f8fafc;">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">⚠️ We're Sorry!</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">The seller hasn't responded within our SLA</p>
                </div>
                
                <div style="background: white; padding: 32px 24px;">
                    <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi <strong>${buyer.name}</strong>,
                    </p>
                    
                    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                        We're sorry! <strong>${seller.name}</strong> hasn't responded to your inquiry for <strong>${property.title}</strong> within our expected timeframe.
                    </p>
                    
                    <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 12px; margin: 24px 0;">
                        <p style="color: #92400e; font-size: 15px; margin: 0 0 12px 0; font-weight: 700;">
                            ✓ Actions We've Taken:
                        </p>
                        <ul style="color: #78350f; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>Reduced seller's rating (now ${seller.sellerRating.tier})</li>
                            <li>Hidden their property from search</li>
                            <li>Flagged account for admin review</li>
                        </ul>
                    </div>
                    
                    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
                        <p style="color: #1e40af; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                            💡 Your Options:
                        </p>
                        <ul style="color: #1e40af; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>Wait for seller to respond (we'll keep trying)</li>
                            <li>Browse similar properties from responsive sellers</li>
                            <li>Contact our support team for assistance</li>
                        </ul>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                        We value your time and will ensure you get the best experience.<br>
                        <strong style="color: #f59e0b;">Team EstatePulse</strong>
                    </p>
                </div>
                
                <div style="background: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
                        EstatePulse AI — Smart Property Matching
                    </p>
                </div>
            </div>
        `;

        await emailService.sendEmail({
            to: buyer.email,
            subject: `⚠️ We're Sorry - Seller Not Responding to Your Inquiry`,
            html: apologyHtml
        });
        console.log(`[STAGE_4] Apology email sent to buyer ${buyer.email}`);

        // 5. Send warning email to seller
        const warningHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; background: #fff5f5;">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">⚠️ CRITICAL WARNING</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Your account has been flagged for poor response</p>
                </div>
                
                <div style="background: white; padding: 32px 24px;">
                    <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi <strong>${seller.name}</strong>,
                    </p>
                    
                    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                        Your account has been flagged for critical SLA breach. You did not respond to a buyer inquiry within our expected timeframe.
                    </p>
                    
                    <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 12px; margin: 24px 0;">
                        <p style="color: #92400e; font-size: 15px; margin: 0 0 12px 0; font-weight: 700;">
                            ⚠️ Consequences:
                        </p>
                        <ul style="color: #78350f; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>Your rating dropped by 10 points (now ${seller.sellerRating.score}/100)</li>
                            <li>Your property is hidden from search for 24 hours</li>
                            <li>Your account is flagged for admin review</li>
                        </ul>
                    </div>
                    
                    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
                        <p style="color: #1e40af; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                            💡 What You Should Do:
                        </p>
                        <ul style="color: #1e40af; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>Respond to pending buyer inquiries immediately</li>
                            <li>Improve your response time</li>
                            <li>Maintain professional communication</li>
                        </ul>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                        Further violations may result in account suspension.<br>
                        <strong style="color: #dc2626;">Team EstatePulse</strong>
                    </p>
                </div>
            </div>
        `;

        await emailService.sendEmail({
            to: seller.email,
            subject: `⚠️ CRITICAL WARNING: Your Account Has Been Flagged`,
            html: warningHtml
        });
        console.log(`[STAGE_4] Warning email sent to seller ${seller.email}`);

    } catch (error) {
        console.error('[STAGE_4] Error:', error);
    }
}

/**
 * STAGE 5: Severe Negligence (200% of SLA)
 */
async function triggerStage5(lead) {
    try {
        console.log(`[STAGE_5] Processing lead ${lead._id}`);

        const seller = lead.seller;
        const property = lead.property;
        const buyer = lead.buyer;

        // 1. Suspend seller account for 7 days
        seller.suspension.isSuspended = true;
        seller.suspension.suspensionReason = 'Severe SLA negligence - Stage 5';
        seller.suspension.suspendedAt = new Date();
        seller.suspension.suspendedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        seller.suspension.requiresAdminApproval = true;
        seller.accountStatus = 'suspended';
        await seller.save();
        console.log(`[STAGE_5] Seller ${seller._id} suspended for 7 days`);

        // 2. Hide all seller's properties
        await Property.updateMany(
            { seller: seller._id },
            {
                $set: {
                    'visibility.isVisible': false,
                    'visibility.hiddenReason': 'Seller account suspended - Stage 5',
                    'visibility.hiddenAt': new Date()
                }
            }
        );
        console.log(`[STAGE_5] All properties for seller ${seller._id} hidden`);

        // 3. Send suspension email to seller
        const suspensionHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; background: #fff5f5;">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🚫 ACCOUNT SUSPENDED</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Your account has been suspended for 7 days</p>
                </div>
                
                <div style="background: white; padding: 32px 24px;">
                    <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi <strong>${seller.name}</strong>,
                    </p>
                    
                    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                        Your account has been <strong style="color: #dc2626;">SUSPENDED for 7 days</strong> due to severe SLA negligence. You failed to respond to multiple buyer inquiries within our expected timeframe.
                    </p>
                    
                    <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 12px; margin: 24px 0;">
                        <p style="color: #92400e; font-size: 15px; margin: 0 0 12px 0; font-weight: 700;">
                            🚫 What This Means:
                        </p>
                        <ul style="color: #78350f; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>You cannot login to your account</li>
                            <li>All your properties are hidden from search</li>
                            <li>You cannot receive new leads</li>
                            <li>Suspension ends: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
                        </ul>
                    </div>
                    
                    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
                        <p style="color: #1e40af; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                            📋 Admin Review Required:
                        </p>
                        <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
                            Your account requires admin approval to reactivate. An admin will review your account and contact you.
                        </p>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                        This is a serious matter. Please improve your response time and communication.<br>
                        <strong style="color: #dc2626;">Team EstatePulse</strong>
                    </p>
                </div>
            </div>
        `;

        await emailService.sendEmail({
            to: seller.email,
            subject: `🚫 ACCOUNT SUSPENDED - 7 Days`,
            html: suspensionHtml
        });
        console.log(`[STAGE_5] Suspension email sent to seller ${seller.email}`);

        // 4. Send notification to buyer
        const buyerNotificationHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; background: #f8fafc;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">✅ We've Taken Action</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Seller account has been suspended</p>
                </div>
                
                <div style="background: white; padding: 32px 24px;">
                    <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi <strong>${buyer.name}</strong>,
                    </p>
                    
                    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                        Due to the seller's repeated failure to respond, we have <strong style="color: #10b981;">suspended their account for 7 days</strong>. We take buyer experience very seriously.
                    </p>
                    
                    <div style="background: #dcfce7; border: 2px solid #10b981; padding: 20px; border-radius: 12px; margin: 24px 0;">
                        <p style="color: #065f46; font-size: 15px; margin: 0 0 12px 0; font-weight: 700;">
                            ✓ Actions Taken:
                        </p>
                        <ul style="color: #047857; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>Seller account suspended for 7 days</li>
                            <li>All their properties hidden from search</li>
                            <li>Account flagged for admin review</li>
                        </ul>
                    </div>
                    
                    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
                        <p style="color: #1e40af; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                            💡 Next Steps:
                        </p>
                        <ul style="color: #1e40af; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>Browse similar properties from responsive sellers</li>
                            <li>Contact our support team for assistance</li>
                            <li>We'll help you find the perfect property</li>
                        </ul>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                        Your satisfaction is our priority.<br>
                        <strong style="color: #10b981;">Team EstatePulse</strong>
                    </p>
                </div>
            </div>
        `;

        await emailService.sendEmail({
            to: buyer.email,
            subject: `✅ We've Taken Action - Seller Account Suspended`,
            html: buyerNotificationHtml
        });
        console.log(`[STAGE_5] Notification email sent to buyer ${buyer.email}`);

    } catch (error) {
        console.error('[STAGE_5] Error:', error);
    }
}

module.exports = exports;
