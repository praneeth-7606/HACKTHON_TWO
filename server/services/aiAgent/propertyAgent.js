const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { PromptTemplate } = require('@langchain/core/prompts');

const propertyKnowledgeTool = require('./tools/propertyKnowledgeTool');
const mapsDistanceTool = require('./tools/mapsDistanceTool');
const weatherTool = require('./tools/weatherTool');

/**
 * Property AI Agent
 * LangChain-based agent that assists buyers with property queries
 */
class PropertyAgent {
    constructor() {
        this.model = new ChatGoogleGenerativeAI({
            model: 'gemini-2.5-flash',
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0.7,
            maxOutputTokens: 2048  // Increased to allow longer responses with multiple options
        });

        // Store conversation histories per session (simple in-memory storage)
        this.conversationHistories = new Map();
    }

    /**
     * Get or create conversation history for a session
     */
    getConversationHistory(sessionId) {
        if (!this.conversationHistories.has(sessionId)) {
            this.conversationHistories.set(sessionId, []);
        }
        return this.conversationHistories.get(sessionId);
    }

    /**
     * Add message to conversation history
     */
    addToHistory(sessionId, role, content) {
        const history = this.getConversationHistory(sessionId);
        history.push({ role, content, timestamp: new Date() });
        
        // Keep only last 10 messages to avoid token limits
        if (history.length > 10) {
            history.shift();
        }
    }

    /**
     * Format conversation history for prompt
     */
    formatHistory(sessionId) {
        const history = this.getConversationHistory(sessionId);
        if (history.length === 0) return 'No previous conversation.';
        
        return history.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    }

    /**
     * Main query handler - routes to appropriate tool
     */
    async handleQuery(sessionId, propertyId, userQuery, propertyLocation, propertyCoordinates = null) {
        try {
            console.log(`[AGENT] Session: ${sessionId}, Query: ${userQuery}`);
            console.log(`[AGENT] Property location: ${propertyLocation}`);
            if (propertyCoordinates && propertyCoordinates.lat && propertyCoordinates.lng) {
                console.log(`[AGENT] Property coordinates: ${propertyCoordinates.lat}, ${propertyCoordinates.lng}`);
            }

            // Step 1: Always fetch property info for context
            const propertyInfo = await propertyKnowledgeTool.getPropertyInfo(propertyId);

            // Step 2: Classify intent
            const intent = await this.classifyIntent(userQuery);
            console.log(`[AGENT] Classified intent: ${intent.type}`);

            // Step 3: Execute appropriate tool
            let toolResult;
            switch (intent.type) {
                case 'property':
                    toolResult = await this.handlePropertyQuery(propertyId, userQuery);
                    break;
                case 'maps':
                    toolResult = await this.handleMapsQuery(propertyLocation, intent.details, propertyCoordinates);
                    break;
                case 'weather':
                    toolResult = await this.handleWeatherQuery(propertyLocation, intent.details);
                    break;
                case 'general':
                default:
                    toolResult = { type: 'general', data: null };
            }

            // Step 4: Generate natural language response with property context
            const response = await this.generateResponse(
                sessionId,
                userQuery,
                toolResult,
                propertyId,
                propertyInfo,
                propertyLocation
            );

            return {
                success: true,
                response: response,
                toolUsed: intent.type,
                metadata: {
                    intent: intent.type,
                    confidence: intent.confidence
                }
            };
        } catch (error) {
            console.error('[AGENT] Error:', error.message);
            return {
                success: false,
                response: "I apologize, but I'm having trouble processing your request. Could you please rephrase your question?",
                error: error.message
            };
        }
    }

    /**
     * Classify user intent using LLM
     */
    async classifyIntent(query) {
        const classificationPrompt = `
You are an intent classifier for a real estate AI assistant. Classify the user's query into one of these categories:

1. "property" - Questions about property details, price, owner, amenities, specifications
2. "maps" - Questions about distance, location, nearby places, travel time
3. "weather" - Questions about weather, climate, temperature, rainfall
4. "general" - General conversation, greetings, or unclear queries

User Query: "${query}"

Respond with ONLY a JSON object in this format:
{
    "type": "property|maps|weather|general",
    "confidence": 0.0-1.0,
    "details": "brief description of what user wants"
}`;

        try {
            const result = await this.model.invoke(classificationPrompt);
            const cleaned = result.content.replace(/```json|```/gi, '').trim();
            return JSON.parse(cleaned);
        } catch (error) {
            console.error('[AGENT] Intent classification error:', error.message);
            return { type: 'general', confidence: 0.5, details: 'Unable to classify' };
        }
    }

    /**
     * Handle property-related queries
     */
    async handlePropertyQuery(propertyId, query) {
        const data = await propertyKnowledgeTool.searchPropertyDetails(propertyId, query);
        return { type: 'property', data };
    }

    /**
     * Handle maps/distance queries with LLM-powered analysis
     */
    async handleMapsQuery(propertyLocation, details, propertyCoordinates = null) {
        console.log(`[AGENT] Maps query details: "${details}"`);

        // Step A: Prepare Origin (GPS coordinates if available)
        let origin = propertyLocation;
        if (propertyCoordinates && propertyCoordinates.lat && propertyCoordinates.lng) {
            origin = `${propertyCoordinates.lat},${propertyCoordinates.lng}`;
            console.log(`[AGENT] Using GPS coordinates for origin: ${origin}`);
        } else {
            console.log(`[AGENT] Using location string for origin: ${origin}`);
        }

        // Step B & C: Use LLM to analyze the maps query intelligently
        const mapsAnalysis = await this.analyzeMapsQuery(details, propertyLocation);
        console.log(`[AGENT] LLM Maps Analysis:`, JSON.stringify(mapsAnalysis, null, 2));

        // Step D: Call appropriate Google Maps API based on LLM analysis
        let data;
        
        if (mapsAnalysis.queryType === 'nearby_search') {
            // Find nearby places
            const radius = mapsAnalysis.searchRadius || 10000; // Default 10km
            data = await mapsDistanceTool.findNearbyPlaces(origin, mapsAnalysis.placeType, radius);
            return { type: 'maps_nearby', data };
            
        } else if (mapsAnalysis.queryType === 'distance' || mapsAnalysis.queryType === 'route') {
            // Calculate distance/route
            let destination = mapsAnalysis.destination;
            
            // Add city context if not present
            if (destination && !destination.toLowerCase().includes('bangalore') && !destination.toLowerCase().includes('bengaluru')) {
                destination = `${destination}, Bangalore, India`;
            }
            
            data = await mapsDistanceTool.calculateDistance(origin, destination);
            return { type: 'maps_distance', data };
            
        } else {
            // Fallback for unclear queries
            return { 
                type: 'maps', 
                data: { 
                    error: 'Could not understand the location query. Please be more specific.',
                    suggestion: mapsAnalysis.suggestion || 'Try asking about nearby places or distance to a specific location.'
                } 
            };
        }
    }

    /**
     * NEW: Use LLM to intelligently analyze maps queries with robust error handling
     */
    async analyzeMapsQuery(userQuery, propertyLocation) {
        const analysisPrompt = `You are a location query analyzer. Analyze this query and respond with ONLY valid JSON.

User Query: "${userQuery}"
Property Location: ${propertyLocation}

Respond with this exact JSON structure (no extra text, no markdown):
{"queryType":"nearby_search","destination":null,"placeType":"metro_station","searchRadius":10000,"confidence":0.9}

Rules:
- queryType: "nearby_search" (for nearest/farest/around), "distance" (for how far to specific place), "route" (for directions)
- placeType: metro_station, bus_station, train_station, school, hospital, restaurant, bank, pharmacy, supermarket, shopping_mall, park, gym
- For "farest/furthest" use "nearby_search" (we sort results later)
- searchRadius: 10000 (default)
- confidence: 0.0 to 1.0

Examples:
"nearest metro" → {"queryType":"nearby_search","destination":null,"placeType":"metro_station","searchRadius":10000,"confidence":0.95}
"farest metro" → {"queryType":"nearby_search","destination":null,"placeType":"metro_station","searchRadius":10000,"confidence":0.9}
"route to marathahalli" → {"queryType":"route","destination":"marathahalli","placeType":null,"searchRadius":null,"confidence":0.95}
"schools nearby" → {"queryType":"nearby_search","destination":null,"placeType":"school","searchRadius":10000,"confidence":0.9}

Analyze: "${userQuery}"
JSON:`;

        try {
            const result = await this.model.invoke(analysisPrompt);
            
            if (!result || !result.content) {
                throw new Error('Empty LLM response');
            }
            
            let content = result.content.trim();
            console.log(`[AGENT] Raw LLM response: ${content.substring(0, 200)}`);
            
            // Aggressive cleaning
            content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
            content = content.replace(/^[^{]*/, ''); // Remove everything before first {
            content = content.replace(/[^}]*$/, ''); // Remove everything after last }
            
            // Find the JSON object
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}');
            
            if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
                throw new Error('No valid JSON object found in response');
            }
            
            content = content.substring(jsonStart, jsonEnd + 1);
            console.log(`[AGENT] Cleaned JSON: ${content}`);
            
            const analysis = JSON.parse(content);
            
            // Validate required fields
            if (!analysis.queryType || !['nearby_search', 'distance', 'route'].includes(analysis.queryType)) {
                throw new Error('Invalid queryType in response');
            }
            
            console.log(`[AGENT] ✅ Successfully parsed: queryType=${analysis.queryType}, placeType=${analysis.placeType}`);
            return analysis;
            
        } catch (error) {
            console.error('[AGENT] ❌ LLM analysis failed:', error.message);
            
            // ROBUST FALLBACK: Keyword-based analysis
            const queryLower = userQuery.toLowerCase();
            let queryType = 'nearby_search';
            let placeType = 'point_of_interest';
            let destination = null;
            
            console.log(`[AGENT] Using keyword-based fallback for: "${userQuery}"`);
            
            // Detect place type (most specific first)
            if (queryLower.includes('metro') || queryLower.includes('subway')) {
                placeType = 'metro_station';
            } else if (queryLower.includes('bus stop') || queryLower.includes('bus stand')) {
                placeType = 'bus_station';
            } else if (queryLower.includes('bus')) {
                placeType = 'bus_station';
            } else if (queryLower.includes('train') || queryLower.includes('railway')) {
                placeType = 'train_station';
            } else if (queryLower.includes('school')) {
                placeType = 'school';
            } else if (queryLower.includes('hospital')) {
                placeType = 'hospital';
            } else if (queryLower.includes('restaurant')) {
                placeType = 'restaurant';
            } else if (queryLower.includes('bank')) {
                placeType = 'bank';
            } else if (queryLower.includes('pharmacy')) {
                placeType = 'pharmacy';
            } else if (queryLower.includes('mall') || queryLower.includes('shopping')) {
                placeType = 'shopping_mall';
            } else if (queryLower.includes('park')) {
                placeType = 'park';
            } else if (queryLower.includes('gym')) {
                placeType = 'gym';
            }
            
            // Detect query type
            if (queryLower.includes('route') || queryLower.includes('how to get') || queryLower.includes('way to') || queryLower.includes('directions')) {
                queryType = 'route';
                // Try to extract destination
                const routeMatch = queryLower.match(/(?:route|way|get)\s+to\s+([a-z\s]+)/i);
                if (routeMatch) {
                    destination = routeMatch[1].trim();
                }
            } else if (queryLower.includes('distance') || queryLower.includes('how far')) {
                // Check if asking about nearest or specific place
                if (queryLower.includes('nearest') || queryLower.includes('closest') || queryLower.includes('farest') || queryLower.includes('furthest')) {
                    queryType = 'nearby_search';
                } else {
                    queryType = 'distance';
                    // Try to extract destination
                    const distMatch = queryLower.match(/(?:to|from)\s+([a-z\s]+)/i);
                    if (distMatch) {
                        destination = distMatch[1].trim();
                    }
                }
            } else if (queryLower.includes('nearest') || queryLower.includes('closest') || queryLower.includes('farest') || queryLower.includes('furthest') || queryLower.includes('nearby') || queryLower.includes('around')) {
                queryType = 'nearby_search';
            }
            
            console.log(`[AGENT] ✅ Fallback result: queryType=${queryType}, placeType=${placeType}, destination=${destination}`);
            
            return {
                queryType: queryType,
                destination: destination,
                placeType: placeType,
                searchRadius: 10000,
                confidence: 0.7,
                reasoning: 'Keyword-based fallback analysis',
                suggestion: null
            };
        }
    }

    /**
     * Handle weather queries
     */
    async handleWeatherQuery(propertyLocation, details) {
        const detailsLower = details.toLowerCase();

        // Check if it's a forecast query
        if (detailsLower.includes('forecast') || detailsLower.includes('next') || detailsLower.includes('week')) {
            const data = await weatherTool.getWeatherForecast(propertyLocation, 5);
            return { type: 'weather_forecast', data };
        }

        // Check if it's a climate query
        if (detailsLower.includes('climate') || detailsLower.includes('generally') || detailsLower.includes('usually')) {
            const data = await weatherTool.getClimateInfo(propertyLocation);
            return { type: 'weather_climate', data };
        }

        // Default to current weather
        const data = await weatherTool.getCurrentWeather(propertyLocation);
        return { type: 'weather_current', data };
    }

    /**
     * Generate natural language response with optimized LLM interpretation
     */
    async generateResponse(sessionId, userQuery, toolResult, propertyId, propertyInfo, propertyLocation) {
        const conversationHistory = this.formatHistory(sessionId);

        // Check if we have successful results
        const hasResults = toolResult.data && toolResult.data.places && toolResult.data.places.length > 0;
        
        // Use LLM to interpret results based on user's specific question
        if (hasResults && toolResult.type === 'maps_nearby') {
            const places = toolResult.data.places;
            
            // Build clean, structured data for LLM (show top 4 places)
            const topPlaces = places.slice(0, 4);
            const placesText = topPlaces.map((place, index) => 
                `${index + 1}. ${place.name} - ${place.distance} away (Rating: ${place.rating}, Address: ${place.address})`
            ).join('\n');
            
            const interpretationPrompt = `You are a helpful real estate assistant. Show ALL options to help users make informed decisions.

USER ASKED: "${userQuery}"

I FOUND ${topPlaces.length} PLACES:
${placesText}

WRITE A COMPLETE RESPONSE showing all ${topPlaces.length} places. Use this exact structure:

Great news! I found ${topPlaces.length} [type] near the property:

1. **[First place name]** ⭐ [rating]
   📍 Distance: [distance]
   📫 Address: [address]
   [Why this place is good - 1 sentence]

2. **[Second place name]** ⭐ [rating]
   📍 Distance: [distance]
   📫 Address: [address]
   [Why this place is good - 1 sentence]

3. **[Third place name]** ⭐ [rating]
   📍 Distance: [distance]
   📫 Address: [address]
   [Why this place is good - 1 sentence]

4. **[Fourth place name]** ⭐ [rating]
   📍 Distance: [distance]
   📫 Address: [address]
   [Why this place is good - 1 sentence]

🎯 **My Recommendation:** [Best option name] is [why it's best] at [distance] away!

IMPORTANT: Do NOT add follow-up questions like "Would you like..." or "Can I help...". Just end with the recommendation.

NOW WRITE THE COMPLETE RESPONSE WITH ALL ${topPlaces.length} PLACES:`;

            try {
                console.log(`[AGENT] 🤖 Calling LLM to interpret ${topPlaces.length} results for query: "${userQuery}"`);
                
                const response = await this.model.invoke(interpretationPrompt);
                
                if (!response || !response.content) {
                    throw new Error('Empty LLM response');
                }
                
                console.log(`[AGENT] ✅ LLM generated response (${response.content.length} chars)`);
                console.log(`[AGENT] 📝 LLM Response Preview: ${response.content.substring(0, 300)}...`);
                
                // Add to conversation history
                this.addToHistory(sessionId, 'User', userQuery);
                this.addToHistory(sessionId, 'Agent', response.content);
                
                return response.content;
                
            } catch (error) {
                console.error(`[AGENT] ❌ LLM response generation failed:`, error.message);
                console.log(`[AGENT] ⚠️ Using formatted fallback response`);
                
                // Fallback: Show top 4 options with recommendation
                const topPlaces = places.slice(0, 4);
                let response = `Great news! I found ${topPlaces.length} options near the property:\n\n`;
                
                topPlaces.forEach((place, index) => {
                    response += `${index + 1}. **${place.name}** ⭐ ${place.rating}\n`;
                    response += `   📍 Distance: ${place.distance}\n`;
                    response += `   📫 Address: ${place.address}\n\n`;
                });
                
                response += `🎯 **My Recommendation:** **${topPlaces[0].name}** is the nearest option at just ${topPlaces[0].distance} away, making it very convenient!`;
                
                this.addToHistory(sessionId, 'User', userQuery);
                this.addToHistory(sessionId, 'Agent', response);
                
                return response;
            }
        }
        
        // Handle distance/route results with LLM
        if (toolResult.data && toolResult.data.distance && toolResult.type === 'maps_distance') {
            const isRouteQuery = userQuery.toLowerCase().includes('route') || 
                                userQuery.toLowerCase().includes('way to') || 
                                userQuery.toLowerCase().includes('how to get') ||
                                userQuery.toLowerCase().includes('transport');
            
            const distancePrompt = `You are a helpful real estate assistant.

USER QUESTION: "${userQuery}"

ROUTE INFORMATION:
- From: ${propertyLocation}
- To: ${toolResult.data.destLocation || 'destination'}
- Distance: ${toolResult.data.distance}
- Travel Time: ${toolResult.data.duration}

TASK: ${isRouteQuery ? 
`Provide route and transport information:
1. State the distance and travel time clearly
2. List transport options: 🚗 Car/Taxi, 🏍️ Bike/Auto, 🚌 Bus, 🚇 Metro
3. Give practical tips for the journey` :
`Provide distance information:
1. State the distance and travel time clearly
2. Add brief context about the journey`}

IMPORTANT: Do NOT add follow-up questions like "Would you like..." or "Can I help...". Just provide the information.

Keep it friendly and conversational. Respond now:`;

            try {
                console.log(`[AGENT] 🤖 Calling LLM for distance/route response`);
                
                const response = await this.model.invoke(distancePrompt);
                
                if (!response || !response.content) {
                    throw new Error('Empty LLM response');
                }
                
                console.log(`[AGENT] ✅ LLM generated response (${response.content.length} chars)`);
                
                this.addToHistory(sessionId, 'User', userQuery);
                this.addToHistory(sessionId, 'Agent', response.content);
                
                return response.content;
                
            } catch (error) {
                console.error(`[AGENT] ❌ LLM response generation failed:`, error.message);
                console.log(`[AGENT] ⚠️ Using formatted fallback response`);
                
                // Fallback
                let response = `The distance from the property to ${toolResult.data.destLocation || 'the destination'} is approximately **${toolResult.data.distance}**. `;
                response += `The estimated travel time is around **${toolResult.data.duration}**.\n\n`;
                
                if (isRouteQuery) {
                    response += `**Transport Options:**\n`;
                    response += `🚗 Car/Taxi - Most convenient\n`;
                    response += `🏍️ Bike/Auto - Faster in traffic\n`;
                    response += `🚌 Bus - Economical option\n`;
                    response += `🚇 Metro - If available on route\n\n`;
                }
                
                response += `This makes it easily accessible from the property.`;
                
                this.addToHistory(sessionId, 'User', userQuery);
                this.addToHistory(sessionId, 'Agent', response);
                
                return response;
            }
        }

        // For property queries or errors, use LLM
        const hasError = toolResult.data && (toolResult.data.error || toolResult.data.message);

        const propertyContext = propertyInfo ? `
Property: ${propertyInfo.basic?.title || 'N/A'}
Location: ${propertyInfo.location?.address || propertyLocation}, ${propertyInfo.location?.city || 'N/A'}
` : '';

        const generalPrompt = `You are a helpful real estate assistant.

${propertyContext}

User asked: ${userQuery}

${hasError ? `
The search encountered an issue: ${toolResult.data.error || 'Unable to find results'}

Provide a helpful response explaining this and suggest alternatives.
` : `
Provide a helpful response about the property.
`}

IMPORTANT: Do NOT add follow-up questions like "Would you like..." or "Can I help...". Just provide the information directly.

Keep it brief, friendly, and helpful. Respond now:`;

        try {
            console.log(`[AGENT] 🤖 Calling LLM for general response`);
            
            const response = await this.model.invoke(generalPrompt);
            
            if (!response || !response.content) {
                throw new Error('Empty LLM response');
            }
            
            console.log(`[AGENT] ✅ LLM generated response (${response.content.length} chars)`);
            
            this.addToHistory(sessionId, 'User', userQuery);
            this.addToHistory(sessionId, 'Agent', response.content);

            return response.content;
            
        } catch (error) {
            console.error(`[AGENT] ❌ LLM response generation failed:`, error.message);
            
            // Final fallback
            const fallbackResponse = hasError ? 
                `I apologize, but I encountered an issue: ${toolResult.data.error}. Could you please try rephrasing your question?` :
                `I'm here to help you with information about the property. What would you like to know?`;
            
            this.addToHistory(sessionId, 'User', userQuery);
            this.addToHistory(sessionId, 'Agent', fallbackResponse);
            
            return fallbackResponse;
        }
    }

    /**
     * Clear session memory
     */
    clearSession(sessionId) {
        this.conversationHistories.delete(sessionId);
        console.log(`[AGENT] Cleared session: ${sessionId}`);
    }

    /**
     * Get conversation history for API endpoint
     */
    async getHistory(sessionId) {
        return this.getConversationHistory(sessionId) || [];
    }
}

module.exports = new PropertyAgent();
