const propertySearchAgent = require('../services/propertySearchAgent');

/**
 * Smart Property Search Controller
 */

// @desc    Search properties using natural language
// @route   POST /api/v1/search/properties
// @access  Public
exports.searchProperties = async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a search query'
            });
        }
        
        console.log(`[SEARCH_CONTROLLER] Received query: "${query}"`);
        
        // Execute smart search
        const result = await propertySearchAgent.search(query);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Search failed',
                error: result.error
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                query: result.query,
                count: result.count,
                properties: result.properties,
                filters: result.filters
            }
        });
        
    } catch (error) {
        console.error('[SEARCH_CONTROLLER] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during search',
            error: error.message
        });
    }
};
