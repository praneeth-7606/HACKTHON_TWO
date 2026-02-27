const Property = require('../models/Property');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generatePropertySummary } = require('../services/parseService');
const { orchestrateLead } = require('../services/aiOrchestrator');
const { generatePropertyImages } = require('../services/imageService');

exports.createProperty = async (req, res) => {
    try {
        // Check if images are provided
        let propertyData = { 
            ...req.body, 
            seller: req.user.id,
            // New properties require admin approval
            approvalStatus: 'pending',
            submittedForApproval: new Date()
        };
        
        // If no images provided, generate them automatically
        if (!propertyData.images || propertyData.images.length === 0) {
            console.log('[CREATE_PROPERTY] No images provided, generating automatically...');
            const imageResult = await generatePropertyImages(propertyData);
            if (imageResult.success && imageResult.images.length > 0) {
                propertyData.images = imageResult.images;
                console.log('[CREATE_PROPERTY] Generated', imageResult.images.length, 'images');
            }
        }
        
        const newProperty = await Property.create(propertyData);

        // Trigger AI Broker Summary in background
        setImmediate(async () => {
            try {
                const summary = await generatePropertySummary(newProperty);
                await Property.findByIdAndUpdate(newProperty._id, { aiBrokerSummary: summary });
            } catch (bgErr) {
                console.error('[BG_SUMMARY] Failed to update summary:', bgErr.message);
            }
        });

        res.status(201).json({ 
            status: 'success', 
            message: 'Property submitted for admin approval',
            data: { property: newProperty } 
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.getAllProperties = async (req, res) => {
    try {
        // Build query
        let query = { approvalStatus: 'approved' };
        
        // Filter out hidden properties (unless admin)
        if (req.user?.role !== 'admin') {
            query.$or = [
                { 'visibility.isVisible': true },
                { 'visibility.isVisible': { $exists: false } } // For old properties without visibility field
            ];
        }
        
        const properties = await Property.find(query).populate('seller', 'name email sellerRating');
        res.status(200).json({ status: 'success', results: properties.length, data: { properties } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

/**
 * Get seller's own properties (for seller dashboard)
 */
exports.getSellerProperties = async (req, res) => {
    try {
        const sellerId = req.user.id;
        
        // Get only this seller's properties
        const properties = await Property.find({ seller: sellerId })
            .sort({ createdAt: -1 });
        
        res.status(200).json({ 
            status: 'success', 
            results: properties.length, 
            data: { properties } 
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.getProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id)
            .populate('seller', 'name email ownerRating');

        if (property) {
            property.visitCount += 1;
            await property.save();
        }

        res.status(200).json({ status: 'success', data: { property } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.likeProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ status: 'fail', message: 'Property not found' });

        // Profile Enforcement Check
        if (!req.user.profileCompleted) {
            return res.status(403).json({
                status: 'fail',
                message: 'Please complete your profile (Phone, Profession, Address) to interact with properties.'
            });
        }

        const likeIndex = property.likes.findIndex(l => l.user.toString() === req.user.id);
        if (likeIndex > -1) {
            property.likes.splice(likeIndex, 1); // unlike
        } else {
            property.likes.push({ user: req.user.id, username: req.user.name });

            // Trigger Orchestration for New Like
            const seller = await User.findById(property.seller);
            orchestrateLead(req.user, seller, property, 'LIKE');
        }

        await property.save();
        res.status(200).json({ status: 'success', data: { likes: property.likes } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.addComment = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ status: 'fail', message: 'Property not found' });

        property.comments.push({
            user: req.user.id,
            username: req.user.name,
            text: req.body.text
        });

        await property.save();
        res.status(200).json({ status: 'success', data: { comments: property.comments } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.submitOpinion = async (req, res) => {
    try {
        const { rating } = req.body;
        if (!['Good', 'Nice', 'Best', 'Awesome'].includes(rating)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid rating' });
        }

        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ status: 'fail', message: 'Property not found' });

        // Update if already exists, else push
        const opIndex = property.opinions.findIndex(o => o.user.toString() === req.user.id);
        if (opIndex > -1) {
            property.opinions[opIndex].rating = rating;
        } else {
            property.opinions.push({ user: req.user.id, username: req.user.name, rating });
        }

        await property.save();
        res.status(200).json({ status: 'success', data: { opinions: property.opinions } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.summarizeProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ status: 'fail', message: 'Property not found' });

        const summary = await generatePropertySummary(property);
        property.aiBrokerSummary = summary;
        await property.save();

        res.status(200).json({ status: 'success', data: { aiBrokerSummary: summary } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.trackInterest = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ status: 'fail', message: 'Property not found' });

        property.interestCount += 1;
        await property.save();

        // Trigger Orchestration for Engagement (Dwell Time)
        const seller = await User.findById(property.seller);
        orchestrateLead(req.user, seller, property, 'DWELL_TIME');

        res.status(200).json({ status: 'success', message: 'Interest tracked' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id }).sort('-createdAt');
        res.status(200).json({ status: 'success', data: { notifications } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.updateProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        
        if (!property) {
            return res.status(404).json({ status: 'fail', message: 'Property not found' });
        }
        
        // Verify ownership
        if (property.seller.toString() !== req.user.id) {
            return res.status(403).json({ status: 'fail', message: 'Not authorized to update this property' });
        }
        
        // Update allowed fields
        const allowedUpdates = ['title', 'description', 'price', 'listingStatus', 'negotiable', 
                                'maintenanceCharges', 'area', 'bedrooms', 'bathrooms', 'balconies',
                                'furnishingStatus', 'availableFrom', 'occupancyStatus', 'features', 'vastuInfo'];
        
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                property[key] = req.body[key];
            }
        });
        
        await property.save();
        
        res.status(200).json({ 
            status: 'success', 
            data: { property },
            message: 'Property updated successfully'
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.saveProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ status: 'fail', message: 'Property not found' });
        }

        const user = await User.findById(req.user.id);
        
        // Check if already saved
        const isSaved = user.savedProperties.some(id => id.toString() === property._id.toString());
        
        if (isSaved) {
            // Unsave
            user.savedProperties = user.savedProperties.filter(id => id.toString() !== property._id.toString());
            await user.save();
            
            return res.status(200).json({
                status: 'success',
                data: { saved: false },
                message: 'Property removed from saved list'
            });
        } else {
            // Save
            user.savedProperties.push(property._id);
            await user.save();
            
            return res.status(200).json({
                status: 'success',
                data: { saved: true },
                message: 'Property saved successfully'
            });
        }
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.getSavedProperties = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'savedProperties',
            populate: { path: 'seller', select: 'name email ownerRating' }
        });
        
        res.status(200).json({
            status: 'success',
            results: user.savedProperties.length,
            data: { properties: user.savedProperties }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
