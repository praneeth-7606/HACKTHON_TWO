const propertyAgent = require('../services/aiAgent/propertyAgent');
const Property = require('../models/Property');

/**
 * AI Agent Controller
 * Handles agent chat interactions
 */

exports.chatWithAgent = async (req, res) => {
    try {
        const { propertyId, query, sessionId } = req.body;
        const userId = req.user.id;

        console.log(`[AGENT_CONTROLLER] User ${userId} querying about property ${propertyId}`);

        if (!propertyId || !query) {
            return res.status(400).json({
                status: 'fail',
                message: 'Property ID and query are required'
            });
        }

        // Get property location for maps/weather queries
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({
                status: 'fail',
                message: 'Property not found'
            });
        }

        // Build comprehensive location string with coordinates if available
        let propertyLocation = property.location || property.city;
        if (property.city && !propertyLocation.includes(property.city)) {
            propertyLocation = `${propertyLocation}, ${property.city}`;
        }
        if (property.state && !propertyLocation.includes(property.state)) {
            propertyLocation = `${propertyLocation}, ${property.state}`;
        }

        const agentSessionId = sessionId || `${userId}_${propertyId}`;

        // Process query with agent, passing coordinates if available
        const result = await propertyAgent.handleQuery(
            agentSessionId,
            propertyId,
            query,
            propertyLocation,
            property.coordinates // Pass GPS coordinates
        );

        res.status(200).json({
            status: 'success',
            data: {
                response: result.response,
                toolUsed: result.toolUsed,
                sessionId: agentSessionId,
                metadata: result.metadata
            }
        });
    } catch (error) {
        console.error('[AGENT_CONTROLLER] Error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to process agent query',
            error: error.message
        });
    }
};

exports.getConversationHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const history = await propertyAgent.getHistory(sessionId);

        res.status(200).json({
            status: 'success',
            data: { history }
        });
    } catch (error) {
        console.error('[AGENT_CONTROLLER] History error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch conversation history'
        });
    }
};

exports.clearConversation = async (req, res) => {
    try {
        const { sessionId } = req.params;

        propertyAgent.clearSession(sessionId);

        res.status(200).json({
            status: 'success',
            message: 'Conversation cleared'
        });
    } catch (error) {
        console.error('[AGENT_CONTROLLER] Clear error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to clear conversation'
        });
    }
};
