const Message = require('../models/Message');
const User = require('../models/User');

exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, propertyId, text } = req.body;
        const senderId = req.user.id;

        const newMessage = await Message.create({
            sender: senderId,
            receiver: receiverId,
            propertyId,
            text,
            read: false
        });

        // Check if this is a buyer messaging a seller about a property
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);
        
        console.log('[SEND_MESSAGE] Sender role:', sender?.role, 'Receiver role:', receiver?.role, 'PropertyId:', propertyId);
        
        if (sender.role === 'buyer' && receiver.role === 'seller' && propertyId) {
            console.log('[BUYER_ACK] Starting acknowledgement process...');
            // Track owner contact and send buyer acknowledgement (async, don't block)
            (async () => {
                try {
                    const Property = require('../models/Property');
                    const property = await Property.findById(propertyId);
                    
                    if (!property) {
                        console.log('[BUYER_ACK] Property not found:', propertyId);
                        return;
                    }
                    
                    console.log('[BUYER_ACK] Property found:', property.title, 'Seller:', property.seller);
                    
                    const { getOrCreateLead, updateLeadTracking, calculateLeadScore } = require('../services/leadScoringService');
                    
                    // Get or create lead - use property.seller to ensure correct seller
                    const lead = await getOrCreateLead(senderId, propertyId, property.seller);
                    console.log('[BUYER_ACK] Lead obtained:', lead._id, 'Seller:', lead.seller);
                    
                    // Calculate message delay
                    const firstViewedAt = lead.tracking.firstViewedAt || new Date();
                    const messageDelay = (Date.now() - firstViewedAt.getTime()) / (1000 * 60 * 60);
                    
                    // Check if this is the first message
                    const isFirstMessage = !lead.tracking.messageSent;
                    console.log('[BUYER_ACK] Is first message:', isFirstMessage);
                    
                    // Update tracking
                    const trackingResult = await updateLeadTracking(lead._id, {
                        messageSent: true,
                        messageLength: text.length,
                        messageMentionsViewing: /view|visit|see|schedule|appointment|tour/i.test(text),
                        messageTimestamp: new Date(),
                        messageDelay: messageDelay
                    });
                    console.log('[BUYER_ACK] Tracking updated:', trackingResult.success);
                    
                    if (!trackingResult.success) {
                        console.error('[BUYER_ACK] Failed to update tracking:', trackingResult.error);
                        return;
                    }
                    
                    // Recalculate score (this will set SLA with dynamic algorithm)
                    const scoreResult = await calculateLeadScore(lead._id);
                    console.log('[BUYER_ACK] Score calculated:', scoreResult.scores?.total, 'Tier:', scoreResult.tier);
                    
                    if (!scoreResult.success) {
                        console.error('[BUYER_ACK] Failed to calculate score:', scoreResult.error);
                        return;
                    }
                    
                    // Send buyer acknowledgement email ONLY for first message
                    if (isFirstMessage && scoreResult.success && scoreResult.sla) {
                        console.log('[BUYER_ACK] Sending acknowledgement email...');
                        const emailService = require('../services/emailService');
                        
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
                        
                        console.log('[BUYER_ACK] SLA text:', slaText);
                        
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
                                        Hi <strong>${sender.name}</strong>,
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
                        
                        // Send email
                        console.log('[BUYER_ACK] Sending email to:', sender.email);
                        await emailService.sendEmail({
                            to: sender.email,
                            subject: `✅ Your Interest in ${property.title} Has Been Registered`,
                            html: acknowledgementHtml
                        });
                        console.log('[BUYER_ACK] Email sent successfully');
                        
                        // Also create in-app notification
                        const Notification = require('../models/Notification');
                        await Notification.create({
                            recipient: senderId,
                            title: '✅ Interest Registered',
                            message: `Your inquiry for ${property.title} has been sent. Expected response: ${slaText}. Priority: ${scoreResult.tier} (${scoreResult.scores.total}/100)`,
                            type: 'success',  // Use 'success' instead of 'lead_acknowledgement'
                            data: {
                                propertyId: property._id,
                                sellerId: receiverId,
                                tier: scoreResult.tier,
                                score: scoreResult.scores.total,
                                sla: slaMinutes
                            }
                        });
                        console.log('[BUYER_ACK] Notification created');
                    } else {
                        console.log('[BUYER_ACK] Skipping acknowledgement - isFirstMessage:', isFirstMessage, 'success:', scoreResult.success, 'hasSLA:', !!scoreResult.sla);
                    }
                } catch (ackError) {
                    console.error('[BUYER_ACK] Error in acknowledgement process:', ackError);
                    console.error('[BUYER_ACK] Stack:', ackError.stack);
                    // Don't throw - acknowledgement failure shouldn't break message sending
                }
            })();
        } else {
            console.log('[SEND_MESSAGE] Not buyer-to-seller or no property - skipping acknowledgement');
        }

        res.status(201).json({
            status: 'success',
            data: { message: newMessage }
        });
    } catch (err) {
        console.error('[SEND_MESSAGE] Error:', err);
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const { propertyId } = req.query;
        const currentUserId = req.user.id;

        const query = {
            sender: otherUserId,
            receiver: currentUserId,
            read: false
        };

        // If propertyId is provided, only mark messages for that property
        if (propertyId && propertyId !== 'general') {
            query.propertyId = propertyId;
        } else if (propertyId === 'general') {
            query.propertyId = null;
        }

        await Message.updateMany(query, { read: true });

        res.status(200).json({
            status: 'success',
            message: 'Messages marked as read'
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const unreadCount = await Message.countDocuments({
            receiver: userId,
            read: false
        });

        res.status(200).json({
            status: 'success',
            data: { unreadCount }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.getUnreadMessages = async (req, res) => {
    try {
        const userId = req.user.id;

        const unreadMessages = await Message.find({
            receiver: userId,
            read: false
        })
        .populate('sender', 'name email role')
        .populate('propertyId', 'title')
        .sort('-createdAt')
        .limit(20);

        res.status(200).json({
            status: 'success',
            data: { messages: unreadMessages }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const Property = require('../models/Property');
        const Lead = require('../models/Lead');

        console.log('[GET_CONVERSATIONS] User ID:', userId);
        console.log('[GET_CONVERSATIONS] User role:', req.user.role);

        // Find all messages involving this user
        let query = {
            $or: [{ sender: userId }, { receiver: userId }]
        };

        // If user is a team member, also include messages for leads assigned to them
        const user = await User.findById(userId);
        console.log('[GET_CONVERSATIONS] Is team member:', user?.isTeamMember);
        
        if (user && user.isTeamMember) {
            // Get all leads assigned to this team member
            const assignedLeads = await Lead.find({ assignedTo: userId })
                .select('buyer property seller')
                .lean();
            
            console.log('[GET_CONVERSATIONS] Team member has', assignedLeads.length, 'assigned leads');
            
            if (assignedLeads.length > 0) {
                // For each assigned lead, we want to see messages between:
                // - The buyer and the original seller (or anyone) about that property
                const leadConditions = assignedLeads.map(lead => ({
                    $and: [
                        {
                            $or: [
                                { sender: lead.buyer, receiver: lead.seller },
                                { sender: lead.seller, receiver: lead.buyer }
                            ]
                        },
                        { propertyId: lead.property }
                    ]
                }));
                
                console.log('[GET_CONVERSATIONS] Adding', leadConditions.length, 'lead conditions');
                
                // Combine with existing query
                query = {
                    $or: [
                        { sender: userId },
                        { receiver: userId },
                        ...leadConditions
                    ]
                };
            }
        }

        console.log('[GET_CONVERSATIONS] Query:', JSON.stringify(query, null, 2));

        const messages = await Message.find(query)
        .populate('propertyId', 'title images price')
        .sort('-createdAt');

        console.log('[GET_CONVERSATIONS] Found', messages.length, 'messages');

        // Group conversations by user + property combination
        const conversationMap = new Map();
        
        for (const msg of messages) {
            const otherUserId = msg.sender.toString() === userId ? msg.receiver.toString() : msg.sender.toString();
            const propertyId = msg.propertyId?._id?.toString() || 'general';
            
            // Create unique key for user + property combination
            const conversationKey = `${otherUserId}_${propertyId}`;
            
            if (!conversationMap.has(conversationKey)) {
                conversationMap.set(conversationKey, {
                    otherUserId,
                    propertyId: msg.propertyId?._id,
                    property: msg.propertyId,
                    lastMessage: msg,
                    unreadCount: 0
                });
            }
            
            // Count unread messages
            if (msg.receiver.toString() === userId && !msg.read) {
                conversationMap.get(conversationKey).unreadCount++;
            }
        }

        // Fetch user details for all conversations
        const otherUserIds = Array.from(new Set(Array.from(conversationMap.values()).map(c => c.otherUserId)));
        const users = await User.find({ _id: { $in: otherUserIds } }).select('name email role avatarUrl');
        const userMap = new Map(users.map(u => [u._id.toString(), u]));

        // Build conversation list with user and property details
        const conversations = Array.from(conversationMap.values()).map(conv => ({
            user: userMap.get(conv.otherUserId),
            property: conv.property,
            lastMessage: conv.lastMessage,
            unreadCount: conv.unreadCount,
            conversationId: `${conv.otherUserId}_${conv.propertyId || 'general'}`
        })).filter(c => c.user); // Filter out conversations where user was deleted

        console.log('[GET_CONVERSATIONS] Returning', conversations.length, 'conversations');

        // Sort by last message time
        conversations.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

        res.status(200).json({
            status: 'success',
            data: { conversations }
        });
    } catch (err) {
        console.error('[GET_CONVERSATIONS] Error:', err);
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.getChatHistory = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const { propertyId } = req.query;
        const currentUserId = req.user.id;

        console.log('[GET_CHAT_HISTORY] Current user:', currentUserId);
        console.log('[GET_CHAT_HISTORY] Other user:', otherUserId);
        console.log('[GET_CHAT_HISTORY] Property:', propertyId);

        let queryConditions = [
            { sender: currentUserId, receiver: otherUserId },
            { sender: otherUserId, receiver: currentUserId }
        ];

        // Check if current user is a team member with access to this conversation
        const user = await User.findById(currentUserId);
        console.log('[GET_CHAT_HISTORY] Is team member:', user?.isTeamMember);
        
        if (user && user.isTeamMember && propertyId && propertyId !== 'general') {
            const Lead = require('../models/Lead');
            // Check if this team member has a lead for this buyer and property
            const assignedLead = await Lead.findOne({
                assignedTo: currentUserId,
                buyer: otherUserId,
                property: propertyId
            }).populate('seller', '_id');

            console.log('[GET_CHAT_HISTORY] Team member assigned lead:', !!assignedLead);

            if (assignedLead) {
                // Team member can see messages between buyer and original seller
                queryConditions.push(
                    { sender: assignedLead.buyer, receiver: assignedLead.seller },
                    { sender: assignedLead.seller, receiver: assignedLead.buyer }
                );
                console.log('[GET_CHAT_HISTORY] Added buyer-seller conversation for team member');
                console.log('[GET_CHAT_HISTORY] Buyer:', assignedLead.buyer, 'Seller:', assignedLead.seller._id);
            }
        }

        const query = {
            $or: queryConditions
        };

        // If propertyId is provided, filter by property
        if (propertyId && propertyId !== 'general') {
            query.propertyId = propertyId;
        } else if (propertyId === 'general') {
            query.propertyId = null;
        }

        console.log('[GET_CHAT_HISTORY] Query conditions:', queryConditions.length);

        const messages = await Message.find(query)
            .sort('createdAt')
            .populate('propertyId', 'title price images');

        console.log('[GET_CHAT_HISTORY] Found', messages.length, 'messages');

        // Mark messages as read for current user (only messages TO current user)
        await Message.updateMany(
            { receiver: currentUserId, read: false, propertyId: propertyId || null },
            { read: true }
        );

        res.status(200).json({
            status: 'success',
            data: { messages }
        });
    } catch (err) {
        console.error('[GET_CHAT_HISTORY] Error:', err);
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.sendAutomatedWelcome = async (req, res) => {
    try {
        console.log('[AUTOMATED_WELCOME] Request received:', req.body);
        const { sellerId, buyerId, propertyId } = req.body;
        
        const seller = await User.findById(sellerId);
        const buyer = await User.findById(buyerId);
        const Property = require('../models/Property');
        const property = await Property.findById(propertyId);
        const Notification = require('../models/Notification');
        const emailService = require('../services/emailService');

        console.log('[AUTOMATED_WELCOME] Seller:', seller?.name);
        console.log('[AUTOMATED_WELCOME] Buyer:', buyer?.name);
        console.log('[AUTOMATED_WELCOME] Property:', property?.title);

        if (!seller || !buyer || !property) {
            console.error('[AUTOMATED_WELCOME] Missing data - Seller:', !!seller, 'Buyer:', !!buyer, 'Property:', !!property);
            return res.status(404).json({ status: 'fail', message: 'Required data not found' });
        }

        // Create automated welcome message from seller
        const welcomeText = `Hi! My name is ${seller.name}. Thank you for showing interest in ${property.title}! I'm excited to help you find your perfect property. How can I assist you today? 😊`;
        
        console.log('[AUTOMATED_WELCOME] Creating welcome message...');
        const welcomeMessage = await Message.create({
            sender: sellerId,
            receiver: buyerId,
            propertyId,
            text: welcomeText,
            isAutomated: true
        });
        console.log('[AUTOMATED_WELCOME] Welcome message created:', welcomeMessage._id);

        // Create HIGH PRIORITY notification for seller
        console.log('[AUTOMATED_WELCOME] Creating notification...');
        await Notification.create({
            recipient: sellerId,
            title: '🚨 URGENT: High-Priority Lead!',
            message: `${buyer.name} is interested in ${property.title} and waiting for your response. Reply immediately to secure this lead!`,
            type: 'lead',
            data: {
                propertyId: property._id,
                buyerId: buyer._id,
                priority: 'HIGH',
                urgent: true
            }
        });
        console.log('[AUTOMATED_WELCOME] Notification created');

        // Send HIGH PRIORITY email to seller
        console.log('[AUTOMATED_WELCOME] Sending urgent email to seller...');
        const urgentSellerHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; background: #fff5f5;">
                <!-- Urgent Header -->
                <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px 24px; text-align: center; border-top: 4px solid #7f1d1d;">
                    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">🚨 URGENT ACTION REQUIRED</h1>
                    <p style="color: rgba(255,255,255,0.95); margin: 12px 0 0 0; font-size: 18px; font-weight: 600;">High-Priority Lead Waiting for Response!</p>
                </div>

                <!-- Main Content -->
                <div style="background: white; padding: 32px 24px;">
                    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 24px; border-radius: 8px;">
                        <p style="color: #991b1b; font-size: 16px; margin: 0; font-weight: 700; line-height: 1.6;">
                            ⚠️ <strong>IMMEDIATE ATTENTION NEEDED:</strong> A verified buyer is actively interested in your property and has initiated a chat conversation. They are waiting for your response RIGHT NOW!
                        </p>
                    </div>

                    <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi <strong>${seller.name}</strong>,
                    </p>
                    
                    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                        <strong style="color: #dc2626;">${buyer.name}</strong> has clicked "Chat with Owner" for your property <strong style="color: #3b82f6;">${property.title}</strong> and is waiting in the chat for your response.
                    </p>

                    <!-- Property Card -->
                    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border: 2px solid #e2e8f0;">
                        <h3 style="color: #1e293b; margin: 0 0 12px 0; font-size: 16px; font-weight: 700;">📍 Property Details</h3>
                        <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Title:</strong> ${property.title}</p>
                        <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;"><strong>Price:</strong> ₹${property.price?.toLocaleString()}</p>
                    </div>

                    <!-- Buyer Details -->
                    <div style="background: #eff6ff; padding: 20px; border-radius: 12px; margin: 24px 0; border: 2px solid #3b82f6;">
                        <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px; font-weight: 700;">👤 Buyer Information</h3>
                        <p style="margin: 0; color: #1e293b; font-size: 14px;"><strong>Name:</strong> ${buyer.name}</p>
                        <p style="margin: 8px 0 0 0; color: #1e293b; font-size: 14px;"><strong>Email:</strong> ${buyer.email}</p>
                        ${buyer.profession ? `<p style="margin: 8px 0 0 0; color: #1e293b; font-size: 14px;"><strong>Profession:</strong> ${buyer.profession}</p>` : ''}
                    </div>

                    <!-- Warning Box -->
                    <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 12px; margin: 24px 0;">
                        <p style="color: #92400e; font-size: 15px; margin: 0 0 12px 0; font-weight: 700;">
                            ⏰ <strong>TIME-SENSITIVE:</strong>
                        </p>
                        <p style="color: #78350f; font-size: 14px; margin: 0; line-height: 1.6;">
                            Respond within the next <strong style="color: #dc2626;">2-3 minutes</strong> to maximize your chances of closing this deal. Delayed responses significantly reduce conversion rates and may impact your seller performance score.
                        </p>
                    </div>

                    <!-- Action Button -->
                    <div style="text-align: center; margin: 32px 0 24px 0;">
                        <a href="http://localhost:5173/messages?contactId=${buyer._id}&propertyId=${property._id}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                            🚀 RESPOND NOW
                        </a>
                    </div>

                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                        Don't let this opportunity slip away!<br>
                        <strong style="color: #dc2626;">Team EstatePulse</strong>
                    </p>
                </div>

                <!-- Footer -->
                <div style="background: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
                        EstatePulse AI — Real-Time Lead Management<br>
                        This is a high-priority notification. Immediate action required.
                    </p>
                </div>
            </div>
        `;

        await emailService.sendEmail({
            to: seller.email,
            subject: '🚨 URGENT: Buyer Waiting in Chat - Immediate Response Required!',
            html: urgentSellerHtml
        });
        console.log('[AUTOMATED_WELCOME] Email sent successfully to:', seller.email);

        // NOTE: We do NOT create or update lead here
        // Lead will be created when buyer sends their FIRST actual message
        // This automated welcome is from seller, not buyer

        res.status(201).json({
            status: 'success',
            data: { message: welcomeMessage }
        });
    } catch (err) {
        console.error('[AUTOMATED_WELCOME] Error:', err.message);
        console.error('[AUTOMATED_WELCOME] Stack:', err.stack);
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
