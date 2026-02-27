import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function AdminScoringMechanisms() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('buyer');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            <Navbar user={null} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Scoring Mechanisms</h1>
                        <p className="text-slate-400">View all algorithms and scoring systems</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-200 border border-slate-700 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('buyer')}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'buyer'
                                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/50'
                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Buyer Lead Scoring
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('seller')}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'seller'
                                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Seller Rating System
                        </div>
                    </button>
                </div>

                {/* Buyer Lead Scoring */}
                {activeTab === 'buyer' && (
                    <div className="space-y-6">
                        {/* Overview Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border border-slate-700">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Buyer Lead Scoring System</h2>
                                    <p className="text-slate-400">Automatically score buyer leads based on engagement and behavior to help sellers prioritize high-quality prospects.</p>
                                </div>
                            </div>

                            {/* Score Range */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                                <ScoreRangeCard score="0-40" label="Cold Lead" color="from-blue-500 to-blue-600" icon="❄️" />
                                <ScoreRangeCard score="41-60" label="Warm Lead" color="from-amber-500 to-amber-600" icon="🌤️" />
                                <ScoreRangeCard score="61-80" label="Hot Lead" color="from-orange-500 to-red-500" icon="🔥" />
                                <ScoreRangeCard score="81-100" label="Very Hot Lead" color="from-red-500 to-pink-600" icon="🚀" />
                            </div>
                        </div>

                        {/* Scoring Factors */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ScoringFactorCard
                                title="Profile Completion"
                                maxPoints={15}
                                factors={[
                                    { name: 'Name', points: '✓' },
                                    { name: 'Email', points: '✓' },
                                    { name: 'Phone Number', points: '✓' },
                                    { name: 'Profession', points: '✓' },
                                    { name: 'Address', points: '✓' }
                                ]}
                                description="Complete profiles indicate serious buyers ready to transact"
                                icon="👤"
                                breakdown="100% Complete: 15pts | 80%+: 12pts | 60%+: 8pts | 40%+: 4pts"
                            />
                            <ScoringFactorCard
                                title="Property Exploration"
                                maxPoints={25}
                                factors={[
                                    { name: 'View Property Details', points: 3 },
                                    { name: 'Scroll Depth ≥80%', points: 3 },
                                    { name: 'Time on Page ≥2 min', points: 3 },
                                    { name: 'Images Viewed', points: 3 },
                                    { name: 'Q&A Section Opened', points: 3 },
                                    { name: 'Read All Q&A Answers', points: 5 },
                                    { name: 'Read >50% Q&A', points: 5 },
                                    { name: 'Q&A View Time ≥1 min', points: 3 }
                                ]}
                                description="Detailed exploration shows genuine interest in property details"
                                icon="🔍"
                            />
                            <ScoringFactorCard
                                title="Engagement Score"
                                maxPoints={20}
                                factors={[
                                    { name: 'Like Property', points: 7 },
                                    { name: 'Save Property', points: 10 },
                                    { name: 'View Count = 2', points: 3 },
                                    { name: 'View Count ≥ 3', points: 5 }
                                ]}
                                description="Active engagement shows genuine interest and investment"
                                icon="💬"
                            />
                            <ScoringFactorCard
                                title="AI Chat Interaction"
                                maxPoints={15}
                                factors={[
                                    { name: '1+ Questions Asked', points: 5 },
                                    { name: '3+ Questions Asked', points: 10 },
                                    { name: '6+ Questions Asked', points: 15 },
                                    { name: 'Quality Questions Bonus', points: '+5' }
                                ]}
                                description="AI chat engagement indicates deep interest and research"
                                icon="🤖"
                            />
                            <ScoringFactorCard
                                title="Vastu Details Interest"
                                maxPoints={10}
                                factors={[
                                    { name: 'Vastu Info Viewed', points: 5 },
                                    { name: 'Vastu Questions Asked', points: 5 },
                                    { name: 'Time Spent on Vastu', points: 'Tracked' }
                                ]}
                                description="Interest in Vastu details shows holistic property evaluation"
                                icon="🧘"
                            />
                            <ScoringFactorCard
                                title="Owner Contact"
                                maxPoints={25}
                                factors={[
                                    { name: 'Message Sent to Owner', points: 25 },
                                    { name: 'Quick Response (<1 hour)', points: '+5', bonus: true },
                                    { name: 'Response within 24 hours', points: '+3', bonus: true }
                                ]}
                                description="Direct communication indicates readiness to move forward"
                                icon="💌"
                            />
                        </div>

                        {/* SLA Section */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border border-slate-700">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Dynamic SLA (Service Level Agreement)
                            </h3>
                            <p className="text-slate-400 mb-6">Response time targets automatically assigned based on lead tier and seller workload:</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <SLACard tier="Very Hot" score="81-100" time="15 min" color="from-red-500 to-pink-600" />
                                <SLACard tier="Hot" score="61-80" time="15 min" color="from-orange-500 to-red-500" />
                                <SLACard tier="Warm" score="41-60" time="1 hour" color="from-amber-500 to-orange-500" />
                                <SLACard tier="Cold" score="0-40" time="4 hours" color="from-blue-500 to-cyan-500" />
                            </div>
                            <p className="text-slate-400 text-sm mt-6 bg-slate-800/50 p-4 rounded-lg">
                                <strong>Note:</strong> SLA times are dynamically adjusted based on seller's queue size and active leads. Maximum caps apply to prevent unreasonable delays.
                            </p>
                        </div>
                    </div>
                )}

                {/* Seller Rating System */}
                {activeTab === 'seller' && (
                    <div className="space-y-6">
                        {/* Overview Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border border-slate-700">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Seller Rating System</h2>
                                    <p className="text-slate-400">Rate sellers based on performance, responsiveness, and quality to help buyers identify trustworthy sellers.</p>
                                </div>
                            </div>

                            {/* Rating Scale */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
                                <RatingScaleCard rating="4.5-5.0" stars="⭐⭐⭐⭐⭐" label="Excellent" color="from-emerald-500 to-green-600" />
                                <RatingScaleCard rating="4.0-4.4" stars="⭐⭐⭐⭐" label="Great" color="from-blue-500 to-cyan-500" />
                                <RatingScaleCard rating="3.5-3.9" stars="⭐⭐⭐" label="Good" color="from-amber-500 to-orange-500" />
                                <RatingScaleCard rating="3.0-3.4" stars="⭐⭐" label="Average" color="from-orange-500 to-red-500" />
                                <RatingScaleCard rating="< 3.0" stars="⭐" label="Needs Improvement" color="from-red-500 to-pink-600" />
                            </div>
                        </div>

                        {/* Rating Factors */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <RatingFactorCard
                                title="Property Quality"
                                weight="30%"
                                factors={[
                                    { name: 'Complete Images', stars: 0.5 },
                                    { name: 'Detailed Description', stars: 0.3 },
                                    { name: 'QA Completed', stars: 0.4 },
                                    { name: 'High Approval Rate (>90%)', stars: 0.3 }
                                ]}
                                baseRating={3.0}
                                description="Quality of property listings and documentation"
                                icon="🏠"
                            />
                            <RatingFactorCard
                                title="Response Time"
                                weight="25%"
                                factors={[
                                    { name: '< 1 hour', stars: 5.0 },
                                    { name: '1-3 hours', stars: 4.5 },
                                    { name: '3-6 hours', stars: 4.0 },
                                    { name: '6-12 hours', stars: 3.5 },
                                    { name: '12-24 hours', stars: 3.0 },
                                    { name: '> 24 hours', stars: 2.5 }
                                ]}
                                description="How quickly sellers respond to inquiries"
                                icon="⚡"
                            />
                            <RatingFactorCard
                                title="Transaction Success"
                                weight="20%"
                                factors={[
                                    { name: '> 50% conversion', stars: 5.0 },
                                    { name: '40-50%', stars: 4.5 },
                                    { name: '30-40%', stars: 4.0 },
                                    { name: '20-30%', stars: 3.5 },
                                    { name: '10-20%', stars: 3.0 },
                                    { name: '< 10%', stars: 2.5 }
                                ]}
                                description="Successful transactions vs total leads"
                                icon="✅"
                            />
                            <RatingFactorCard
                                title="Buyer Feedback"
                                weight="15%"
                                factors={[
                                    { name: 'Post-transaction Surveys', stars: 5.0 },
                                    { name: 'Property Quality Ratings', stars: 5.0 },
                                    { name: 'Communication Ratings', stars: 5.0 },
                                    { name: 'Overall Satisfaction', stars: 5.0 }
                                ]}
                                description="Direct feedback from buyers"
                                icon="💬"
                            />
                            <RatingFactorCard
                                title="Profile Completeness"
                                weight="10%"
                                factors={[
                                    { name: 'Company Name', stars: 0.3 },
                                    { name: 'Phone Number', stars: 0.3 },
                                    { name: 'Bio/Description', stars: 0.4 },
                                    { name: 'Professional Photo', stars: 0.3 },
                                    { name: 'Verified Email', stars: 0.2 }
                                ]}
                                baseRating={3.0}
                                description="Completeness of seller profile"
                                icon="👤"
                            />
                        </div>

                        {/* Default Rating */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border border-slate-700">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Default Seller Rating</h3>
                                    <p className="text-slate-400 mt-1">New sellers start with <span className="text-emerald-400 font-semibold">4.5 stars</span> (benefit of the doubt)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ScoreRangeCard({ score, label, color, icon }) {
    return (
        <div className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white`}>
            <div className="text-3xl mb-2">{icon}</div>
            <div className="text-sm font-semibold opacity-90 mb-1">{score}</div>
            <div className="text-lg font-bold">{label}</div>
        </div>
    );
}

function ScoringFactorCard({ title, maxPoints, factors, description, icon, breakdown }) {
    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">{icon}</div>
                <div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-sm text-slate-400">Max {maxPoints} points</p>
                </div>
            </div>
            <p className="text-slate-400 text-sm mb-4">{description}</p>
            {breakdown && <p className="text-xs text-emerald-400 mb-4 bg-emerald-500/10 p-2 rounded">{breakdown}</p>}
            <div className="space-y-2">
                {factors.map((factor, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                        <span className="text-slate-300">{factor.name}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-semibold">+{factor.points}</span>
                            {factor.bonus && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">Bonus</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SLACard({ tier, score, time, color }) {
    return (
        <div className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white`}>
            <div className="text-sm font-semibold opacity-90 mb-2">{score}</div>
            <div className="text-lg font-bold mb-3">{tier}</div>
            <div className="text-2xl font-bold">{time}</div>
        </div>
    );
}

function RatingScaleCard({ rating, stars, label, color }) {
    return (
        <div className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white text-center`}>
            <div className="text-2xl mb-2">{stars}</div>
            <div className="text-sm font-semibold opacity-90 mb-1">{rating}</div>
            <div className="font-bold">{label}</div>
        </div>
    );
}

function RatingFactorCard({ title, weight, factors, baseRating, description, icon }) {
    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">{icon}</div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                        <p className="text-sm text-slate-400">Weight: {weight}</p>
                    </div>
                </div>
            </div>
            <p className="text-slate-400 text-sm mb-4">{description}</p>
            {baseRating && <div className="text-sm text-emerald-400 mb-3">Base: {baseRating} stars</div>}
            <div className="space-y-2">
                {factors.map((factor, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                        <span className="text-slate-300 text-sm">{factor.name}</span>
                        <span className="text-emerald-400 font-semibold">{factor.stars} ⭐</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
