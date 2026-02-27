/**
 * Background job to check for SLA breaches and trigger escalation
 * Runs every 5 minutes
 */

const { checkSLABreaches } = require('../services/sellerAccountabilityService');

let isRunning = false;

async function runSLACheck() {
    if (isRunning) {
        console.log('[SLA_JOB] Already running, skipping...');
        return;
    }

    isRunning = true;
    try {
        const result = await checkSLABreaches();
        if (result.success) {
            console.log(`[SLA_JOB] ✅ Check completed: ${result.stage4Count} Stage 4, ${result.stage5Count} Stage 5`);
        } else {
            console.error('[SLA_JOB] ❌ Error:', result.error);
        }
    } catch (error) {
        console.error('[SLA_JOB] Fatal error:', error);
    } finally {
        isRunning = false;
    }
}

// Start the job
function startSLAChecker() {
    console.log('[SLA_JOB] Starting SLA breach checker (every 5 minutes)...');
    
    // Run immediately
    runSLACheck();
    
    // Then run every 5 minutes
    setInterval(runSLACheck, 5 * 60 * 1000);
}

module.exports = { startSLAChecker, runSLACheck };
