const User = require('../models/User');
const Property = require('../models/Property');
const Lead = require('../models/Lead');
const Message = require('../models/Message');
const AdminLog = require('../models/AdminLog');
const emailService = require('../services/emailService');

// ============================================
// ADMIN ANALYTICS & DASHBOARD
// ============================================

exports.getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            activeUsers,
            totalBuyers,
            totalSellers,
            totalProperties,
            pendingProperties,
            approvedProperties,
            totalLeads,
            recentUsers,
            recentProperties
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ accountStatus: 'active' }),
            User.countDocuments({ role: 'buyer' }),
            User.countDocuments({ role: 'seller' }),
            Property.countDocuments(),
            Property.countDocuments({ approvalStatus: 'pending' }),
            Property.countDocuments({ approvalStatus: 'approved' }),
            Lead.countDocuments(),
            User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt accountStatus'),
            Property.find().sort({ createdAt: -1 }).limit(5).populate('seller', 'name email')
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                stats: {
                    users: {
                        total: totalUsers,
                        active: activeUsers,
                        buyers: totalBuyers,
                        sellers: totalSellers,
                        inactive: totalUsers - activeUsers
                    },
                    properties: {
                        total: totalProperties,
                        pending: pendingProperties,
                        approved: approvedProperties,
                        rejected: totalProperties - pendingProperties - approvedProperties
                    },
                    leads: totalLeads
                },
                recentUsers,
                recentProperties
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// ============================================
// USER MANAGEMENT
// ============================================

exports.getAllUsers = async (req, res) => {
    try {
        const { role, status, search, page = 1, limit = 20 } = req.query;
        const query = {};

        if (role && role !== 'all') query.role = role;
        if (status && status !== 'all') query.accountStatus = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await User.countDocuments(query);

        // Get additional stats for each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const userObj = user.toObject();
            
            if (user.role === 'seller') {
                userObj.propertiesListed = await Property.countDocuments({ seller: user._id });
                userObj.propertiesApproved = await Property.countDocuments({ 
                    seller: user._id, 
                    approvalStatus: 'approved' 
                });
            }
            
            if (user.role === 'buyer') {
                userObj.leadsGenerated = await Lead.countDocuments({ buyer: user._id });
                userObj.savedPropertiesCount = user.savedProperties?.length || 0;
            }
            
            return userObj;
        }));

        res.status(200).json({
            status: 'success',
            data: {
                users: usersWithStats,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                total: count
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        const userStats = {
            user: user.toObject()
        };

        if (user.role === 'seller') {
            userStats.properties = await Property.find({ seller: user._id })
                .sort({ createdAt: -1 })
                .limit(10);
            userStats.totalProperties = await Property.countDocuments({ seller: user._id });
            userStats.approvedProperties = await Property.countDocuments({ 
                seller: user._id, 
                approvalStatus: 'approved' 
            });
            userStats.pendingProperties = await Property.countDocuments({ 
                seller: user._id, 
                approvalStatus: 'pending' 
            });
        }

        if (user.role === 'buyer') {
            userStats.leads = await Lead.find({ buyer: user._id })
                .populate('property', 'title location price')
                .sort({ createdAt: -1 })
                .limit(10);
            userStats.totalLeads = await Lead.countDocuments({ buyer: user._id });
            userStats.savedProperties = await Property.find({ 
                _id: { $in: user.savedProperties } 
            }).limit(10);
        }

        // Get admin logs for this user
        userStats.adminLogs = await AdminLog.find({ targetId: user._id })
            .populate('admin', 'name email')
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            status: 'success',
            data: userStats
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { accountStatus, statusReason } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        const oldStatus = user.accountStatus;
        user.accountStatus = accountStatus;
        user.isActive = accountStatus === 'active';
        user.statusReason = statusReason || '';
        user.lastStatusChange = new Date();
        user.statusChangedBy = req.user.id;

        await user.save();

        // Log admin action
        await AdminLog.create({
            admin: req.user.id,
            action: 'user_status_change',
            targetType: 'user',
            targetId: userId,
            details: `Changed user status from ${oldStatus} to ${accountStatus}`,
            metadata: { oldStatus, newStatus: accountStatus, reason: statusReason }
        });

        // If reactivating a suspended seller, unhide all their properties
        if (oldStatus === 'suspended' && accountStatus === 'active' && user.role === 'seller') {
            console.log(`[ADMIN] Reactivating seller ${userId}, unhiding properties...`);
            const { reactivateSellerAccount } = require('../services/sellerAccountabilityService');
            const reactivationResult = await reactivateSellerAccount(userId);
            
            if (reactivationResult.success) {
                console.log(`[ADMIN] Seller reactivated: ${reactivationResult.message}`);
                // Log the reactivation
                await AdminLog.create({
                    admin: req.user.id,
                    action: 'seller_reactivation',
                    targetType: 'user',
                    targetId: userId,
                    details: `Seller account reactivated and ${reactivationResult.seller.propertiesUnhidden} properties unhidden`,
                    metadata: reactivationResult.seller
                });
            }
        }

        // Send email notification
        await emailService.sendEmail({
            to: user.email,
            subject: `Account Status Update - ${accountStatus.toUpperCase()}`,
            html: `
                <h2>Account Status Update</h2>
                <p>Dear ${user.name},</p>
                <p>Your account status has been updated to: <strong>${accountStatus}</strong></p>
                ${statusReason ? `<p><strong>Reason:</strong> ${statusReason}</p>` : ''}
                <p>If you have any questions, please contact our support team.</p>
            `
        });

        res.status(200).json({
            status: 'success',
            message: 'User status updated successfully',
            data: { user }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// ============================================
// PROPERTY APPROVAL SYSTEM
// ============================================

exports.getPendingProperties = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const properties = await Property.find({ approvalStatus: 'pending' })
            .populate('seller', 'name email phoneNumber company')
            .sort({ submittedForApproval: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Property.countDocuments({ approvalStatus: 'pending' });

        res.status(200).json({
            status: 'success',
            data: {
                properties,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                total: count
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.getAllPropertiesForAdmin = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const query = {};

        if (status && status !== 'all') query.approvalStatus = status;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        const properties = await Property.find(query)
            .populate('seller', 'name email phoneNumber')
            .populate('approvedBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Property.countDocuments(query);

        res.status(200).json({
            status: 'success',
            data: {
                properties,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                total: count
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.approveProperty = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { adminNotes } = req.body;

        const property = await Property.findById(propertyId).populate('seller', 'name email');
        if (!property) {
            return res.status(404).json({ status: 'fail', message: 'Property not found' });
        }

        property.approvalStatus = 'approved';
        property.approvedBy = req.user.id;
        property.approvedAt = new Date();
        property.adminNotes = adminNotes || '';
        property.listingStatus = 'Active';

        await property.save();

        // Log admin action
        await AdminLog.create({
            admin: req.user.id,
            action: 'property_approved',
            targetType: 'property',
            targetId: propertyId,
            details: `Approved property: ${property.title}`,
            metadata: { propertyTitle: property.title, sellerId: property.seller._id }
        });

        // Send approval email to seller
        await emailService.sendEmail({
            to: property.seller.email,
            subject: '🎉 Property Approved - Now Live!',
            html: `
                <h2>Congratulations! Your Property is Approved</h2>
                <p>Dear ${property.seller.name},</p>
                <p>Great news! Your property listing has been approved and is now live on our platform.</p>
                <h3>Property Details:</h3>
                <ul>
                    <li><strong>Title:</strong> ${property.title}</li>
                    <li><strong>Location:</strong> ${property.location}</li>
                    <li><strong>Price:</strong> ₹${property.price.toLocaleString()}</li>
                    <li><strong>Approved on:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>
                ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
                <p>Your property is now visible to all buyers on the platform!</p>
                <p>Best regards,<br>Admin Team</p>
            `
        });

        res.status(200).json({
            status: 'success',
            message: 'Property approved successfully',
            data: { property }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.rejectProperty = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { rejectionReason, adminNotes } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'Rejection reason is required' 
            });
        }

        const property = await Property.findById(propertyId).populate('seller', 'name email');
        if (!property) {
            return res.status(404).json({ status: 'fail', message: 'Property not found' });
        }

        property.approvalStatus = 'rejected';
        property.rejectionReason = rejectionReason;
        property.adminNotes = adminNotes || '';
        property.approvedBy = req.user.id;
        property.approvedAt = new Date();
        property.listingStatus = 'Sold'; // Hide from active listings

        await property.save();

        // Log admin action
        await AdminLog.create({
            admin: req.user.id,
            action: 'property_rejected',
            targetType: 'property',
            targetId: propertyId,
            details: `Rejected property: ${property.title}`,
            metadata: { 
                propertyTitle: property.title, 
                sellerId: property.seller._id,
                reason: rejectionReason 
            }
        });

        // Send rejection email to seller
        await emailService.sendEmail({
            to: property.seller.email,
            subject: 'Property Listing - Action Required',
            html: `
                <h2>Property Listing Update</h2>
                <p>Dear ${property.seller.name},</p>
                <p>We've reviewed your property listing and it requires some updates before it can be published.</p>
                <h3>Property Details:</h3>
                <ul>
                    <li><strong>Title:</strong> ${property.title}</li>
                    <li><strong>Location:</strong> ${property.location}</li>
                </ul>
                <h3>Reason for Review:</h3>
                <p>${rejectionReason}</p>
                ${adminNotes ? `<p><strong>Additional Notes:</strong> ${adminNotes}</p>` : ''}
                <p>Please update your listing and resubmit for approval.</p>
                <p>If you have any questions, feel free to contact our support team.</p>
                <p>Best regards,<br>Admin Team</p>
            `
        });

        res.status(200).json({
            status: 'success',
            message: 'Property rejected successfully',
            data: { property }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// Approve all existing properties (one-time migration)
exports.approveAllExistingProperties = async (req, res) => {
    try {
        const result = await Property.updateMany(
            { approvalStatus: { $exists: false } },
            { 
                $set: { 
                    approvalStatus: 'approved',
                    approvedBy: req.user.id,
                    approvedAt: new Date(),
                    adminNotes: 'Auto-approved (existing property)'
                }
            }
        );

        // Log admin action
        await AdminLog.create({
            admin: req.user.id,
            action: 'bulk_action',
            targetType: 'bulk',
            details: `Bulk approved ${result.modifiedCount} existing properties`,
            metadata: { count: result.modifiedCount, action: 'approve_existing' }
        });

        res.status(200).json({
            status: 'success',
            message: `Successfully approved ${result.modifiedCount} existing properties`,
            data: { count: result.modifiedCount }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// ============================================
// ADMIN LOGS & AUDIT TRAIL
// ============================================

exports.getAdminLogs = async (req, res) => {
    try {
        const { action, targetType, page = 1, limit = 50 } = req.query;
        const query = {};

        if (action && action !== 'all') query.action = action;
        if (targetType && targetType !== 'all') query.targetType = targetType;

        const logs = await AdminLog.find(query)
            .populate('admin', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await AdminLog.countDocuments(query);

        res.status(200).json({
            status: 'success',
            data: {
                logs,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                total: count
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// ============================================
// BULK ACTIONS
// ============================================

exports.bulkUpdateUsers = async (req, res) => {
    try {
        const { userIds, action, accountStatus, statusReason } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'User IDs array is required' 
            });
        }

        let updateData = {};
        if (action === 'update_status') {
            updateData = {
                accountStatus,
                isActive: accountStatus === 'active',
                statusReason: statusReason || '',
                lastStatusChange: new Date(),
                statusChangedBy: req.user.id
            };
        }

        const result = await User.updateMany(
            { _id: { $in: userIds } },
            { $set: updateData }
        );

        // Log admin action
        await AdminLog.create({
            admin: req.user.id,
            action: 'bulk_action',
            targetType: 'bulk',
            details: `Bulk updated ${result.modifiedCount} users`,
            metadata: { userIds, action, updateData }
        });

        res.status(200).json({
            status: 'success',
            message: `Successfully updated ${result.modifiedCount} users`,
            data: { count: result.modifiedCount }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

module.exports = exports;
