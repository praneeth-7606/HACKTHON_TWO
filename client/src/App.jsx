import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import SellerDashboard from './pages/SellerDashboard';
import BuyerDiscovery from './pages/BuyerDiscovery';
import LeadDashboard from './pages/LeadDashboard';
import TeamMemberDashboard from './pages/TeamMemberDashboard';
import ListProperty from './pages/ListProperty';
import Profile from './pages/Profile';
import MessagesNew from './pages/MessagesNew';
import AgentChat from './pages/AgentChat';
import PropertySearchChat from './pages/PropertySearchChat';
import PropertyQA from './pages/PropertyQA';
import SavedProperties from './pages/SavedProperties';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminProperties from './pages/AdminProperties';
import AdminScoringMechanisms from './pages/AdminScoringMechanisms';
import './index.css';

function App() {
    return (
        <Router>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1e293b',
                        color: '#f1f5f9',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                    },
                    success: { iconTheme: { primary: '#10b981', secondary: '#fff' }, duration: 3000 },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#fff' }, duration: 4000 },
                }}
            />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<Navigate to="/auth" />} />
                <Route path="/seller" element={<SellerDashboard />} />
                <Route path="/buyer" element={<BuyerDiscovery />} />
                <Route path="/search" element={<PropertySearchChat />} />
                <Route path="/property-qa" element={<PropertyQA />} />
                <Route path="/leads" element={<LeadDashboard />} />
                <Route path="/team-member-dashboard" element={<TeamMemberDashboard />} />
                <Route path="/list-property" element={<ListProperty />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/messages" element={<MessagesNew />} />
                <Route path="/saved" element={<SavedProperties />} />
                <Route path="/agent-chat" element={<AgentChat />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/properties" element={<AdminProperties />} />
                <Route path="/admin/properties/pending" element={<AdminProperties />} />
                <Route path="/admin/scoring" element={<AdminScoringMechanisms />} />
                <Route path="/dashboard" element={<Navigate to="/auth" />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;
