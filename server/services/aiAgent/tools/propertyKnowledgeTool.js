const Property = require('../../../models/Property');
const User = require('../../../models/User');

/**
 * Property Knowledge Tool
 * Retrieves property and owner information from database
 * (Placeholder for future RAG implementation)
 */
class PropertyKnowledgeTool {
    /**
     * Get complete property information
     */
    async getPropertyInfo(propertyId) {
        try {
            console.log(`[PROPERTY_TOOL] Fetching info for property ${propertyId}`);

            const property = await Property.findById(propertyId).populate('seller', 'name email phoneNumber profession ownerRating company');

            if (!property) {
                return { error: 'Property not found' };
            }

            return {
                basic: {
                    title: property.title,
                    type: property.propertyType,
                    listingType: property.listingType,
                    price: `₹${property.price?.toLocaleString()}`,
                    negotiable: property.negotiable ? 'Yes' : 'No'
                },
                specifications: {
                    area: `${property.area} ${property.areaUnit}`,
                    bedrooms: property.bedrooms || 'N/A',
                    bathrooms: property.bathrooms || 'N/A',
                    balconies: property.balconies || 'N/A',
                    floor: property.floorNumber ? `${property.floorNumber} of ${property.totalFloors}` : 'N/A',
                    furnishing: property.furnishingStatus,
                    age: property.propertyAge ? `${property.propertyAge} years` : 'New',
                    constructionStatus: property.constructionStatus
                },
                location: {
                    address: property.location,
                    city: property.city,
                    state: property.state,
                    pincode: property.pincode,
                    landmark: property.landmark,
                    coordinates: property.coordinates || null
                },
                amenities: {
                    features: property.features || [],
                    maintenance: property.maintenanceCharges ? `₹${property.maintenanceCharges}/month` : 'N/A'
                },
                availability: {
                    availableFrom: property.availableFrom ? new Date(property.availableFrom).toLocaleDateString() : 'Immediate',
                    occupancyStatus: property.occupancyStatus,
                    listingStatus: property.listingStatus
                },
                owner: {
                    name: property.seller?.name,
                    contact: property.seller?.phoneNumber || property.seller?.email,
                    profession: property.seller?.profession,
                    rating: property.seller?.ownerRating || 'N/A',
                    company: property.seller?.company
                },
                additional: {
                    description: property.description,
                    vastuInfo: property.vastuInfo,
                    aiBrokerSummary: property.aiBrokerSummary,
                    previousUsage: property.previousUsage || [],
                    visitCount: property.visitCount || 0,
                    interestCount: property.interestCount || 0,
                    likes: property.likes?.length || 0,
                    comments: property.comments?.length || 0
                }
            };
        } catch (error) {
            console.error('[PROPERTY_TOOL] Error:', error.message);
            return { error: 'Unable to fetch property information' };
        }
    }

    /**
     * Search specific property details
     */
    async searchPropertyDetails(propertyId, query) {
        try {
            const propertyInfo = await this.getPropertyInfo(propertyId);
            
            if (propertyInfo.error) {
                return propertyInfo;
            }

            // Simple keyword matching for now (will be replaced by RAG)
            const queryLower = query.toLowerCase();
            const relevantInfo = {};

            // Price related
            if (queryLower.includes('price') || queryLower.includes('cost')) {
                relevantInfo.price = propertyInfo.basic.price;
                relevantInfo.negotiable = propertyInfo.basic.negotiable;
                relevantInfo.maintenance = propertyInfo.amenities.maintenance;
            }

            // Size/Area related
            if (queryLower.includes('size') || queryLower.includes('area') || queryLower.includes('sqft')) {
                relevantInfo.area = propertyInfo.specifications.area;
                relevantInfo.bedrooms = propertyInfo.specifications.bedrooms;
                relevantInfo.bathrooms = propertyInfo.specifications.bathrooms;
            }

            // Owner related
            if (queryLower.includes('owner') || queryLower.includes('seller') || queryLower.includes('contact')) {
                relevantInfo.owner = propertyInfo.owner;
            }

            // Location related
            if (queryLower.includes('location') || queryLower.includes('address') || queryLower.includes('where')) {
                relevantInfo.location = propertyInfo.location;
            }

            // Amenities/Features
            if (queryLower.includes('amenity') || queryLower.includes('amenities') || queryLower.includes('feature')) {
                relevantInfo.features = propertyInfo.amenities.features;
            }

            // Vastu
            if (queryLower.includes('vastu')) {
                relevantInfo.vastu = propertyInfo.additional.vastuInfo;
            }

            // If no specific match, return full info
            if (Object.keys(relevantInfo).length === 0) {
                return propertyInfo;
            }

            return relevantInfo;
        } catch (error) {
            console.error('[PROPERTY_TOOL] Search error:', error.message);
            return { error: 'Unable to search property details' };
        }
    }

    /**
     * Get property statistics
     */
    async getPropertyStats(propertyId) {
        try {
            const property = await Property.findById(propertyId);
            
            if (!property) {
                return { error: 'Property not found' };
            }

            return {
                engagement: {
                    views: property.visitCount || 0,
                    interested: property.interestCount || 0,
                    likes: property.likes?.length || 0,
                    comments: property.comments?.length || 0
                },
                opinions: this.aggregateOpinions(property.opinions || []),
                popularity: this.calculatePopularity(property)
            };
        } catch (error) {
            console.error('[PROPERTY_TOOL] Stats error:', error.message);
            return { error: 'Unable to fetch property statistics' };
        }
    }

    /**
     * Aggregate user opinions
     */
    aggregateOpinions(opinions) {
        const counts = { Good: 0, Nice: 0, Best: 0, Awesome: 0 };
        opinions.forEach(op => {
            if (counts.hasOwnProperty(op.rating)) {
                counts[op.rating]++;
            }
        });
        return counts;
    }

    /**
     * Calculate property popularity score
     */
    calculatePopularity(property) {
        const views = property.visitCount || 0;
        const likes = property.likes?.length || 0;
        const comments = property.comments?.length || 0;
        const interested = property.interestCount || 0;

        const score = (views * 0.1) + (likes * 2) + (comments * 1.5) + (interested * 3);
        
        if (score > 50) return 'Very Popular';
        if (score > 20) return 'Popular';
        if (score > 5) return 'Moderate Interest';
        return 'New Listing';
    }
}

module.exports = new PropertyKnowledgeTool();
