import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

const ProfileField = ({ icon, label, children }) => (
    <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
        </div>
        {children}
    </div>
);

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        phoneNumber: '',
        profession: '',
        address: '',
        bio: '',
        company: '',
        budgetRange: '',
        preferredLocation: ''
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
        api.get('/users/me')
            .then(res => {
                const u = res.data.data.user;
                setUser(u);
                setFormData({
                    phoneNumber: u.phoneNumber || '',
                    profession: u.profession || '',
                    address: u.address || '',
                    bio: u.bio || '',
                    company: u.company || '',
                    budgetRange: u.budgetRange || '',
                    preferredLocation: u.preferredLocation || ''
                });
                // Check if profile is already completed
                if (u.profileCompleted && u.phoneNumber) {
                    setIsEditing(false);
                } else {
                    setIsEditing(true);
                }
                // Fetch team members if seller
                if (u.role === 'seller') {
                    fetchTeamMembers();
                }
            })
            .catch(() => navigate('/auth'));
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.patch('/users/updateMe', {
                ...formData,
                profileCompleted: true
            });
            setSuccess(true);
            setIsEditing(false);
            // Refresh user data
            const res = await api.get('/users/me');
            setUser(res.data.data.user);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const res = await api.get('/team-members');
            setTeamMembers(res.data.data.teamMembers || []);
        } catch (err) {
            console.error('Failed to fetch team members:', err);
        }
    };

    const handleAddTeamMember = async (e) => {
        e.preventDefault();
        if (!newTeamMember.email || !newTeamMember.name) {
            setError('Email and name are required');
            return;
        }

        setAddingTeamMember(true);
        setError('');
        try {
            await api.post('/team-members/add', newTeamMember);
            setSuccess(true);
            setNewTeamMember({ email: '', name: '', role: 'sales' });
            setShowAddTeamMember(false);
            fetchTeamMembers();
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add team member');
        } finally {
            setAddingTeamMember(false);
        }
    };

    const handleRemoveTeamMember = async (teamMemberId) => {
        if (!window.confirm('Are you sure you want to remove this team member?')) return;

        try {
            await api.delete(`/team-members/${teamMemberId}`);
            setSuccess(true);
            fetchTeamMembers();
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove team member');
        }
    };

    if (!user) return null;

    const inputStyle = {
        width: '100%',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '14px 18px',
        color: 'white',
        fontSize: '15px',
        outline: 'none',
        transition: 'all 0.3s',
        fontFamily: 'Inter'
    };

    const displayStyle = {
        width: '100%',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '14px 18px',
        color: '#e2e8f0',
        fontSize: '15px',
        fontFamily: 'Inter',
        minHeight: '48px',
        display: 'flex',
        alignItems: 'center'
    };

    return (
        <div style={{ background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'Inter' }}>
            <Navbar user={user} />
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 24px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(2,6,23,0.8) 100%)',
                        padding: '50px',
                        borderRadius: '32px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(30px)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}
                >
                    <div style={{ marginBottom: '48px', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', boxShadow: '0 10px 20px rgba(59,130,246,0.3)' }}>
                            {user.name[0].toUpperCase()}
                        </div>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '36px', fontWeight: '800', marginBottom: '12px', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {isEditing ? 'Profile Setup' : 'My Profile'}
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '400px', margin: '0 auto' }}>
                            {isEditing ? 'Enhance your account with professional details for a better AI matching experience.' : 'View and manage your profile information'}
                        </p>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                style={{
                                    marginTop: '20px',
                                    padding: '10px 24px',
                                    background: 'rgba(59,130,246,0.1)',
                                    border: '1px solid rgba(59,130,246,0.3)',
                                    borderRadius: '12px',
                                    color: '#3b82f6',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => e.target.style.background = 'rgba(59,130,246,0.2)'}
                                onMouseOut={e => e.target.style.background = 'rgba(59,130,246,0.1)'}
                            >
                                ✏️ Edit Profile
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                            <ProfileField icon="📞" label="Phone Number">
                                {isEditing ? (
                                    <input
                                        type="text" required placeholder="+91 98765 43210"
                                        value={formData.phoneNumber}
                                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <div style={displayStyle}>{formData.phoneNumber || 'Not provided'}</div>
                                )}
                            </ProfileField>

                            <ProfileField icon="💼" label="Profession">
                                {isEditing ? (
                                    <input
                                        type="text" required placeholder="e.g. Software Engineer"
                                        value={formData.profession}
                                        onChange={e => setFormData({ ...formData, profession: e.target.value })}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <div style={displayStyle}>{formData.profession || 'Not provided'}</div>
                                )}
                            </ProfileField>
                        </div>

                        <ProfileField icon="📍" label="Current Address">
                            {isEditing ? (
                                <textarea
                                    required rows={2} placeholder="Street, City, Zip Code"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    style={{ ...inputStyle, resize: 'none' }}
                                />
                            ) : (
                                <div style={displayStyle}>{formData.address || 'Not provided'}</div>
                            )}
                        </ProfileField>

                        <ProfileField icon="📝" label="About Me / Bio">
                            {isEditing ? (
                                <textarea
                                    rows={3} placeholder="Share a few details about your property search or brokerage..."
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    style={{ ...inputStyle, resize: 'none' }}
                                />
                            ) : (
                                <div style={displayStyle}>{formData.bio || 'Not provided'}</div>
                            )}
                        </ProfileField>

                        {user.role === 'seller' && (
                            <>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '40px 0' }} />
                                <ProfileField icon="🏢" label="Company / Agency Details">
                                    {isEditing ? (
                                        <input
                                            type="text" placeholder="e.g. Skyline Realty Group"
                                            value={formData.company}
                                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                                            style={inputStyle}
                                        />
                                    ) : (
                                        <div style={displayStyle}>{formData.company || 'Not provided'}</div>
                                    )}
                                </ProfileField>
                            </>
                        )}

                        {isEditing && (
                            <div style={{ marginTop: '48px' }}>
                                {error && <p style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', marginBottom: '16px', fontWeight: '500' }}>{error}</p>}
                                {success && <p style={{ color: '#10b981', fontSize: '14px', textAlign: 'center', marginBottom: '16px', fontWeight: '700' }}>🎉 Profile sync successful!</p>}

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    {user.profileCompleted && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setFormData({
                                                    phoneNumber: user.phoneNumber || '',
                                                    profession: user.profession || '',
                                                    address: user.address || '',
                                                    bio: user.bio || '',
                                                    company: user.company || '',
                                                    budgetRange: user.budgetRange || '',
                                                    preferredLocation: user.preferredLocation || ''
                                                });
                                            }}
                                            style={{
                                                flex: '1',
                                                height: '60px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '20px',
                                                color: 'white',
                                                fontWeight: '700',
                                                fontSize: '16px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            CANCEL
                                        </button>
                                    )}
                                    <button
                                        type="submit" disabled={loading}
                                        style={{
                                            flex: user.profileCompleted ? '1' : 'auto',
                                            width: user.profileCompleted ? 'auto' : '100%',
                                            height: '60px',
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                            border: 'none',
                                            borderRadius: '20px',
                                            color: 'white',
                                            fontWeight: '800',
                                            fontSize: '16px',
                                            cursor: 'pointer',
                                            boxShadow: '0 15px 30px rgba(37,99,235,0.3)',
                                            transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}
                                    >
                                        {loading ? 'UPDATING...' : 'SAVE PROFILE & CONTINUE'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    {/* TEAM MEMBERS SECTION - SELLERS ONLY */}
                    {user.role === 'seller' && (
                        <div style={{ marginTop: '48px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>👥 Team Members</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Manage your sales team to handle leads</p>
                                </div>
                                {!showAddTeamMember && (
                                    <button
                                        onClick={() => setShowAddTeamMember(true)}
                                        style={{
                                            padding: '10px 24px',
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                                        }}
                                    >
                                        + Add Team Member
                                    </button>
                                )}
                            </div>

                            {/* Add Team Member Form */}
                            {showAddTeamMember && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        padding: '24px',
                                        background: 'rgba(59,130,246,0.05)',
                                        border: '1px solid rgba(59,130,246,0.2)',
                                        borderRadius: '16px',
                                        marginBottom: '24px'
                                    }}
                                >
                                    <form onSubmit={handleAddTeamMember}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Email</label>
                                                <input
                                                    type="email"
                                                    placeholder="team@example.com"
                                                    value={newTeamMember.email}
                                                    onChange={e => setNewTeamMember({ ...newTeamMember, email: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        background: 'rgba(255,255,255,0.03)',
                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                        borderRadius: '12px',
                                                        padding: '12px 16px',
                                                        color: 'white',
                                                        fontSize: '14px',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="John Doe"
                                                    value={newTeamMember.name}
                                                    onChange={e => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        background: 'rgba(255,255,255,0.03)',
                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                        borderRadius: '12px',
                                                        padding: '12px 16px',
                                                        color: 'white',
                                                        fontSize: '14px',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Role</label>
                                            <select
                                                value={newTeamMember.role}
                                                onChange={e => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    borderRadius: '12px',
                                                    padding: '12px 16px',
                                                    color: 'white',
                                                    fontSize: '14px',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="sales">Sales Representative</option>
                                                <option value="manager">Manager</option>
                                                <option value="support">Support</option>
                                            </select>
                                        </div>
                                        {error && <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button
                                                type="submit"
                                                disabled={addingTeamMember}
                                                style={{
                                                    flex: 1,
                                                    padding: '12px',
                                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    color: 'white',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {addingTeamMember ? 'Adding...' : 'Add Member'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAddTeamMember(false);
                                                    setNewTeamMember({ email: '', name: '', role: 'sales' });
                                                    setError('');
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: '12px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '12px',
                                                    color: 'white',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {/* Team Members List */}
                            {teamMembers.length === 0 ? (
                                <div style={{
                                    padding: '32px',
                                    textAlign: 'center',
                                    borderRadius: '16px',
                                    border: '2px dashed rgba(255,255,255,0.07)',
                                    color: 'var(--text-muted)'
                                }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
                                    <p>No team members yet. Add your first team member to delegate leads.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {teamMembers.map(member => (
                                        <motion.div
                                            key={member.userId}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            style={{
                                                padding: '16px',
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                                                    {member.name}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    {member.email} • {member.role}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveTeamMember(member.userId)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'rgba(239,68,68,0.1)',
                                                    border: '1px solid rgba(239,68,68,0.3)',
                                                    borderRadius: '8px',
                                                    color: '#fca5a5',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
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
