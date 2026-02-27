const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    // === BASIC ===
    title: { type: String, required: [true, 'Property title is required'], trim: true },
    propertyType: { type: String, enum: ['Apartment', 'Villa', 'Plot', 'Commercial', 'House', 'Studio', 'Other'], default: 'Apartment' },
    listingType: { type: String, enum: ['Sale', 'Rent', 'Lease'], default: 'Sale' },
    description: { type: String, default: '' },

    // === LOCATION ===
    location: { type: String, required: [true, 'Location is required'] }, // city/area display name
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    landmark: { type: String, default: '' },
    coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },

    // === PRICING ===
    price: { type: Number, required: [true, 'Price is required'] },
    negotiable: { type: Boolean, default: false },
    maintenanceCharges: { type: Number, default: null },

    // === SPECIFICATIONS ===
    area: { type: Number, default: null },
    areaUnit: { type: String, enum: ['sqft', 'sqm'], default: 'sqft' },
    bedrooms: { type: Number, default: null },
    bathrooms: { type: Number, default: null },
    balconies: { type: Number, default: null },
    floorNumber: { type: Number, default: null },
    totalFloors: { type: Number, default: null },
    furnishingStatus: { type: String, enum: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'], default: 'Unfurnished' },
    propertyAge: { type: Number, default: null },
    constructionStatus: { type: String, enum: ['Ready to Move', 'Under Construction', 'New Construction'], default: 'Ready to Move' },

    // === AVAILABILITY ===
    availableFrom: { type: Date, default: null },
    occupancyStatus: { type: String, enum: ['Vacant', 'Occupied'], default: 'Vacant' },
    listingStatus: { type: String, enum: ['Active', 'Sold', 'Rented'], default: 'Active' },

    // === MEDIA & SOCIAL ===
    images: [String],
    features: [String],
    vastuInfo: { type: String, default: '' },
    aiBrokerSummary: { type: String, default: '' },

    likes: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            username: { type: String },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            username: { type: String },
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    opinions: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            username: { type: String },
            rating: { type: String, enum: ['Good', 'Nice', 'Best', 'Awesome'] },
            createdAt: { type: Date, default: Date.now }
        }
    ],

    // === META ===
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    visitCount: { type: Number, default: 0 },
    interestCount: { type: Number, default: 0 },
    
    // === VISIBILITY CONTROL (Layer 1 & 2) ===
    visibility: {
        isVisible: { type: Boolean, default: true },
        hiddenReason: { type: String, default: '' }, // e.g., 'SLA breach - Stage 4'
        hiddenAt: { type: Date, default: null },
        hiddenUntil: { type: Date, default: null }, // Auto-unhide after this date
        hiddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null } // Admin or system
    },
    
    // === ADMIN APPROVAL SYSTEM ===
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'under_review'],
        default: 'approved' // Default for existing properties
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    submittedForApproval: { type: Date, default: null },
    
    // === SELLER Q&A ===
    sellerQA: [
        {
            question: { type: String, required: true },
            answer: { type: String, default: null }, // null if skipped
            category: { type: String, default: 'General' }, // Legal, Financial, Condition, etc.
            askedAt: { type: Date, default: Date.now },
            answeredAt: { type: Date, default: null }
        }
    ],
    qaCompleted: { type: Boolean, default: false },
    
    previousUsage: [
        {
            userType: { type: String, default: '' }, // e.g., "Tech Family", "Retail Boutique"
            purpose: { type: String, default: '' }, // e.g., "Primary Residence", "Flagship Store"
            duration: { type: String, default: '' } // e.g., "2 years", "5 years"
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

const Property = mongoose.model('Property', propertySchema);
module.exports = Property;
