const User = require('../models/User');
const Lead = require('../models/Lead');
const emailService = require('./emailService');
const Notification = require('../models/Notification');

/**
 * Add team member to seller account
 */
exports.addTeamMember = async (sellerId, email, name, role = 'sales') => {
    try {
        console.log(`[TEAM_MEMBER] Adding team member ${email} to seller ${sellerId}`);

        const seller = await User.findById(sellerId);
        if (!seller || seller.role !== 'seller') {
            throw new Error('Seller not found');
        }

        // Check if email already exists in team
        const emailExists = seller.teamMembers.some(tm => tm.email === email);
        if (emailExists) {
            throw new Error('Team member with this email already exists');
        }

        // Check if user with this email exists
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            throw new Error('User with this email does not exist');
        }

        // Add team member
        seller.teamMembers.push({
            userId: existingUser._id,
            email,
            name,
            role,
            addedAt: new Date(),
            status: 'active'
        });

        await seller.save();

        // Update the team member user to mark them as team member
        existingUser.isTeamMember = true;
        existingUser.teamLeaderId = sellerId;
        existingUser.teamRole = role;
        await existingUser.save();

        console.log(`[TEAM_MEMBER] Team member added successfully`);

        return {
            success: true,
            message: 'Team member added successfully',
            teamMember: {
                userId: existingUser._id,
                email,
                name,
                role
            }
        };
    } catch (error) {
        console.error('[TEAM_MEMBER] Error adding team member:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Remove team member from seller account
 */
exports.removeTeamMember = async (sellerId, teamMemberId) => {
    try {
        console.log(`[TEAM_MEMBER] Removing team member ${teamMemberId} from seller ${sellerId}`);

        const seller = await User.findById(sellerId);
        if (!seller) {
            throw new Error('Seller not found');
        }

        // Remove from team members array
        seller.teamMembers = seller.teamMembers.filter(tm => tm.userId.toString() !== teamMemberId);
        await seller.save();

        // Update team member user
        const teamMember = await User.findById(teamMemberId);
        if (teamMember) {
            teamMember.isTeamMember = false;
            teamMember.teamLeaderId = null;
            teamMember.teamRole = '';
            await teamMember.save();
        }

        console.log(`[TEAM_MEMBER] Team member removed successfully`);

        return { success: true, message: 'Team member removed successfully' };
    } catch (error) {
        console.error('[TEAM_MEMBER] Error removing team member:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Transfer lead to team member
 */
exports.transferLead = async (leadId, fromUserId, toTeamMemberId) => {
    try {
        console.log(`[TRANSFER] Transferring lead ${leadId} from ${fromUserId} to ${toTeamMemberId}`);

        const lead = await Lead.findById(leadId)
            .populate('buyer')
            .populate('property')
            .populate('seller');

        if (!lead) {
            throw new Error('Lead not found');
        }

        // Verify team member exists and belongs to seller
        const seller = await User.findById(fromUserId);
        if (!seller) {
            throw new Error('Seller not found');
        }

        const teamMemberExists = seller.teamMembers.some(tm => tm.userId.toString() === toTeamMemberId);
        if (!teamMemberExists) {
            throw new Error('Team member not found in seller team');
        }

        const teamMember = await User.findById(toTeamMemberId);
        if (!teamMember) {
            throw new Error('Team member user not found');
        }

        // Update lead
        lead.assignedTo = toTeamMemberId;
        lead.transferredFrom = fromUserId;
        lead.transferredAt = new Date();
        lead.transferHistory.push({
            from: fromUserId,
            to: toTeamMemberId,
            transferredAt: new Date(),
            reason: 'Seller transferred to team member'
        });

        await lead.save();
        console.log(`[TRANSFER] Lead transferred successfully`);
        console.log(`[TRANSFER] Lead ${lead._id} assignedTo:`, lead.assignedTo);
        
        // Verify the save worked
        const verifyLead = await Lead.findById(leadId).select('assignedTo transferredFrom transferredAt');
        console.log(`[TRANSFER] Verification - Lead ${leadId} assignedTo:`, verifyLead.assignedTo);
        console.log(`[TRANSFER] Verification - transferredFrom:`, verifyLead.transferredFrom);
        console.log(`[TRANSFER] Verification - transferredAt:`, verifyLead.transferredAt);

        // Send notification to team member
        await Notification.create({
            recipient: toTeamMemberId,
            title: '📋 New Lead Assigned',
            message: `You have been assigned a new lead from ${lead.buyer.name} for ${lead.property.title}`,
            type: 'info',
            data: {
                leadId: lead._id,
                buyerId: lead.buyer._id,
                propertyId: lead.property._id
            }
        });

        // Send email to team member
        const teamMemberEmailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; background: #f8fafc;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">📋 New Lead Assigned</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">You have a new lead to handle</p>
                </div>
                
                <div style="background: white; padding: 32px 24px;">
                    <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi <strong>${teamMember.name}</strong>,
                    </p>
                    
                    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                        A new lead has been assigned to you by <strong>${seller.name}</strong>.
                    </p>
                    
                    <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 12px; margin: 24px 0;">
                        <p style="color: #1e40af; font-size: 15px; margin: 0 0 12px 0; font-weight: 700;">📊 Lead Details:</p>
                        <div style="color: #1e40af; font-size: 14px; line-height: 1.8;">
                            <p><strong>Buyer:</strong> ${lead.buyer.name}</p>
                            <p><strong>Property:</strong> ${lead.property.title}</p>
                            <p><strong>Location:</strong> ${lead.property.location}</p>
                            <p><strong>Price:</strong> ₹${lead.property.price.toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
                        <p style="color: #1e40af; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                            ✓ Your Responsibility:
                        </p>
                        <ul style="color: #1e40af; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>Respond to buyer inquiries promptly</li>
                            <li>Maintain SLA compliance</li>
                            <li>Coordinate with ${seller.name} if needed</li>
                            <li>Close the deal or mark complete</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 32px 0 24px 0;">
                        <a href="http://localhost:5173/messages" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
                            💬 View Lead
                        </a>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                        Good luck with this lead!<br>
                        <strong style="color: #3b82f6;">Team EstatePulse</strong>
                    </p>
                </div>
            </div>
        `;

        await emailService.sendEmail({
            to: teamMember.email,
            subject: `📋 New Lead Assigned - ${lead.buyer.name} for ${lead.property.title}`,
            html: teamMemberEmailHtml
        });

        // Send notification to buyer
        await Notification.create({
            recipient: lead.buyer._id,
            title: '👤 Your Lead Has Been Transferred',
            message: `Your inquiry for ${lead.property.title} has been transferred to ${teamMember.name} from ${seller.name}'s team. You will now coordinate with ${teamMember.name}.`,
            type: 'info',
            data: {
                leadId: lead._id,
                propertyId: lead.property._id,
                newContactId: toTeamMemberId
            }
        });

        // Send email to buyer
        const buyerEmailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; background: #f8fafc;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">👤 Lead Transferred</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">You have a new contact person</p>
                </div>
                
                <div style="background: white; padding: 32px 24px;">
                    <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi <strong>${lead.buyer.name}</strong>,
                    </p>
                    
                    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                        Your inquiry for <strong>${lead.property.title}</strong> has been transferred to <strong>${teamMember.name}</strong> from <strong>${seller.name}</strong>'s team. You will now coordinate with ${teamMember.name} for all further discussions.
                    </p>
                    
                    <div style="background: #dcfce7; border: 2px solid #10b981; padding: 20px; border-radius: 12px; margin: 24px 0;">
                        <p style="color: #065f46; font-size: 15px; margin: 0 0 12px 0; font-weight: 700;">👤 Your New Contact:</p>
                        <div style="color: #047857; font-size: 14px; line-height: 1.8;">
                            <p><strong>Name:</strong> ${teamMember.name}</p>
                            <p><strong>Email:</strong> ${teamMember.email}</p>
                            <p><strong>Role:</strong> ${teamMember.teamRole || 'Sales Representative'}</p>
                        </div>
                    </div>
                    
                    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
                        <p style="color: #1e40af; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                            ✓ What This Means:
                        </p>
                        <ul style="color: #1e40af; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>Same level of service and support</li>
                            <li>Faster response times</li>
                            <li>Dedicated attention to your inquiry</li>
                            <li>Seamless conversation continuation</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 32px 0 24px 0;">
                        <a href="http://localhost:5173/messages" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
                            💬 Continue Conversation
                        </a>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                        We're here to help you find the perfect property!<br>
                        <strong style="color: #10b981;">Team EstatePulse</strong>
                    </p>
                </div>
            </div>
        `;

        await emailService.sendEmail({
            to: lead.buyer.email,
            subject: `👤 Your Lead Has Been Transferred - New Contact: ${teamMember.name}`,
            html: buyerEmailHtml
        });

        console.log(`[TRANSFER] Notifications and emails sent`);

        return {
            success: true,
            message: 'Lead transferred successfully',
            lead: {
                id: lead._id,
                assignedTo: toTeamMemberId,
                transferredFrom: fromUserId,
                transferredAt: lead.transferredAt
            }
        };
    } catch (error) {
        console.error('[TRANSFER] Error transferring lead:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get leads assigned to team member
 */
exports.getTeamMemberLeads = async (teamMemberId) => {
    try {
        console.log(`[GET_TEAM_MEMBER_LEADS_SERVICE] Fetching leads for team member ${teamMemberId}`);

        // First, let's check if there are ANY leads with assignedTo field
        const allLeadsWithAssignedTo = await Lead.find({ assignedTo: { $ne: null } }).select('_id assignedTo buyer property');
        console.log(`[GET_TEAM_MEMBER_LEADS_SERVICE] Total leads with assignedTo:`, allLeadsWithAssignedTo.length);
        console.log(`[GET_TEAM_MEMBER_LEADS_SERVICE] Assigned lead IDs:`, allLeadsWithAssignedTo.map(l => `${l._id} -> ${l.assignedTo}`));

        const leads = await Lead.find({
            assignedTo: teamMemberId
        })
            .populate('buyer', 'name email phone')
            .populate('property', 'title price location images')
            .populate('seller', 'name email')
            .sort({ createdAt: -1 });

        console.log(`[GET_TEAM_MEMBER_LEADS_SERVICE] Found ${leads.length} leads for team member ${teamMemberId}`);

        return {
            success: true,
            leads,
            count: leads.length
        };
    } catch (error) {
        console.error('[GET_TEAM_MEMBER_LEADS_SERVICE] Error fetching leads:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get seller's team members
 */
exports.getTeamMembers = async (sellerId) => {
    try {
        const seller = await User.findById(sellerId).select('teamMembers');
        if (!seller) {
            throw new Error('Seller not found');
        }

        return {
            success: true,
            teamMembers: seller.teamMembers
        };
    } catch (error) {
        console.error('[TEAM_MEMBER] Error fetching team members:', error);
        return { success: false, error: error.message };
    }
};

module.exports = exports;
