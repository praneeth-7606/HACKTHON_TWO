const { GoogleGenerativeAI } = require('@google/generative-ai');
const Property = require('../models/Property');

/**
 * Smart Property Search Agent
 * Uses LLM to extract filters from natural language and MongoDB for fast queries
 */
class PropertySearchAgent {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 512,
            }
        });
        console.log('[SEARCH_AGENT] Initialized with Gemini 2.5 Flash');
    }

    /**
     * Main search method - converts natural language to property results
     */
    async search(userQuery) {
        try {
            console.log(`[SEARCH_AGENT] Query: "${userQuery}"`);
            
            // Step 1: Extract structured filters from natural language
            const filters = await this.extractFilters(userQuery);
            console.log(`[SEARCH_AGENT] Extracted filters:`, JSON.stringify(filters, null, 2));
            
            // Step 2: Build MongoDB query
            const mongoQuery = this.buildMongoQuery(filters);
            console.log(`[SEARCH_AGENT] MongoDB query:`, JSON.stringify(mongoQuery, null, 2));
            
            // Step 3: Execute query with proper sorting
            const properties = await Property.find(mongoQuery)
                .populate('seller', 'name email phoneNumber profession')
                .sort(this.buildSortCriteria(filters))
                .limit(20)
                .lean();
            
            console.log(`[SEARCH_AGENT] Found ${properties.length} properties`);
            
            // Step 4: Rank and filter results
            const rankedProperties = this.rankProperties(properties, filters);
            
            return {
                success: true,
                count: rankedProperties.length,
                properties: rankedProperties.slice(0, 10), // Return top 10
                filters: filters,
                query: userQuery
            };
            
        } catch (error) {
            console.error('[SEARCH_AGENT] Error:', error.message);
            return {
                success: false,
                error: error.message,
                properties: [],
                count: 0
            };
        }
    }

    /**
     * Extract structured filters from natural language using LLM
     */
    async extractFilters(query) {
        const prompt = `Extract property search filters from this query. Return ONLY valid JSON, no markdown, no explanation.

Query: "${query}"

Return this exact JSON structure:
{
  "bedrooms": 2,
  "propertyType": "Apartment",
  "listingType": "Sale",
  "minPrice": 6000000,
  "maxPrice": 7000000,
  "location": "Marathahalli",
  "minArea": null,
  "maxArea": null
}

Rules:
- bedrooms: number or null
- propertyType: "Apartment" | "Villa" | "Plot" | "Commercial" | null
- listingType: "Sale" | "Rent" | "Lease" | null
- minPrice/maxPrice: number in rupees or null
- location: city/area name or null
- minArea/maxArea: number in sqft or null

Examples:
"2 BHK in Marathahalli 60-70 lakhs" → {"bedrooms":2,"propertyType":"Apartment","listingType":"Sale","minPrice":6000000,"maxPrice":7000000,"location":"Marathahalli","minArea":null,"maxArea":null}

"3 bedroom villa in Whitefield for rent" → {"bedrooms":3,"propertyType":"Villa","listingType":"Rent","minPrice":null,"maxPrice":null,"location":"Whitefield","minArea":null,"maxArea":null}

"home in marathahalli" → {"bedrooms":null,"propertyType":"Apartment","listingType":null,"minPrice":null,"maxPrice":null,"location":"Marathahalli","minArea":null,"maxArea":null}

Now extract from: "${query}"

JSON only:`;

        try {
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            
            console.log(`[SEARCH_AGENT] Raw LLM response: ${responseText.substring(0, 200)}`);
            
            // Aggressive cleaning
            let cleaned = responseText.trim();
            
            // Remove markdown code blocks
            cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
            
            // Remove any text before first { and after last }
            const firstBrace = cleaned.indexOf('{');
            const lastBrace = cleaned.lastIndexOf('}');
            
            if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
                throw new Error('No valid JSON object found in response');
            }
            
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
            
            console.log(`[SEARCH_AGENT] Cleaned JSON: ${cleaned}`);
            
            const filters = JSON.parse(cleaned);
            
            // Validate and set defaults
            return {
                bedrooms: filters.bedrooms || null,
                propertyType: filters.propertyType || null,
                listingType: filters.listingType || null,
                minPrice: filters.minPrice || null,
                maxPrice: filters.maxPrice || null,
                location: filters.location || null,
                minArea: filters.minArea || null,
                maxArea: filters.maxArea || null
            };
            
        } catch (error) {
            console.error('[SEARCH_AGENT] Filter extraction failed:', error.message);
            
            // Fallback: Basic keyword extraction
            return this.fallbackExtraction(query);
        }
    }

    /**
     * Fallback filter extraction using keywords
     */
    fallbackExtraction(query) {
        const queryLower = query.toLowerCase();
        const filters = {
            bedrooms: null,
            propertyType: null,
            listingType: null,
            minPrice: null,
            maxPrice: null,
            location: null,
            minArea: null,
            maxArea: null
        };
        
        // Extract bedrooms
        const bedroomMatch = queryLower.match(/(\d+)\s*(?:bhk|bedroom|bed)/i);
        if (bedroomMatch) filters.bedrooms = parseInt(bedroomMatch[1]);
        
        // Extract property type
        if (queryLower.includes('apartment') || queryLower.includes('flat')) filters.propertyType = 'Apartment';
        if (queryLower.includes('villa') || queryLower.includes('house') || queryLower.includes('home')) filters.propertyType = 'Villa';
        if (queryLower.includes('plot') || queryLower.includes('land')) filters.propertyType = 'Plot';
        if (queryLower.includes('commercial') || queryLower.includes('office')) filters.propertyType = 'Commercial';
        
        // Extract listing type
        if (queryLower.includes('rent')) filters.listingType = 'Rent';
        if (queryLower.includes('lease')) filters.listingType = 'Lease';
        if (queryLower.includes('sale') || queryLower.includes('buy')) filters.listingType = 'Sale';
        
        // Extract price (lakhs/crores)
        const lakhMatch = queryLower.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:lakh|lac|l)/i);
        if (lakhMatch) {
            filters.minPrice = parseInt(lakhMatch[1]) * 100000;
            if (lakhMatch[2]) filters.maxPrice = parseInt(lakhMatch[2]) * 100000;
        }
        
        // Handle "under X lakhs" pattern
        const underLakhMatch = queryLower.match(/under\s+(\d+)\s*(?:lakh|lac|l)/i);
        if (underLakhMatch) {
            filters.maxPrice = parseInt(underLakhMatch[1]) * 100000;
            filters.minPrice = null; // Clear minPrice for "under" queries
        }
        
        const croreMatch = queryLower.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*(?:crore|cr)/i);
        if (croreMatch) {
            filters.minPrice = parseFloat(croreMatch[1]) * 10000000;
            if (croreMatch[2]) filters.maxPrice = parseFloat(croreMatch[2]) * 10000000;
        }
        
        // Handle "under X crore" pattern
        const underCroreMatch = queryLower.match(/under\s+(\d+(?:\.\d+)?)\s*(?:crore|cr)/i);
        if (underCroreMatch) {
            filters.maxPrice = parseFloat(underCroreMatch[1]) * 10000000;
            filters.minPrice = null; // Clear minPrice for "under" queries
        }
        
        // Extract location (common Bangalore areas)
        const locations = ['marathahalli', 'marathalli', 'whitefield', 'koramangala', 'indiranagar', 'hsr', 'electronic city', 'sarjapur', 'bellandur', 'bangalore', 'bengaluru'];
        for (const loc of locations) {
            if (queryLower.includes(loc)) {
                filters.location = loc.charAt(0).toUpperCase() + loc.slice(1);
                break;
            }
        }
        
        // Also try to extract any word that looks like a location (after "in")
        if (!filters.location) {
            const inMatch = queryLower.match(/\bin\s+([a-z]+(?:\s+[a-z]+)?)/i);
            if (inMatch) {
                filters.location = inMatch[1].trim().charAt(0).toUpperCase() + inMatch[1].trim().slice(1);
            }
        }
        
        console.log('[SEARCH_AGENT] Fallback extraction:', filters);
        return filters;
    }

    /**
     * Build MongoDB query from extracted filters
     */
    buildMongoQuery(filters) {
        const query = {};
        
        if (filters.bedrooms) {
            query.bedrooms = filters.bedrooms;
        }
        
        if (filters.propertyType) {
            query.propertyType = filters.propertyType;
        }
        
        if (filters.listingType) {
            query.listingType = filters.listingType;
        }
        
        if (filters.minPrice || filters.maxPrice) {
            query.price = {};
            if (filters.minPrice) query.price.$gte = filters.minPrice;
            if (filters.maxPrice) query.price.$lte = filters.maxPrice;
        }
        
        if (filters.location) {
            // Search in multiple location fields with proper regex
            const locationRegex = new RegExp(filters.location, 'i');
            query.$or = [
                { city: locationRegex },
                { location: locationRegex },
                { address: locationRegex }
            ];
        }
        
        if (filters.minArea || filters.maxArea) {
            query.area = {};
            if (filters.minArea) query.area.$gte = filters.minArea;
            if (filters.maxArea) query.area.$lte = filters.maxArea;
        }
        
        return query;
    }

    /**
     * Build sort criteria based on filters
     */
    buildSortCriteria(filters) {
        // Default: Sort by creation date (newest first)
        const sort = { createdAt: -1 };
        
        // If price filter exists, sort by price
        if (filters.minPrice || filters.maxPrice) {
            sort.price = 1; // Ascending (cheapest first)
        }
        
        return sort;
    }

    /**
     * Rank properties based on relevance to user query
     */
    rankProperties(properties, filters) {
        return properties.map(property => {
            let score = 0;
            
            // Exact matches get higher scores
            if (filters.bedrooms && property.bedrooms === filters.bedrooms) score += 10;
            if (filters.propertyType && property.propertyType === filters.propertyType) score += 10;
            if (filters.listingType && property.listingType === filters.listingType) score += 10;
            
            // Price match
            if (filters.minPrice && filters.maxPrice) {
                if (property.price >= filters.minPrice && property.price <= filters.maxPrice) {
                    score += 15; // Perfect price match
                } else if (property.price < filters.maxPrice * 1.2) {
                    score += 5; // Close to budget
                }
            }
            
            // Location match
            if (filters.location) {
                const locationLower = filters.location.toLowerCase();
                if (property.city?.toLowerCase().includes(locationLower) ||
                    property.location?.toLowerCase().includes(locationLower) ||
                    property.address?.toLowerCase().includes(locationLower)) {
                    score += 15;
                }
            }
            
            // Boost properties with more engagement
            score += (property.likes?.length || 0) * 0.5;
            score += (property.comments?.length || 0) * 0.3;
            
            return { ...property, relevanceScore: score };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
}

module.exports = new PropertySearchAgent();
