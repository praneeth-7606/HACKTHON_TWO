const Property = require('../models/Property');
const questionGeneratorAgent = require('../services/questionGeneratorAgent');

/**
 * Q&A Controller for Seller Questions
 */

// @desc    Generate questions for a property
// @route   POST /api/v1/qa/generate/:propertyId
// @access  Private (Seller only)
exports.generateQuestions = async (req, res) => {
    try {
        const { propertyId } = req.params;
        
        console.log(`[QA_CONTROLLER] Generate request for property: ${propertyId} by user: ${req.user._id}`);
        
        // Find property and verify ownership
        const property = await Property.findById(propertyId);
        
        if (!property) {
            console.error(`[QA_CONTROLLER] Property not found: ${propertyId}`);
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }
        
        // Verify seller owns this property
        if (property.seller.toString() !== req.user._id.toString()) {
            console.error(`[QA_CONTROLLER] Unauthorized access attempt by user ${req.user._id} for property ${propertyId}`);
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this property'
            });
        }
        
        // Check if questions already generated
        if (property.sellerQA && property.sellerQA.length > 0) {
            console.log(`[QA_CONTROLLER] Questions already exist for property ${propertyId}, returning cached`);
            return res.status(200).json({
                success: true,
                data: {
                    questions: property.sellerQA,
                    alreadyGenerated: true
                }
            });
        }
        
        console.log(`[QA_CONTROLLER] Generating new questions for property: ${propertyId}`);
        
        // Generate questions using AI
        const questions = await questionGeneratorAgent.generateQuestions(property);
        
        if (!questions || questions.length === 0) {
            console.error(`[QA_CONTROLLER] No questions generated for property ${propertyId}`);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate questions. Please try again.'
            });
        }
        
        // Save questions to property
        property.sellerQA = questions;
        await property.save();
        
        console.log(`[QA_CONTROLLER] Successfully generated and saved ${questions.length} questions for property ${propertyId}`);
        
        res.status(200).json({
            success: true,
            data: {
                questions: questions,
                alreadyGenerated: false
            }
        });
        
    } catch (error) {
        console.error('[QA_CONTROLLER] Error generating questions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate questions',
            error: error.message
        });
    }
};

// @desc    Submit answer to a question
// @route   POST /api/v1/qa/answer/:propertyId
// @access  Private (Seller only)
exports.submitAnswer = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { questionIndex, answer } = req.body;
        
        if (questionIndex === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Question index is required'
            });
        }
        
        // Find property
        const property = await Property.findById(propertyId);
        
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }
        
        // Verify ownership
        if (property.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        // Update answer
        if (property.sellerQA[questionIndex]) {
            property.sellerQA[questionIndex].answer = answer || null;
            property.sellerQA[questionIndex].answeredAt = answer ? new Date() : null;
            
            await property.save();
            
            console.log(`[QA_CONTROLLER] Answer ${answer ? 'submitted' : 'skipped'} for question ${questionIndex}`);
            
            res.status(200).json({
                success: true,
                data: {
                    question: property.sellerQA[questionIndex]
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }
        
    } catch (error) {
        console.error('[QA_CONTROLLER] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit answer',
            error: error.message
        });
    }
};

// @desc    Mark Q&A as completed
// @route   POST /api/v1/qa/complete/:propertyId
// @access  Private (Seller only)
exports.completeQA = async (req, res) => {
    try {
        const { propertyId } = req.params;
        
        const property = await Property.findById(propertyId);
        
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }
        
        // Verify ownership
        if (property.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        property.qaCompleted = true;
        await property.save();
        
        // Count answered questions
        const answeredCount = property.sellerQA.filter(q => q.answer && q.answer.trim().length > 0).length;
        
        console.log(`[QA_CONTROLLER] Q&A completed for property ${propertyId}. Answered: ${answeredCount}/${property.sellerQA.length}`);
        
        res.status(200).json({
            success: true,
            data: {
                answeredCount,
                totalQuestions: property.sellerQA.length,
                message: 'Q&A session completed successfully'
            }
        });
        
    } catch (error) {
        console.error('[QA_CONTROLLER] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete Q&A',
            error: error.message
        });
    }
};

// @desc    Get Q&A for a property (for buyers to view)
// @route   GET /api/v1/qa/:propertyId
// @access  Public
exports.getQA = async (req, res) => {
    try {
        const { propertyId } = req.params;
        
        const property = await Property.findById(propertyId).select('sellerQA qaCompleted');
        
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }
        
        // Filter to only show answered questions
        const answeredQuestions = property.sellerQA.filter(q => q.answer && q.answer.trim().length > 0);
        
        res.status(200).json({
            success: true,
            data: {
                questions: answeredQuestions,
                qaCompleted: property.qaCompleted,
                totalAnswered: answeredQuestions.length
            }
        });
        
    } catch (error) {
        console.error('[QA_CONTROLLER] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Q&A',
            error: error.message
        });
    }
};
