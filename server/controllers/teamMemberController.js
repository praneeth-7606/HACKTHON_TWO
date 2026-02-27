const { addTeamMember, removeTeamMember, transferLead, getTeamMemberLeads, getTeamMembers } = require('../services/teamMemberService');

/**
 * Add team member to seller account
 */
exports.addTeamMember = async (req, res) => {
    try {
        const { email, name, role } = req.body;
        const sellerId = req.user.id;

        if (!email || !name) {
            return res.status(400).json({ status: 'fail', message: 'Email and name are required' });
        }

        const result = await addTeamMember(sellerId, email, name, role || 'sales');

        if (!result.success) {
            return res.status(400).json({ status: 'fail', message: result.error });
        }

        res.status(201).json({
            status: 'success',
            message: result.message,
            data: { teamMember: result.teamMember }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

/**
 * Remove team member from seller account
 */
exports.removeTeamMember = async (req, res) => {
    try {
        const { teamMemberId } = req.params;
        const sellerId = req.user.id;

        const result = await removeTeamMember(sellerId, teamMemberId);

        if (!result.success) {
            return res.status(400).json({ status: 'fail', message: result.error });
        }

        res.status(200).json({
            status: 'success',
            message: result.message
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

/**
 * Get seller's team members
 */
exports.getTeamMembers = async (req, res) => {
    try {
        const sellerId = req.user.id;

        const result = await getTeamMembers(sellerId);

        if (!result.success) {
            return res.status(400).json({ status: 'fail', message: result.error });
        }

        res.status(200).json({
            status: 'success',
            data: { teamMembers: result.teamMembers }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

/**
 * Transfer lead to team member
 */
exports.transferLead = async (req, res) => {
    try {
        const { leadId, toTeamMemberId } = req.body;
        const fromUserId = req.user.id;

        if (!leadId || !toTeamMemberId) {
            return res.status(400).json({ status: 'fail', message: 'Lead ID and team member ID are required' });
        }

        const result = await transferLead(leadId, fromUserId, toTeamMemberId);

        if (!result.success) {
            return res.status(400).json({ status: 'fail', message: result.error });
        }

        res.status(200).json({
            status: 'success',
            message: result.message,
            data: { lead: result.lead }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

/**
 * Get leads assigned to team member
 */
exports.getTeamMemberLeads = async (req, res) => {
    try {
        const teamMemberId = req.user.id;
        console.log('[GET_TEAM_MEMBER_LEADS] Team member ID:', teamMemberId);
        console.log('[GET_TEAM_MEMBER_LEADS] User role:', req.user.role);
        console.log('[GET_TEAM_MEMBER_LEADS] Is team member:', req.user.isTeamMember);

        const result = await getTeamMemberLeads(teamMemberId);

        if (!result.success) {
            console.log('[GET_TEAM_MEMBER_LEADS] Error:', result.error);
            return res.status(400).json({ status: 'fail', message: result.error });
        }

        console.log('[GET_TEAM_MEMBER_LEADS] Found', result.count, 'leads');
        res.status(200).json({
            status: 'success',
            data: { 
                leads: result.leads,
                count: result.count
            }
        });
    } catch (err) {
        console.error('[GET_TEAM_MEMBER_LEADS] Exception:', err);
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

module.exports = exports;
