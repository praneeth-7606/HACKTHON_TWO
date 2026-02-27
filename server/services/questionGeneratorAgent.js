const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Question Generator Agent
 * Generates contextual questions for sellers based on property details
 */
class QuestionGeneratorAgent {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.8, // Higher for more creative questions
                maxOutputTokens: 2048,
            }
        });
        console.log('[QUESTION_AGENT] Initialized with Gemini 2.5 Flash');
    }

    /**
     * Generate contextual questions based on property details
     */
    async generateQuestions(property) {
        try {
            console.log(`[QUESTION_AGENT] Generating questions for property: ${property.title}`);
            
            const prompt = this.buildPrompt(property);
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            
            console.log(`[QUESTION_AGENT] Raw response: ${responseText.substring(0, 200)}...`);
            
            // Clean and parse JSON
            let cleaned = responseText.trim();
            cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
            
            const firstBrace = cleaned.indexOf('[');
            const lastBrace = cleaned.lastIndexOf(']');
            
            if (firstBrace === -1 || lastBrace === -1) {
                throw new Error('No valid JSON array found in response');
            }
            
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
            
            const questions = JSON.parse(cleaned);
            
            console.log(`[QUESTION_AGENT] Generated ${questions.length} questions`);
            
            // Validate and format questions
            return questions.map(q => ({
                question: q.question,
                category: q.category || 'General',
                askedAt: new Date(),
                answer: null,
                answeredAt: null
            }));
            
        } catch (error) {
            console.error('[QUESTION_AGENT] Error generating questions:', error.message);
            
            // Fallback to default questions
            return this.getDefaultQuestions(property);
        }
    }

    /**
     * Build intelligent prompt based on property details
     */
    buildPrompt(property) {
        const priceFormatted = property.price >= 10000000 
            ? `₹${(property.price / 10000000).toFixed(1)} Crore` 
            : `₹${(property.price / 100000).toFixed(1)} Lakh`;

        return `You are an expert real estate advisor. A seller just listed this property:

PROPERTY DETAILS:
- Type: ${property.propertyType}
- Listing: ${property.listingType}
- Price: ${priceFormatted}
- Location: ${property.location}, ${property.city || 'Bangalore'}
- Bedrooms: ${property.bedrooms || 'N/A'} BHK
- Area: ${property.area || 'N/A'} ${property.areaUnit}
- Age: ${property.propertyAge || 'N/A'} years
- Furnishing: ${property.furnishingStatus}
- Status: ${property.constructionStatus}

TASK: Generate exactly 8 practical questions that a real buyer would ask about this property.

REQUIREMENTS:
1. Questions must be natural and conversational (like a real person asking)
2. Focus on information NOT in the listing
3. Cover these categories:
   - Legal & Documentation (2 questions)
   - Financial (1-2 questions)
   - Property Condition (2 questions)
   - Timeline & Possession (1 question)
   - Neighborhood & Practical (2 questions)

4. Make questions specific to this property type and price range
5. Sound professional but friendly
6. Avoid yes/no questions - ask for details

EXAMPLES OF GOOD QUESTIONS:
- "What is your reason for selling this ${property.propertyType.toLowerCase()}?"
- "Are there any pending legal issues, disputes, or encumbrances on this property?"
- "What appliances, furniture, or fixtures are included in the ${priceFormatted} price?"
- "When is the earliest date a buyer can take possession?"
- "How is the water supply, power backup, and parking situation?"

RESPOND WITH ONLY A JSON ARRAY:
[
  {"question": "...", "category": "Legal"},
  {"question": "...", "category": "Financial"},
  ...
]

Generate 8 questions now:`;
    }

    /**
     * Fallback default questions based on property type
     */
    getDefaultQuestions(property) {
        const priceFormatted = property.price >= 10000000 
            ? `₹${(property.price / 10000000).toFixed(1)} Crore` 
            : `₹${(property.price / 100000).toFixed(1)} Lakh`;

        const baseQuestions = [
            {
                question: `What is your reason for selling this ${property.propertyType.toLowerCase()}?`,
                category: 'General'
            },
            {
                question: "Are there any pending legal issues, property disputes, or encumbrances?",
                category: 'Legal'
            },
            {
                question: "Is the property title clear and verified with all necessary approvals?",
                category: 'Legal'
            },
            {
                question: `Are you open to negotiations on the ${priceFormatted} asking price?`,
                category: 'Financial'
            },
            {
                question: "What appliances, furniture, or fixtures are included in the sale?",
                category: 'Financial'
            },
            {
                question: "When was the last major renovation or repair work done?",
                category: 'Condition'
            },
            {
                question: "Are there any structural issues, leakage problems, or maintenance concerns?",
                category: 'Condition'
            },
            {
                question: "When is the earliest date a buyer can take possession of the property?",
                category: 'Timeline'
            }
        ];

        return baseQuestions.map(q => ({
            ...q,
            askedAt: new Date(),
            answer: null,
            answeredAt: null
        }));
    }
}

module.exports = new QuestionGeneratorAgent();
