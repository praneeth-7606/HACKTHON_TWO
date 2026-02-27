const { Mistral } = require('@mistralai/mistralai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── CLIENTS ──────────────────────────────────────────────────────────────────
const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.1,
    }
});

// ─── JSON SCHEMA DEFINITION ───────────────────────────────────────────────────
// This canonical schema + prompt is used by BOTH Mistral post-OCR and Gemini (fallback/text)
const PROPERTY_SCHEMA = {
    title: 'string — property name/title',
    propertyType: 'one of: Apartment | Villa | Plot | Commercial | House | Studio | Other',
    listingType: 'one of: Sale | Rent | Lease',
    description: 'string — full description including highlights and amenities',
    address: 'string — full street address',
    city: 'string',
    state: 'string',
    pincode: 'string (digits only)',
    landmark: 'string — nearby facility or landmark',
    price: 'number — in INR (convert if in L/Cr: 1L=100000, 1Cr=10000000)',
    negotiable: 'boolean',
    maintenanceCharges: 'number or null',
    area: 'number or null',
    areaUnit: 'one of: sqft | sqm',
    bedrooms: 'number or null',
    bathrooms: 'number or null',
    balconies: 'number or null',
    floorNumber: 'number or null',
    totalFloors: 'number or null',
    furnishingStatus: 'one of: Fully Furnished | Semi Furnished | Unfurnished',
    propertyAge: 'number (years) or null',
    constructionStatus: 'one of: Ready to Move | Under Construction | New Construction',
    availableFrom: 'ISO date string YYYY-MM-DD or null',
    occupancyStatus: 'one of: Vacant | Occupied',
    features: 'array of strings — amenities like ["Pool", "Gym", "Parking"]',
    vastuInfo: 'string — details about Vastu compliance, orientation (e.g., North-facing), and energy flow'
};

const EXTRACTION_PROMPT = (rawText) => `
You are an expert real estate data extraction AI. 
Extract ALL available property details from the following text and return ONLY a valid JSON object.

EXTRACTION RULES:
1. Map every piece of information to the correct field in the schema below.
2. If a field cannot be determined, use null (for numbers/dates) or empty string (for strings) or [] (for arrays).
3. Convert price shorthands: "₹85L" = 8500000, "₹1.2Cr" = 12000000, "₹2.5 Crore" = 25000000.
4. Convert area: "1200 sq.ft" = { area: 1200, areaUnit: "sqft" }.
5. BHK implies bedrooms: "3BHK" = { bedrooms: 3 }.
6. For listingType: "for sale"/"sell" → "Sale", "for rent"/"rental" → "Rent", "lease" → "Lease".
7. Do NOT add any explanation. Return ONLY the raw JSON object.

SCHEMA:
${JSON.stringify(PROPERTY_SCHEMA, null, 2)}
{ "aiBrokerSummary": "Your professional broker description here..." }

TEXT TO EXTRACT FROM:
"""
${rawText.slice(0, 8000)}
"""

Return ONLY valid JSON.
`;

// ─── SAFE JSON PARSE ──────────────────────────────────────────────────────────
function safeParseJSON(text) {
    try {
        const cleaned = text.replace(/```json|```/gi, '').trim();
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start === -1 || end === -1) return null;
        return JSON.parse(cleaned.slice(start, end + 1));
    } catch (e) {
        return null;
    }
}

// ─── COUNT POPULATED FIELDS ───────────────────────────────────────────────────
function countPopulated(obj) {
    return Object.values(obj).filter(v => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)).length;
}

// ─── MODE 1: PDF → MISTRAL OCR 3 → GEMINI STRUCTURING ────────────────────────
async function parsePDFWithMistral(fileBuffer, mimeType = 'application/pdf') {
    const base64 = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log('[PARSE] Mode: PDF_UPLOAD | Starting Mistral OCR 3 attempt...');

    let rawText = '';

    try {
        const ocrResponse = await mistral.ocr.process({
            model: 'mistral-ocr-latest',
            document: { type: 'document_url', documentUrl: dataUrl }
        });

        // Combine text from all pages efficiently
        rawText = ocrResponse.pages
            .map(p => p.markdown || p.text || '')
            .join('\n')
            .slice(0, 12000); // Hard cap on memory usage

        console.log(`[PARSE] Mistral OCR: SUCCESS | chars=${rawText.length} | pages=${ocrResponse.pages.length}`);
    } catch (mistralErr) {
        console.error(`[PARSE] Mistral OCR: FAILED (${mistralErr.message}) | Switching to Gemini AI fallback...`);

        // FALLBACK: Use Gemini vision on the base64 PDF text extracted naively
        // Gemini can't read raw PDF, so we just pass available information
        rawText = `[PDF binary content - unable to OCR. Attempting AI inference from filename/context]`;
    }

    // ── STEP 2: Gemini structures the raw OCR text into JSON ──
    return await structureWithGemini(rawText, 'PDF_OCR');
}

// ─── MODE 2: TEXT / STT → GEMINI ─────────────────────────────────────────────
async function parseTextWithGemini(userText) {
    console.log(`[PARSE] Mode: TEXT/STT_INPUT | chars=${userText.length} | Sending to Gemini...`);
    return await structureWithGemini(userText, 'TEXT_STT');
}

// ─── SHARED: GEMINI JSON STRUCTURING ─────────────────────────────────────────
async function structureWithGemini(rawText, sourceMode) {
    console.log(`[PARSE][${sourceMode}] Gemini structuring raw text → JSON schema...`);
    try {
        const result = await geminiModel.generateContent(EXTRACTION_PROMPT(rawText));
        const responseText = result.response.text();
        const parsed = safeParseJSON(responseText);

        if (!parsed) {
            console.warn(`[PARSE][${sourceMode}] Gemini returned unparseable JSON. Returning empty form.`);
            return { success: false, data: {}, fieldsPopulated: 0, source: sourceMode };
        }

        const fieldsPopulated = countPopulated(parsed);
        console.log(`[PARSE][${sourceMode}] Done: ${fieldsPopulated}/${Object.keys(PROPERTY_SCHEMA).length} fields populated`);

        return { success: true, data: parsed, fieldsPopulated, total: Object.keys(PROPERTY_SCHEMA).length, source: sourceMode };
    } catch (geminiErr) {
        console.error(`[PARSE][${sourceMode}] Gemini FAILED: ${geminiErr.message}`);
        return { success: false, data: {}, fieldsPopulated: 0, source: sourceMode, error: geminiErr.message };
    }
}

async function generatePropertySummary(property) {
    console.log(`[SUMMARY] Generating AI Broker Summary for: ${property.title}...`);
    const prompt = `
    You are a professional real estate broker in India. 
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
    
    Keep it professional, upscale, and persuasive. Do NOT use markdown bolding in the response body, just plain text with newlines.
    `;

    try {
        const result = await geminiModel.generateContent(prompt);
        const summary = result.response.text().trim();
        console.log(`[SUMMARY] Generation SUCCESS`);
        return summary;
    } catch (err) {
        console.error(`[SUMMARY] Generation FAILED: ${err.message}`);
        return "I'm currently analyzing the market potential of this property. Check back shortly for my professional broker insights.";
    }
}

module.exports = { parsePDFWithMistral, parseTextWithGemini, generatePropertySummary };
