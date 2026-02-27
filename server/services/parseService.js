const { Mistral } = require('@mistralai/mistralai');

// ─── MISTRAL CLIENT ───────────────────────────────────────────────────────────
const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

// JSON Schema for property extraction
const propertySchema = {
    type: "object",
    properties: {
        title: { type: "string", description: "Property name/title" },
        propertyType: { type: "string", enum: ["Apartment", "Villa", "Plot", "Commercial", "House", "Studio", "Other"] },
        listingType: { type: "string", enum: ["Sale", "Rent", "Lease"] },
        description: { type: "string", description: "Full description including highlights and amenities" },
        address: { type: "string", description: "Full street address" },
        city: { type: "string" },
        state: { type: "string" },
        pincode: { type: "string", description: "PIN code digits only" },
        landmark: { type: "string", description: "Nearby facility or landmark" },
        price: { type: "number", description: "Price in INR (convert L/Cr: 1L=100000, 1Cr=10000000)" },
        negotiable: { type: "boolean" },
        maintenanceCharges: { type: ["number", "null"] },
        area: { type: ["number", "null"] },
        areaUnit: { type: "string", enum: ["sqft", "sqm"] },
        bedrooms: { type: ["number", "null"] },
        bathrooms: { type: ["number", "null"] },
        balconies: { type: ["number", "null"] },
        floorNumber: { type: ["number", "null"] },
        totalFloors: { type: ["number", "null"] },
        furnishingStatus: { type: "string", enum: ["Fully Furnished", "Semi Furnished", "Unfurnished"] },
        propertyAge: { type: ["number", "null"], description: "Age in years" },
        constructionStatus: { type: "string", enum: ["Ready to Move", "Under Construction", "New Construction"] },
        availableFrom: { type: ["string", "null"], description: "ISO date YYYY-MM-DD" },
        occupancyStatus: { type: "string", enum: ["Vacant", "Occupied"] },
        features: { type: "array", items: { type: "string" }, description: "Amenities like Pool, Gym, Parking" },
        vastuInfo: { type: "string", description: "Vastu compliance, orientation, energy flow details" }
    },
    required: ["title", "propertyType", "listingType", "city", "price"]
};

const EXTRACTION_PROMPT = `
Extract ALL property details from this document and return ONLY a valid JSON object matching this exact schema:

{
  "title": "string - Property name/title",
  "propertyType": "string - One of: Apartment, Villa, Plot, Commercial, House, Studio, Other",
  "listingType": "string - One of: Sale, Rent, Lease",
  "description": "string - Full description including highlights and amenities",
  "address": "string - Full street address",
  "city": "string",
  "state": "string",
  "pincode": "string - PIN code digits only",
  "landmark": "string - Nearby facility or landmark",
  "price": "number - Price in INR",
  "negotiable": "boolean",
  "maintenanceCharges": "number or null",
  "area": "number or null",
  "areaUnit": "string - sqft or sqm",
  "bedrooms": "number or null",
  "bathrooms": "number or null",
  "balconies": "number or null",
  "floorNumber": "number or null",
  "totalFloors": "number or null",
  "furnishingStatus": "string - One of: Fully Furnished, Semi Furnished, Unfurnished",
  "propertyAge": "number or null - Age in years",
  "constructionStatus": "string - One of: Ready to Move, Under Construction, New Construction",
  "availableFrom": "string or null - ISO date YYYY-MM-DD",
  "occupancyStatus": "string - One of: Vacant, Occupied",
  "features": "array of strings - Amenities like Pool, Gym, Parking",
  "vastuInfo": "string - Vastu compliance, orientation, energy flow details"
}

CONVERSION RULES:

PRICE CONVERSION:
- "₹85L" or "85 Lakhs" = 8500000
- "₹1.2Cr" or "1.2 Crore" = 12000000
- "₹2.5 Crore" = 25000000
- 1 Lakh (L) = 100,000
- 1 Crore (Cr) = 10,000,000

AREA CONVERSION:
- "1200 sq.ft" or "1200 sqft" → area: 1200, areaUnit: "sqft"
- "100 sq.m" or "100 sqm" → area: 100, areaUnit: "sqm"

BEDROOM EXTRACTION:
- "3BHK" or "3 BHK" → bedrooms: 3
- "2BHK" → bedrooms: 2
- "Studio" → bedrooms: 0

LISTING TYPE:
- "for sale", "sell", "selling" → "Sale"
- "for rent", "rental", "rent" → "Rent"  
- "lease", "leasing" → "Lease"

PROPERTY TYPE:
- Map to one of: Apartment, Villa, Plot, Commercial, House, Studio, Other

FURNISHING:
- Map to: "Fully Furnished", "Semi Furnished", or "Unfurnished"

CONSTRUCTION STATUS:
- Map to: "Ready to Move", "Under Construction", or "New Construction"

FEATURES:
- Extract amenities as array: ["Pool", "Gym", "Parking", "Security", "Garden", etc.]

MISSING VALUES:
- Use null for missing numbers/dates
- Use empty string "" for missing text fields
- Use empty array [] for missing features

IMPORTANT: Return ONLY the JSON object, no additional text or explanation.
`;

// ─── SAFE JSON PARSE ──────────────────────────────────────────────────────────
function safeParseJSON(text) {
    try {
        // First, try direct parse (Gemini with responseSchema should return clean JSON)
        try {
            const parsed = JSON.parse(text);
            console.log('[PARSE] Direct JSON parse successful');
            return parsed;
        } catch (directErr) {
            console.log('[PARSE] Direct parse failed, attempting cleanup...');
        }

        // Remove markdown code blocks and extra whitespace
        let cleaned = text
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .replace(/^\s+|\s+$/g, '')
            .trim();

        // Try parsing cleaned version
        try {
            const parsed = JSON.parse(cleaned);
            console.log('[PARSE] Cleaned JSON parse successful');
            return parsed;
        } catch (cleanErr) {
            console.log('[PARSE] Cleaned parse failed, extracting JSON object...');
        }

        // Extract JSON object from text
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');

        if (start === -1 || end === -1) {
            console.error('[PARSE] No JSON object found in response');
            console.error('[PARSE] Response text:', text.slice(0, 500));
            return null;
        }

        const jsonStr = cleaned.slice(start, end + 1);
        const parsed = JSON.parse(jsonStr);
        console.log('[PARSE] Extracted JSON parse successful');
        return parsed;

    } catch (e) {
        console.error('[PARSE] All JSON parse attempts failed:', e.message);
        console.error('[PARSE] Original text (first 1000 chars):', text.slice(0, 1000));
        return null;
    }
}

// ─── COUNT POPULATED FIELDS ───────────────────────────────────────────────────
function countPopulated(obj) {
    return Object.values(obj).filter(v => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)).length;
}

// ─── MODE 1: PDF → MISTRAL OCR WITH JSON SCHEMA ──────────────────────────────
async function parsePDFWithMistral(fileBuffer, mimeType = 'application/pdf') {
    const base64 = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log('[PARSE] Mode: PDF_UPLOAD | Starting Mistral OCR with JSON schema...');

    try {
        // Use Mistral OCR with structured output
        const ocrResponse = await mistral.ocr.process({
            model: 'mistral-ocr-latest',
            document: {
                type: 'document_url',
                documentUrl: dataUrl
            },
            prompt: EXTRACTION_PROMPT
        });

        console.log('[PARSE] Mistral OCR response received');
        console.log('[PARSE] Response structure:', JSON.stringify(Object.keys(ocrResponse), null, 2));

        // Extract text from OCR response
        let extractedText = '';

        if (ocrResponse.pages && Array.isArray(ocrResponse.pages)) {
            extractedText = ocrResponse.pages
                .map(p => p.markdown || p.text || '')
                .join('\n');
            console.log('[PARSE] Extracted text from pages');
        } else if (ocrResponse.text) {
            extractedText = ocrResponse.text;
            console.log('[PARSE] Extracted text from response.text');
        } else if (typeof ocrResponse === 'string') {
            extractedText = ocrResponse;
            console.log('[PARSE] Response is string');
        }

        if (!extractedText || extractedText.length < 50) {
            console.error('[PARSE] Insufficient text extracted from OCR');
            console.error('[PARSE] Text length:', extractedText.length);
            return {
                success: false,
                data: {},
                fieldsPopulated: 0,
                total: Object.keys(propertySchema.properties).length,
                source: 'MISTRAL_OCR',
                error: 'Insufficient text extracted from document'
            };
        }

        console.log(`[PARSE] OCR extracted ${extractedText.length} characters`);
        console.log(`[PARSE] First 200 chars:`, extractedText.slice(0, 200));

        // Use Mistral Chat to structure the raw OCR text into JSON
        console.log('[PARSE] Passing OCR text to Mistral Chat for JSON structuring...');
        const chatResponse = await mistral.chat.complete({
            model: 'mistral-large-latest',
            messages: [
                {
                    role: 'system',
                    content: EXTRACTION_PROMPT
                },
                {
                    role: 'user',
                    content: `Extract ALL property details from this OCR text and return strictly a valid JSON object matching the schema:\n\n${extractedText}`
                }
            ],
            responseFormat: {
                type: 'json_object'
            }
        });

        const responseContent = chatResponse.choices?.[0]?.message?.content;

        if (!responseContent) {
            console.error('[PARSE] No content in Mistral chat response after OCR');
            return {
                success: false,
                data: {},
                fieldsPopulated: 0,
                total: Object.keys(propertySchema.properties).length,
                source: 'MISTRAL_OCR_CHAT',
                error: 'No content in structuring response'
            };
        }

        // Parse the JSON from the AI response
        const parsed = safeParseJSON(responseContent);

        if (!parsed) {
            console.error('[PARSE] Failed to parse JSON from structured text');
            console.error('[PARSE] Text sample:', responseContent.slice(0, 500));
            return {
                success: false,
                data: {},
                fieldsPopulated: 0,
                total: Object.keys(propertySchema.properties).length,
                source: 'MISTRAL_OCR_CHAT',
                error: 'Failed to parse JSON from AI output'
            };
        }

        // Validate and clean the data
        const cleanedData = validateAndCleanData(parsed);
        const fieldsPopulated = countPopulated(cleanedData);

        console.log(`[PARSE] Mistral OCR: SUCCESS | ${fieldsPopulated}/${Object.keys(propertySchema.properties).length} fields populated`);
        console.log(`[PARSE] Populated fields:`, Object.keys(cleanedData).filter(k => cleanedData[k] !== null && cleanedData[k] !== '' && !(Array.isArray(cleanedData[k]) && cleanedData[k].length === 0)));

        return {
            success: true,
            data: cleanedData,
            fieldsPopulated,
            total: Object.keys(propertySchema.properties).length,
            source: 'MISTRAL_OCR'
        };

    } catch (mistralErr) {
        console.error(`[PARSE] Mistral OCR FAILED: ${mistralErr.message}`);
        console.error(`[PARSE] Full error:`, mistralErr);
        return {
            success: false,
            data: {},
            fieldsPopulated: 0,
            total: Object.keys(propertySchema.properties).length,
            source: 'MISTRAL_OCR',
            error: mistralErr.message
        };
    }
}

// ─── MODE 2: TEXT → MISTRAL CHAT WITH JSON SCHEMA ────────────────────────────
async function parseTextWithMistral(userText) {
    console.log(`[PARSE] Mode: TEXT/STT_INPUT | chars=${userText.length} | Sending to Mistral...`);

    try {
        const chatResponse = await mistral.chat.complete({
            model: 'mistral-large-latest',
            messages: [
                {
                    role: 'system',
                    content: EXTRACTION_PROMPT
                },
                {
                    role: 'user',
                    content: `Extract property details from this text:\n\n${userText}`
                }
            ],
            responseFormat: {
                type: 'json_object'
            }
        });

        console.log('[PARSE] Mistral chat response received');

        // Extract the content from chat response
        const responseContent = chatResponse.choices?.[0]?.message?.content;

        if (!responseContent) {
            console.error('[PARSE] No content in Mistral chat response');
            return {
                success: false,
                data: {},
                fieldsPopulated: 0,
                total: Object.keys(propertySchema.properties).length,
                source: 'MISTRAL_CHAT',
                error: 'No content in response'
            };
        }

        // Parse the JSON response
        const parsed = safeParseJSON(responseContent);

        if (!parsed) {
            console.error('[PARSE] Failed to parse JSON from Mistral response');
            return {
                success: false,
                data: {},
                fieldsPopulated: 0,
                total: Object.keys(propertySchema.properties).length,
                source: 'MISTRAL_CHAT',
                error: 'Failed to parse JSON response'
            };
        }

        // Validate and clean the data
        const cleanedData = validateAndCleanData(parsed);
        const fieldsPopulated = countPopulated(cleanedData);

        console.log(`[PARSE] Mistral Chat: SUCCESS | ${fieldsPopulated}/${Object.keys(propertySchema.properties).length} fields populated`);

        return {
            success: true,
            data: cleanedData,
            fieldsPopulated,
            total: Object.keys(propertySchema.properties).length,
            source: 'MISTRAL_CHAT'
        };

    } catch (mistralErr) {
        console.error(`[PARSE] Mistral Chat FAILED: ${mistralErr.message}`);
        console.error(`[PARSE] Full error:`, mistralErr);
        return {
            success: false,
            data: {},
            fieldsPopulated: 0,
            total: Object.keys(propertySchema.properties).length,
            source: 'MISTRAL_CHAT',
            error: mistralErr.message
        };
    }
}

// ─── VALIDATE AND CLEAN DATA ──────────────────────────────────────────────────
function validateAndCleanData(data) {
    const cleaned = {};

    // Ensure all schema fields exist
    Object.keys(propertySchema.properties).forEach(key => {
        const value = data[key];

        // Handle null/undefined
        if (value === null || value === undefined) {
            cleaned[key] = null;
            return;
        }

        // Handle empty strings
        if (typeof value === 'string' && value.trim() === '') {
            cleaned[key] = '';
            return;
        }

        // Handle arrays
        if (Array.isArray(value)) {
            cleaned[key] = value.filter(v => v !== null && v !== undefined && v !== '');
            return;
        }

        // Handle numbers - ensure they're actually numbers
        if (typeof value === 'string' && ['price', 'maintenanceCharges', 'area', 'bedrooms', 'bathrooms', 'balconies', 'floorNumber', 'totalFloors', 'propertyAge'].includes(key)) {
            const num = parseFloat(value);
            cleaned[key] = isNaN(num) ? null : num;
            return;
        }

        // Handle booleans
        if (key === 'negotiable') {
            cleaned[key] = Boolean(value);
            return;
        }

        // Default: keep the value as-is
        cleaned[key] = value;
    });

    return cleaned;
}

async function generatePropertySummary(property) {
    console.log(`[SUMMARY] Generating AI Broker Summary for: ${property.title}...`);
    const prompt = `You are a professional real estate broker in India. 
Create a compelling 4-6 line summary for the following property.

PROPERTY DATA:
- Title: ${property.title}
- Type: ${property.propertyType}
- Listing: ${property.listingType}
- Price: ₹${property.price?.toLocaleString()}
- Area: ${property.area} ${property.areaUnit}
- Location: ${property.location}, ${property.city}
- Features: ${property.features?.join(', ')}
- Vastu: ${property.vastuInfo || 'Not specified'}

RESPONSE STRUCTURE:
1. A hook about the property's unique value.
2. "Suitable For:" segment identifying the target buyer/tenant.
3. "Usage:" segment suggesting the best way to utilize the space.
4. A mention of Vastu insights based on the provided info.

Keep it professional, upscale, and persuasive. Do NOT use markdown bolding in the response body, just plain text with newlines.`;

    try {
        const chatResponse = await mistral.chat.complete({
            model: 'mistral-large-latest',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            maxTokens: 500
        });

        const summary = chatResponse.choices?.[0]?.message?.content?.trim();

        if (!summary) {
            console.error('[SUMMARY] No content in Mistral response');
            return "I'm currently analyzing the market potential of this property. Check back shortly for my professional broker insights.";
        }

        console.log(`[SUMMARY] Generation SUCCESS`);
        return summary;
    } catch (err) {
        console.error(`[SUMMARY] Generation FAILED: ${err.message}`);
        return "I'm currently analyzing the market potential of this property. Check back shortly for my professional broker insights.";
    }
}

module.exports = { parsePDFWithMistral, parseTextWithMistral, generatePropertySummary };
