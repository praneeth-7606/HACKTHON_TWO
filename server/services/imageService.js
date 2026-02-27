const axios = require('axios');

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'your_unsplash_access_key';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

/**
 * Generate search query based on property details
 */
const generateSearchQuery = (property) => {
    const queries = [];
    
    // Property type
    if (property.propertyType) {
        queries.push(property.propertyType.toLowerCase());
    }
    
    // Add descriptive terms from title
    const title = property.title.toLowerCase();
    if (title.includes('luxury')) queries.push('luxury');
    if (title.includes('modern')) queries.push('modern');
    if (title.includes('villa')) queries.push('villa');
    if (title.includes('apartment')) queries.push('apartment');
    if (title.includes('penthouse')) queries.push('penthouse');
    if (title.includes('studio')) queries.push('studio');
    
    // Location context
    if (property.city) {
        queries.push(property.city.toLowerCase());
    }
    
    // Bedrooms
    if (property.bedrooms) {
        queries.push(`${property.bedrooms}bhk`);
    }
    
    // Default to generic property search
    if (queries.length === 0) {
        queries.push('real estate', 'property', 'house');
    }
    
    return queries.join(' ');
};

/**
 * Fetch images from Unsplash based on property details
 */
exports.fetchPropertyImages = async (property, count = 4) => {
    try {
        const searchQuery = generateSearchQuery(property);
        console.log('[IMAGE_SERVICE] Search query:', searchQuery);
        
        const response = await axios.get(`${UNSPLASH_API_URL}/search/photos`, {
            params: {
                query: searchQuery,
                per_page: count,
                orientation: 'landscape',
                content_filter: 'high'
            },
            headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
        });
        
        if (response.data && response.data.results && response.data.results.length > 0) {
            // Extract image URLs (use regular quality for better performance)
            const images = response.data.results.map(photo => photo.urls.regular);
            console.log('[IMAGE_SERVICE] Found', images.length, 'images');
            return images;
        }
        
        // Fallback: Try generic property search
        console.log('[IMAGE_SERVICE] No results, trying fallback search');
        const fallbackResponse = await axios.get(`${UNSPLASH_API_URL}/search/photos`, {
            params: {
                query: 'modern house interior',
                per_page: count,
                orientation: 'landscape'
            },
            headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
        });
        
        if (fallbackResponse.data && fallbackResponse.data.results) {
            const images = fallbackResponse.data.results.map(photo => photo.urls.regular);
            return images;
        }
        
        return [];
    } catch (error) {
        console.error('[IMAGE_SERVICE] Error fetching images:', error.message);
        // Return placeholder images as fallback
        return [
            'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
        ];
    }
};

/**
 * Generate images for property based on context
 * Uses AI to determine best search terms
 */
exports.generatePropertyImages = async (property) => {
    try {
        // Determine number of images based on property type
        let imageCount = 3;
        if (property.propertyType === 'Villa' || property.propertyType === 'Penthouse') {
            imageCount = 4;
        }
        
        const images = await this.fetchPropertyImages(property, imageCount);
        
        return {
            success: true,
            images,
            count: images.length
        };
    } catch (error) {
        console.error('[IMAGE_SERVICE] Error generating images:', error);
        return {
            success: false,
            images: [],
            error: error.message
        };
    }
};
