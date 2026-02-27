const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is not defined in environment variables");
            return;
        }
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.1,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 1024,
            }
        });
    }

    async scoreLead(buyerProfile, propertyDetails, interactionContext) {
        try {
            const prompt = `
                Analyze the following real estate lead and provide a score from 1-100 based on "Intent to Commit".
                
                Buyer Profile: ${JSON.stringify(buyerProfile)}
                Property Details: ${JSON.stringify(propertyDetails)}
                Interaction Context: ${JSON.stringify(interactionContext)}

                Criteria:
                - Budget alignment with property price.
                - Urgency detected in messages.
                - Interaction depth (time spent, images viewed).
                - Location fit.

                Return ONLY a JSON object in this format:
                {
                    "score": number,
                    "reasoning": "short explanation",
                    "priority": "Low" | "Medium" | "High"
                }
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return JSON.parse(response.text().replace(/```json|```/g, "").trim());
        } catch (error) {
            console.error("Gemini Scoring Error:", error);
            return { score: 50, reasoning: "Error in AI analysis", priority: "Medium" };
        }
    }

    async generateEmails(buyer, seller, property, scoreInfo) {
        try {
            const prompt = `
                Generate two professional and engaging emails for a real estate lead.
                
                Lead Info: ${JSON.stringify(buyer)}
                Seller Info: ${JSON.stringify(seller)}
                Property: ${JSON.stringify(property)}
                AI Score Analysis: ${JSON.stringify(scoreInfo)}

                1. Email to Seller: Inform them about the interested buyer, include the AI score, and provide buyer details.
                2. Email to Buyer: Provide a hyper-personalized description of the property based on their profile and include seller contact details.

                Return ONLY a JSON object in this format:
                {
                    "sellerEmail": { "subject": "string", "body": "string" },
                    "buyerEmail": { "subject": "string", "body": "string" }
                }
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return JSON.parse(response.text().replace(/```json|```/g, "").trim());
        } catch (error) {
            console.error("Gemini Email Generation Error:", error);
            return null;
        }
    }
}

module.exports = new GeminiService();
