import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const ProfileField = ({ icon, label, children }) => (
    <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</label>
        </div>
        {children}
    </div>
);

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        phoneNumber: '', profession: '', address: '', bio: '',
        company: '', budgetRange: '', preferredLocation: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [showAddTeamMember, setShowAddTeamMember] = useState(false);
    const [newTeamMember, setNewTeamMember] = useState({ email: '', name: '', role: 'sales' });
    const [addingTeamMember, setAddingTeamMember] = useState(false);

    useEffect(() => {
        api.get('/users/me').then(res => {
            const u = res.data.data.user;
            setUser(u);
            setFormData({
                phoneNumber: u.phoneNumber || '', profession: u.profession || '',
                address: u.address || '', bio: u.bio || '',
                company: u.company || '', budgetRange: u.budgetRange || '',
                preferredLocation: u.preferredLocation || ''
            });
            if (u.profileCompleted && u.phoneNumber) setIsEditing(false);
            else setIsEditing(true);
            if (u.role === 'seller') fetchTeamMembers();
        }).catch(() => navigate('/auth'));
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await api.patch('/users/updateMe', { ...formData, profileCompleted: true });
            setSuccess(true); setIsEditing(false);
            const res = await api.get('/users/me');
            setUser(res.data.data.user);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) { setError(err.response?.data?.message || 'Failed to update profile'); }
        finally { setLoading(false); }
    };

    const fetchTeamMembers = async () => {
        try { const res = await api.get('/team-members'); setTeamMembers(res.data.data.teamMembers || []); }
        catch (err) { console.error(err); }
    };

    const handleAddTeamMember = async (e) => {
        e.preventDefault();
        if (!newTeamMember.email || !newTeamMember.name) { setError('Email and name are required'); return; }
        setAddingTeamMember(true); setError('');
        try {
            await api.post('/team-members/add', newTeamMember);
            setSuccess(true); setNewTeamMember({ email: '', name: '', role: 'sales' });
            setShowAddTeamMember(false); fetchTeamMembers();
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) { setError(err.response?.data?.message || 'Failed to add team member'); }
        finally { setAddingTeamMember(false); }
    };

    const handleRemoveTeamMember = async (teamMemberId) => {
        if (!window.confirm('Are you sure you want to remove this team member?')) return;
        try { await api.delete(`/team-members/${teamMemberId}`); setSuccess(true); fetchTeamMembers(); setTimeout(() => setSuccess(false), 3000); }
        catch (err) { setError(err.response?.data?.message || 'Failed to remove team member'); }
    };

    if (!user) return null;

    const roleConfig = {
        admin: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '⚡ Admin', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
        seller: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: '🏢 Seller', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
        buyer: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: '🏡 Buyer', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    };
    const rc = roleConfig[user.role] || roleConfig.buyer;
    const completionFields = ['phoneNumber', 'profession', 'address', 'bio'];
    const filledCount = completionFields.filter(f => user[f]).length;
    const completionPct = Math.round((filledCount / completionFields.length) * 100);

    const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 18px', color: 'white', fontSize: '14px', outline: 'none', transition: 'all 0.3s', fontFamily: 'Inter', boxSizing: 'border-box' };
    const displayStyle = { width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '14px 18px', color: '#e2e8f0', fontSize: '14px', fontFamily: 'Inter', minHeight: '48px', display: 'flex', alignItems: 'center', boxSizing: 'border-box' };

    return (
        <div className="bg-dashboard">
            <div className="grid-pattern" />
            <Navbar user={user} />
            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '100px 24px 60px' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

                    {/* Back button */}
                    <motion.button whileHover={{ scale: 1.03, x: -3 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(user.role === 'buyer' ? '/buyer' : user.role === 'admin' ? '/admin' : '/seller')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '20px', transition: 'all 0.2s' }}>
                        ← Back to Dashboard
                    </motion.button>

                    {/* ═══════════ PROFILE HEADER CARD ═══════════ */}
                    <div className="glass" style={{ padding: '36px', borderRadius: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
                        {/* Background accent */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: rc.gradient }} />
                        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: `radial-gradient(circle, ${rc.color}15, transparent)`, pointerEvents: 'none' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                            {/* Avatar */}
                            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: rc.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'white', fontWeight: '800', fontFamily: 'Space Grotesk', boxShadow: `0 8px 24px ${rc.color}40`, flexShrink: 0 }}>
                                {user.name[0].toUpperCase()}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                    <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '26px', fontWeight: '800', color: 'white', margin: 0 }}>{user.name}</h2>
                                    <span style={{ padding: '4px 12px', borderRadius: '8px', background: rc.bg, border: `1px solid ${rc.color}40`, fontSize: '12px', fontWeight: '700', color: rc.color }}>{rc.label}</span>
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px' }}>📧 {user.email}</div>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📅 Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: user.profileCompleted ? '#10b981' : '#f59e0b' }} />
                                        <span style={{ fontSize: '12px', color: user.profileCompleted ? '#6ee7b7' : '#fbbf24', fontWeight: '600' }}>
                                            {user.profileCompleted ? 'Profile Complete' : 'Profile Incomplete'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Completion Ring */}
                            <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
                                <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                                    <motion.circle cx="36" cy="36" r="28" fill="none" stroke={completionPct === 100 ? '#10b981' : '#3b82f6'} strokeWidth="6" strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 28}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 28 - (completionPct / 100) * 2 * Math.PI * 28 }}
                                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '16px', fontWeight: '800', color: 'white', fontFamily: 'Space Grotesk' }}>{completionPct}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════ PROFILE FORM ═══════════ */}
                    <div className="glass" style={{ padding: '36px', borderRadius: '24px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: '700', color: 'white' }}>
                                {isEditing ? '✏️ Edit Profile' : '📋 Profile Details'}
                            </h3>
                            {!isEditing && (
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setIsEditing(true)}
                                    style={{ padding: '8px 20px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                                    ✏️ Edit
                                </motion.button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <ProfileField icon="📞" label="Phone Number">
                                    {isEditing ? (
                                        <input type="text" required placeholder="+91 98765 43210" value={formData.phoneNumber}
                                            onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} style={inputStyle} />
                                    ) : (
                                        <div style={displayStyle}>{formData.phoneNumber || 'Not provided'}</div>
                                    )}
                                </ProfileField>
                                <ProfileField icon="💼" label="Profession">
                                    {isEditing ? (
                                        <input type="text" required placeholder="e.g. Software Engineer" value={formData.profession}
                                            onChange={e => setFormData({ ...formData, profession: e.target.value })} style={inputStyle} />
                                    ) : (
                                        <div style={displayStyle}>{formData.profession || 'Not provided'}</div>
                                    )}
                                </ProfileField>
                            </div>

                            <ProfileField icon="📍" label="Current Address">
                                {isEditing ? (
                                    <textarea required rows={2} placeholder="Street, City, Zip Code" value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ ...inputStyle, resize: 'none' }} />
                                ) : (
                                    <div style={displayStyle}>{formData.address || 'Not provided'}</div>
                                )}
                            </ProfileField>

                            <ProfileField icon="📝" label="About Me / Bio">
                                {isEditing ? (
                                    <textarea rows={3} placeholder="Share a few details about yourself..." value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })} style={{ ...inputStyle, resize: 'none' }} />
                                ) : (
                                    <div style={displayStyle}>{formData.bio || 'Not provided'}</div>
                                )}
                            </ProfileField>

                            {user.role === 'seller' && (
                                <>
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />
                                    <ProfileField icon="🏢" label="Company / Agency Details">
                                        {isEditing ? (
                                            <input type="text" placeholder="e.g. Skyline Realty Group" value={formData.company}
                                                onChange={e => setFormData({ ...formData, company: e.target.value })} style={inputStyle} />
                                        ) : (
                                            <div style={displayStyle}>{formData.company || 'Not provided'}</div>
                                        )}
                                    </ProfileField>
                                </>
                            )}

                            {isEditing && (
                                <div style={{ marginTop: '28px' }}>
                                    <AnimatePresence>
                                        {error && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', marginBottom: '16px', fontWeight: '600' }}>{error}</motion.p>}
                                        {success && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: '#10b981', fontSize: '13px', textAlign: 'center', marginBottom: '16px', fontWeight: '700' }}>🎉 Profile updated successfully!</motion.p>}
                                    </AnimatePresence>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {user.profileCompleted && (
                                            <button type="button" onClick={() => { setIsEditing(false); setFormData({ phoneNumber: user.phoneNumber || '', profession: user.profession || '', address: user.address || '', bio: user.bio || '', company: user.company || '', budgetRange: user.budgetRange || '', preferredLocation: user.preferredLocation || '' }); }}
                                                className="btn btn-secondary" style={{ flex: 1, height: '52px' }}>Cancel</button>
                                        )}
                                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, height: '52px', opacity: loading ? 0.6 : 1 }}>
                                            {loading ? 'Updating...' : 'Save Profile'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* ═══════════ TEAM MEMBERS SECTION ═══════════ */}
                    {user.role === 'seller' && (
                        <div className="glass" style={{ padding: '36px', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>👥 Team Members</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Manage your sales team to handle leads</p>
                                </div>
                                {!showAddTeamMember && (
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAddTeamMember(true)}
                                        className="btn btn-primary" style={{ fontSize: '13px' }}>
                                        + Add Member
                                    </motion.button>
                                )}
                            </div>

                            <AnimatePresence>
                                {showAddTeamMember && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                        style={{ overflow: 'hidden', marginBottom: '20px' }}>
                                        <div style={{ padding: '24px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px' }}>
                                            <form onSubmit={handleAddTeamMember}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                                                        <input type="email" placeholder="team@example.com" value={newTeamMember.email}
                                                            onChange={e => setNewTeamMember({ ...newTeamMember, email: e.target.value })} style={inputStyle} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</label>
                                                        <input type="text" placeholder="John Doe" value={newTeamMember.name}
                                                            onChange={e => setNewTeamMember({ ...newTeamMember, name: e.target.value })} style={inputStyle} />
                                                    </div>
                                                </div>
                                                <div style={{ marginBottom: '16px' }}>
                                                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</label>
                                                    <select value={newTeamMember.role} onChange={e => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
                                                        style={{ ...inputStyle, cursor: 'pointer' }}>
                                                        <option value="sales" style={{ background: '#0d1526' }}>Sales Representative</option>
                                                        <option value="manager" style={{ background: '#0d1526' }}>Manager</option>
                                                        <option value="support" style={{ background: '#0d1526' }}>Support</option>
                                                    </select>
                                                </div>
                                                {error && <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button type="submit" disabled={addingTeamMember} className="btn btn-primary" style={{ flex: 1, opacity: addingTeamMember ? 0.6 : 1 }}>
                                                        {addingTeamMember ? 'Adding...' : 'Add Member'}
                                                    </button>
                                                    <button type="button" onClick={() => { setShowAddTeamMember(false); setNewTeamMember({ email: '', name: '', role: 'sales' }); setError(''); }}
                                                        className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                                </div>
                                            </form>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {teamMembers.length === 0 ? (
                                <div className="empty-state" style={{ border: '2px dashed rgba(255,255,255,0.07)', borderRadius: '16px', padding: '40px' }}>
                                    <div className="empty-state-icon">👥</div>
                                    <h3>No team members yet</h3>
                                    <p>Add your first team member to delegate leads.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {teamMembers.map((member, i) => (
                                        <motion.div key={member.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                            style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: 'white' }}>
                                                    {member.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '2px' }}>{member.name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{member.email} • <span style={{ color: '#60a5fa', fontWeight: '600' }}>{member.role}</span></div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveTeamMember(member.userId)}
                                                style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                                Remove
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Profile;
