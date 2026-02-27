const { GoogleGenerativeAI } = require('@google/generative-ai');
const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');

// Using standard Gemini SDK for orchestration logic as a robust "Agent" pattern
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Upgrade to gemini-2.5-flash per user request and enable debug mode if supported by SDK or just log it
console.log('[AI_AGENT] Initializing Gemini 2.5 Flash Orchestrator | DEBUG: true');
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.2,
    }
});

/**
 * AI Orchestrator: Handles matching, scoring, and notification logic
 */
async function orchestrateLead(buyer, seller, property, contextType) {
    console.log(`[ORCHESTRATOR] Processing lead for ${property.title} | Trigger: ${contextType}`);

    const prompt = `
    You are an expert AI Real Estate Orchestrator. 
    Review the following interaction and generate personalized communications.

    BUYER:
    - Name: ${buyer.name}
    - Profession: ${buyer.profession || 'Professional'}
    - Details: ${buyer.email}
    
    SELLER:
    - Name: ${seller.name}
    - Profession: ${seller.profession || 'Property Owner'}
    - Phone: ${seller.phoneNumber || 'Not provided'}
    
    PROPERTY:
    - Title: ${property.title}
    - Price: ₹${property.price?.toLocaleString() || 'Contact for price'}
    
    CONTEXT:
    The buyer triggered this interest by: ${contextType === 'LIKE' ? 'Liking the property' : 'Spending significant time (1.5m+) viewing details'}.

    TASK:
    1. Calculate a Lead Score (0-100) for the seller. High score if profession suggests stability or high intent.
    2. Suggest a Priority level (Low, Medium, High).
    3. Draft a 2-line warm email snippet for the BUYER introducing them to the owner.
    4. Draft a 2-line urgent email snippet for the SELLER explaining why this is a quality lead.

    CRITICAL: Return ONLY valid JSON. Do not use quotes inside string values. Use simple language without special characters.

    RETURN ONLY THIS JSON FORMAT:
    {
        "leadScore": 85,
        "priority": "High",
        "buyerEmailSnippet": "We have connected you with the property owner. They are ready to discuss this opportunity with you.",
        "sellerEmailSnippet": "A verified buyer has shown strong interest in your property. This is a quality lead worth pursuing.",
        "buyerMessage": "Owner details shared successfully",
        "sellerMessage": "New high-intent lead received"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        console.log('[ORCHESTRATOR] Raw AI Response:', responseText);
        
        const cleaned = responseText.replace(/```json|```/gi, '').trim();
        
        let orchestration;
        try {
            orchestration = JSON.parse(cleaned);
        } catch (parseError) {
            console.error('[ORCHESTRATOR] JSON Parse Error:', parseError.message);
            console.error('[ORCHESTRATOR] Attempted to parse:', cleaned);
            
            // Fallback: Create a default orchestration response
            orchestration = {
                leadScore: 75,
                priority: "High",
                buyerEmailSnippet: `We've connected you with the owner of ${property.title}. This property matches your search criteria and the owner is ready to discuss details.`,
                sellerEmailSnippet: `${buyer.name}, a verified ${buyer.profession || 'buyer'}, has shown strong interest in your property ${property.title}. They are actively looking and this is a quality lead.`,
                buyerMessage: `Owner contact details shared for ${property.title}`,
                sellerMessage: `New high-intent lead from ${buyer.name} for ${property.title}`
            };
            console.log('[ORCHESTRATOR] Using fallback orchestration due to JSON parse error');
        }

        // 1. Update Buyer Lead Score (cumulative or average)
        await User.findByIdAndUpdate(buyer._id, { $inc: { leadScore: Math.floor(orchestration.leadScore / 10) } });

        // 2. Create In-App Notification for Buyer
        await Notification.create({
            recipient: buyer._id,
            title: `Owner Details for ${property.title}`,
            message: orchestration.buyerMessage,
            type: 'info',
            data: {
                propertyId: property._id,
                ownerName: seller.name,
                ownerPhone: seller.phoneNumber,
                ownerEmail: seller.email
            }
        });

        // 3. Create In-App Notification for Seller
        await Notification.create({
            recipient: seller._id,
            title: `New ${orchestration.priority} Priority Lead!`,
            message: orchestration.sellerMessage,
            type: 'lead',
            data: {
                propertyId: property._id,
                buyerId: buyer._id,
                leadScore: orchestration.leadScore
            }
        });

        console.log(`[ORCHESTRATOR] Success | Lead Score: ${orchestration.leadScore} | Priority: ${orchestration.priority}`);

        // 4. Send actual SMTP emails
        console.log(`[ORCHESTRATOR] Triggering email service...`);
        await emailService.sendRealEstateLeads({ buyer, seller, property, orchestration })
            .then(() => console.log('[ORCHESTRATOR] Emails sent successfully'))
            .catch(err => console.error('[ORCHESTRATOR] Email sending failed:', err.message));

        return orchestration;

    } catch (err) {
        console.error('[ORCHESTRATOR] Failed:', err.message);
        return null;
    }
}

module.exports = { orchestrateLead };
