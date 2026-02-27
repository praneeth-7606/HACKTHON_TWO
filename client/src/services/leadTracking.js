import api from './api';

class LeadTrackingService {
    constructor() {
        this.startTime = null;
        this.qaStartTime = null;
        this.isActive = true;
        this.scrollDepth = 0;
        this.imagesViewed = false;
        this.locationViewed = false;
        this.qaAnswersRead = 0;
        this.propertyId = null;
        this.trackingInterval = null;
    }

    /**
     * Initialize tracking for a property
     */
    init(propertyId) {
        this.propertyId = propertyId;
        this.startTime = Date.now();
        this.isActive = true;
        
        // Track property view
        this.trackView();
        
        // Setup event listeners
        this.setupListeners();
        
        // Start heartbeat (send data every 30 seconds)
        this.startHeartbeat();
        
        console.log('[LEAD_TRACKING] Initialized for property:', propertyId);
    }

    /**
     * Track property view
     */
    async trackView() {
        try {
            await api.post(`/leads/track/view/${this.propertyId}`);
        } catch (err) {
            console.error('[LEAD_TRACKING] View tracking error:', err);
        }
    }

    /**
     * Setup event listeners
     */
    setupListeners() {
        // Track page visibility (tab switching)
        document.addEventListener('visibilitychange', () => {
            this.isActive = !document.hidden;
            if (!this.isActive) {
                this.sendTimeData();
            }
        });

        // Track scroll depth
        window.addEventListener('scroll', this.handleScroll.bind(this));

        // Track before page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    /**
     * Handle scroll tracking
     */
    handleScroll() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        const scrollPercent = ((scrollTop + windowHeight) / documentHeight) * 100;
        this.scrollDepth = Math.max(this.scrollDepth, Math.min(scrollPercent, 100));
    }

    /**
     * Start heartbeat to send data periodically
     */
    startHeartbeat() {
        this.trackingInterval = setInterval(() => {
            if (this.isActive) {
                this.sendTimeData();
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Send time spent data
     */
    async sendTimeData() {
        if (!this.startTime || !this.propertyId) return;
        
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Cap at 10 minutes (600 seconds)
        const cappedTime = Math.min(timeSpent, 600);
        
        try {
            await api.post('/leads/track/time', {
                propertyId: this.propertyId,
                timeSpent: cappedTime,
                scrollDepth: Math.floor(this.scrollDepth),
                imagesViewed: this.imagesViewed,
                locationViewed: this.locationViewed
            });
        } catch (err) {
            console.error('[LEAD_TRACKING] Time tracking error:', err);
        }
    }

    /**
     * Track image gallery view
     */
    trackImagesViewed() {
        this.imagesViewed = true;
    }

    /**
     * Track location/map view
     */
    trackLocationViewed() {
        this.locationViewed = true;
    }

    /**
     * Track Q&A section opened
     */
    trackQAOpened(totalAnswers) {
        this.qaStartTime = Date.now();
        this.qaAnswersRead = 0;
        
        api.post('/leads/track/qa', {
            propertyId: this.propertyId,
            qaOpened: true,
            qaTotalAnswers: totalAnswers
        }).catch(err => console.error('[LEAD_TRACKING] QA tracking error:', err));
    }

    /**
     * Track Q&A answer read
     */
    trackQAAnswerRead() {
        this.qaAnswersRead++;
    }

    /**
     * Track Q&A section closed
     */
    trackQAClosed(totalAnswers) {
        if (!this.qaStartTime) return;
        
        const qaTimeSpent = Math.floor((Date.now() - this.qaStartTime) / 1000);
        const cappedTime = Math.min(qaTimeSpent, 300); // Cap at 5 minutes
        
        api.post('/leads/track/qa', {
            propertyId: this.propertyId,
            qaOpened: true,
            qaViewTime: cappedTime,
            qaAnswersRead: this.qaAnswersRead,
            qaTotalAnswers: totalAnswers
        }).catch(err => console.error('[LEAD_TRACKING] QA tracking error:', err));
        
        this.qaStartTime = null;
    }

    /**
     * Track engagement action (like, save, share)
     */
    trackEngagement(action) {
        api.post('/leads/track/engagement', {
            propertyId: this.propertyId,
            action: action // 'like', 'save', 'share'
        }).catch(err => console.error('[LEAD_TRACKING] Engagement tracking error:', err));
    }

    /**
     * Track AI interaction
     */
    trackAIQuestion(questionType = 'general') {
        // questionType: 'viewing', 'price', 'docs', 'general'
        api.post('/leads/track/ai', {
            propertyId: this.propertyId,
            questionType: questionType
        }).catch(err => console.error('[LEAD_TRACKING] AI tracking error:', err));
    }

    /**
     * Track owner contact (message sent)
     */
    trackOwnerContact(messageText) {
        const messageLength = messageText.length;
        const mentionsViewing = /view|visit|see|schedule|appointment|tour/i.test(messageText);
        
        api.post('/leads/track/contact', {
            propertyId: this.propertyId,
            messageLength: messageLength,
            mentionsViewing: mentionsViewing
        }).catch(err => console.error('[LEAD_TRACKING] Contact tracking error:', err));
    }

    /**
     * Cleanup and send final data
     */
    cleanup() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
        }
        
        // Send final time data
        this.sendTimeData();
        
        // Send Q&A data if section was open
        if (this.qaStartTime) {
            this.trackQAClosed(0);
        }
        
        console.log('[LEAD_TRACKING] Cleanup complete');
    }
}

// Create singleton instance
const leadTracker = new LeadTrackingService();

export default leadTracker;
