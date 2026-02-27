import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

// ─── FORM STATE ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
    title: '', propertyType: 'Apartment', listingType: 'Sale', description: '',
    address: '', city: '', state: '', pincode: '', landmark: '',
    price: '', negotiable: false, maintenanceCharges: '',
    area: '', areaUnit: 'sqft', bedrooms: '', bathrooms: '', balconies: '',
    floorNumber: '', totalFloors: '', furnishingStatus: 'Unfurnished',
    propertyAge: '', constructionStatus: 'Ready to Move',
    availableFrom: '', occupancyStatus: 'Vacant', listingStatus: 'Active',
    features: '', vastuInfo: '',
};

const SECTIONS = [
    { id: 'basic', label: 'Basic Details', icon: '🏡', color: '#3b82f6', fields: ['title', 'propertyType', 'listingType', 'description'] },
    { id: 'location', label: 'Location', icon: '📍', color: '#10b981', fields: ['address', 'city', 'state', 'pincode', 'landmark'] },
    { id: 'pricing', label: 'Pricing', icon: '💰', color: '#f59e0b', fields: ['price', 'negotiable', 'maintenanceCharges'] },
    { id: 'specs', label: 'Specifications', icon: '📐', color: '#8b5cf6', fields: ['area', 'areaUnit', 'bedrooms', 'bathrooms', 'balconies', 'floorNumber', 'totalFloors', 'furnishingStatus', 'propertyAge', 'constructionStatus'] },
    { id: 'availability', label: 'Availability', icon: '📅', color: '#06b6d4', fields: ['availableFrom', 'occupancyStatus', 'listingStatus', 'features', 'vastuInfo'] },
];

// Required fields per section — must be filled before proceeding
const SECTION_REQUIRED = {
    basic: { title: 'Property Title' },
    location: { city: 'City' },
    pricing: { price: 'Price' },
    specs: {},
    availability: {},
};

const FIELD_META = {
    title: { label: 'Property Title', placeholder: 'e.g. Modern 3BHK in Bandra', type: 'text', required: true },
    propertyType: { label: 'Property Type', type: 'select', options: ['Apartment', 'Villa', 'Plot', 'Commercial', 'House', 'Studio', 'Other'] },
    listingType: { label: 'Listing Type', type: 'select', options: ['Sale', 'Rent', 'Lease'] },
    description: { label: 'Description', placeholder: 'Describe the property, highlights, amenities...', type: 'textarea' },
    address: { label: 'Full Address', placeholder: 'Street, area, colony...', type: 'text' },
    city: { label: 'City', placeholder: 'Mumbai', type: 'text', required: true },
    state: { label: 'State', placeholder: 'Maharashtra', type: 'text' },
    pincode: { label: 'PIN Code', placeholder: '400001', type: 'text' },
    landmark: { label: 'Nearby Landmark', placeholder: 'Near Bandra Station', type: 'text' },
    price: { label: 'Price (₹)', placeholder: '5000000', type: 'number', required: true },
    negotiable: { label: 'Price Negotiable', type: 'toggle' },
    maintenanceCharges: { label: 'Maintenance (₹/mo)', placeholder: '5000', type: 'number' },
    area: { label: 'Total Area', placeholder: '1200', type: 'number' },
    areaUnit: { label: 'Area Unit', type: 'select', options: ['sqft', 'sqm'] },
    bedrooms: { label: 'Bedrooms', placeholder: '3', type: 'number' },
    bathrooms: { label: 'Bathrooms', placeholder: '2', type: 'number' },
    balconies: { label: 'Balconies', placeholder: '1', type: 'number' },
    floorNumber: { label: 'Floor Number', placeholder: '5', type: 'number' },
    totalFloors: { label: 'Total Floors', placeholder: '12', type: 'number' },
    furnishingStatus: { label: 'Furnishing', type: 'select', options: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'] },
    propertyAge: { label: 'Property Age (years)', placeholder: '3', type: 'number' },
    constructionStatus: { label: 'Construction Status', type: 'select', options: ['Ready to Move', 'Under Construction', 'New Construction'] },
    availableFrom: { label: 'Available From', type: 'date' },
    occupancyStatus: { label: 'Occupancy Status', type: 'select', options: ['Vacant', 'Occupied'] },
    listingStatus: { label: 'Listing Status', type: 'select', options: ['Active', 'Sold', 'Rented'] },
    features: { label: 'Amenities (comma separated)', placeholder: 'Pool, Gym, Parking, Security', type: 'text' },
    vastuInfo: { label: 'Vastu (vāstu) Details', placeholder: 'e.g. North-facing, Vastu compliant, South-east kitchen...', type: 'textarea' },
};

// ─── FIELD COMPONENT ────────────────────────────────────────────────────────────
const Field = ({ name, value, onChange, highlighted }) => {
    const meta = FIELD_META[name];
    if (!meta) return null;

    const inputBase = {
        width: '100%',
        background: highlighted ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${highlighted ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.09)'}`,
        borderRadius: '12px',
        padding: '12px 16px',
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.2s',
        boxSizing: 'border-box',
        boxShadow: highlighted ? '0 0 0 3px rgba(16,185,129,0.08)' : 'none',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: highlighted ? '#34d399' : '#64748b' }}>{meta.label}</span>
                {meta.required && <span style={{ color: '#ef4444', fontSize: '13px' }}>*</span>}
                {highlighted && (
                    <span style={{
                        fontSize: '9px', fontWeight: '800', letterSpacing: '0.6px',
                        color: '#10b981', background: 'rgba(16,185,129,0.15)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        padding: '1px 6px', borderRadius: '999px',
                    }}>✓ AI</span>
                )}
            </label>

            {meta.type === 'toggle' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
                    <button type="button" onClick={() => onChange(name, !value)} style={{
                        width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
                        background: value ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255,255,255,0.1)',
                        position: 'relative', transition: 'all 0.25s', flexShrink: 0,
                        boxShadow: value ? '0 0 14px rgba(59,130,246,0.4)' : 'none',
                    }}>
                        <div style={{
                            position: 'absolute', top: '4px', left: value ? '26px' : '4px',
                            width: '18px', height: '18px', borderRadius: '50%',
                            background: 'white', transition: 'left 0.25s',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                        }} />
                    </button>
                    <span style={{ fontSize: '14px', color: value ? '#60a5fa' : '#475569', fontWeight: '500' }}>
                        {value ? 'Yes, Negotiable' : 'Fixed Price'}
                    </span>
                </div>
            ) : meta.type === 'select' ? (
                <div style={{ position: 'relative' }}>
                    <select value={value} onChange={e => onChange(name, e.target.value)}
                        style={{ ...inputBase, appearance: 'none', cursor: 'pointer', paddingRight: '36px' }}>
                        {meta.options.map(o => <option key={o} value={o} style={{ background: '#0d1526' }}>{o}</option>)}
                    </select>
                    <svg style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#475569' }}
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            ) : meta.type === 'textarea' ? (
                <textarea value={value} onChange={e => onChange(name, e.target.value)}
                    placeholder={meta.placeholder} rows={4}
                    style={{ ...inputBase, resize: 'vertical', minHeight: '90px', lineHeight: '1.6' }} />
            ) : (
                <input type={meta.type} value={value} onChange={e => onChange(name, e.target.value)}
                    placeholder={meta.placeholder} required={meta.required} style={inputBase} />
            )}
        </div>
    );
};

// ─── TOAST ─────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) => (
    <motion.div initial={{ opacity: 0, x: 40, y: -10 }} animate={{ opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0, x: 40 }}
        style={{
            position: 'fixed', top: '80px', right: '24px', zIndex: 9999,
            padding: '16px 22px', borderRadius: '16px', maxWidth: '400px',
            background: toast.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
            color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5',
            fontSize: '14px', fontWeight: '500',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', gap: '10px',
        }}>
        <span style={{ fontSize: '18px' }}>{toast.type === 'success' ? '✅' : '❌'}</span>
        {toast.msg}
    </motion.div>
);

// ─── SHARED LAYOUT WRAPPER ─────────────────────────────────────────────────────
const PageShell = ({ user, toast, children }) => (
    <div style={{ background: 'radial-gradient(ellipse at 15% 20%, rgba(59,130,246,0.1) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(139,92,246,0.07) 0%, transparent 50%), #0a1628', minHeight: '100vh' }}>
        <div style={{
            position: 'fixed', inset: 0, zIndex: 0,
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
            backgroundSize: '56px 56px', pointerEvents: 'none',
        }} />
        <Navbar user={user} />
        <AnimatePresence>{toast && <Toast toast={toast} />}</AnimatePresence>
        <div style={{ paddingTop: '64px', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
            {children}
        </div>
    </div>
);

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
const ListProperty = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editPropertyId = searchParams.get('edit');

    const [user, setUser] = useState(null);
    const [mode, setMode] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [aiHighlighted, setAiHighlighted] = useState(new Set());
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [toast, setToast] = useState(null);
    const [parseLog, setParseLog] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [sttText, setSttText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [sttLoading, setSttLoading] = useState(false);
    const fileInputRef = useRef();
    const recognitionRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [propertyQA, setPropertyQA] = useState([]);
    const [qaAnswers, setQaAnswers] = useState({});

    useEffect(() => {
        api.get('/users/me').then(r => setUser(r.data.data.user)).catch(() => { });

        // If edit mode, load property data
        if (editPropertyId) {
            loadPropertyForEdit(editPropertyId);
        }
    }, [editPropertyId]);

    const loadPropertyForEdit = async (propertyId) => {
        try {
            const res = await api.get(`/properties/${propertyId}`);
            const property = res.data.data.property;

            // Populate form with existing data
            const editForm = {
                title: property.title || '',
                propertyType: property.propertyType || 'Apartment',
                listingType: property.listingType || 'Sale',
                description: property.description || '',
                address: property.address || '',
                city: property.city || '',
                state: property.state || '',
                pincode: property.pincode || '',
                landmark: property.landmark || '',
                price: property.price || '',
                negotiable: property.negotiable || false,
                maintenanceCharges: property.maintenanceCharges || '',
                area: property.area || '',
                areaUnit: property.areaUnit || 'sqft',
                bedrooms: property.bedrooms || '',
                bathrooms: property.bathrooms || '',
                balconies: property.balconies || '',
                floorNumber: property.floorNumber || '',
                totalFloors: property.totalFloors || '',
                furnishingStatus: property.furnishingStatus || 'Unfurnished',
                propertyAge: property.propertyAge || '',
                constructionStatus: property.constructionStatus || 'Ready to Move',
                availableFrom: property.availableFrom ? property.availableFrom.split('T')[0] : '',
                occupancyStatus: property.occupancyStatus || 'Vacant',
                listingStatus: property.listingStatus || 'Active',
                features: Array.isArray(property.features) ? property.features.join(', ') : '',
                vastuInfo: property.vastuInfo || '',
            };

            setForm(editForm);
            setIsEditMode(true);
            setMode('review');

            // Load Q&A if exists
            if (property.sellerQA && property.sellerQA.length > 0) {
                setPropertyQA(property.sellerQA);
                // Pre-populate answers
                const answers = {};
                property.sellerQA.forEach((qa, index) => {
                    answers[index] = qa.answer || '';
                });
                setQaAnswers(answers);
            }

            showToast('success', '✏️ Editing property. Update any fields and save.');
        } catch (err) {
            showToast('error', 'Failed to load property for editing.');
            navigate('/seller');
        }
    };

    const handleChange = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 5000);
    };

    const applyAIResult = (data, source, fieldsPopulated, total) => {
        const merged = { ...EMPTY_FORM };
        const highlighted = new Set();
        Object.keys(EMPTY_FORM).forEach(key => {
            const val = data[key];
            if (val !== null && val !== undefined && val !== '') {
                merged[key] = Array.isArray(val) ? val.join(', ') : String(val);
                highlighted.add(key);
            }
        });
        setForm(merged);
        setAiHighlighted(highlighted);
        setParseLog(`${source} · ${fieldsPopulated}/${total} fields populated`);
        showToast('success', `🤖 AI populated ${fieldsPopulated} of ${total} fields! Review & complete the rest.`);
        setMode('review');
        setStep(0);
    };

    // PDF upload
    const handlePDFUpload = async (file) => {
        if (!file) return;
        setPdfFile(file);
        setPdfLoading(true);
        try {
            const fd = new FormData();
            fd.append('document', file);
            const r = await api.post('/properties/parse-pdf', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            const { data: parsed } = r.data;
            applyAIResult(parsed.data, `Mistral OCR → ${parsed.source}`, parsed.fieldsPopulated, parsed.total);
        } catch (err) {
            showToast('error', 'PDF parsing failed. Switching to manual form.');
            setMode('review');
        } finally {
            setPdfLoading(false);
        }
    };

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer?.files[0] || e.target?.files[0];
        if (file) handlePDFUpload(file);
    }, []);

    // ── SECTION VALIDATION ───────────────────────────────────────────────────
    const validateSection = (sectionId) => {
        const required = SECTION_REQUIRED[sectionId] || {};
        const missing = Object.entries(required)
            .filter(([field]) => !form[field] || String(form[field]).trim() === '')
            .map(([, label]) => label);
        if (missing.length > 0) {
            showToast('error', `⚠️ Please fill required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
            return false;
        }
        return true;
    };

    // STT — async so we can await getUserMedia for permission prompt
    const toggleSTT = async () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { showToast('error', '❌ Speech recognition not supported. Please use Chrome or Edge.'); return; }
        if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }

        // Explicitly request mic permission — triggers browser permission dialog
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            showToast('error', '🎙️ Microphone access denied. Click the 🔒 icon in your address bar and allow microphone.');
            return;
        }

        const recognition = new SR();
        recognition.lang = 'en-IN';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (e) => setSttText(Array.from(e.results).map(r => r[0].transcript).join(' '));
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (err) => {
            setIsListening(false);
            showToast('error', `🎙️ Mic error: ${err.error}. Check browser permissions.`);
        };
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
    };

    const handleTextParse = async () => {
        if (sttText.trim().length < 5) { showToast('error', 'Please add more details.'); return; }
        setSttLoading(true);
        try {
            const r = await api.post('/properties/parse-text', { text: sttText });
            const { data: parsed } = r.data;
            applyAIResult(parsed.data, `Mistral (${parsed.source})`, parsed.fieldsPopulated, parsed.total);
        } catch {
            showToast('error', 'Parsing failed. You can fill the form manually.');
            setMode('review');
        } finally {
            setSttLoading(false);
        }
    };

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...form };
            ['price', 'maintenanceCharges', 'area', 'bedrooms', 'bathrooms', 'balconies', 'floorNumber', 'totalFloors', 'propertyAge'].forEach(k => {
                payload[k] = payload[k] !== '' && payload[k] !== null ? Number(payload[k]) : null;
            });
            payload.features = payload.features ? payload.features.split(',').map(f => f.trim()).filter(Boolean) : [];
            payload.location = `${payload.city}${payload.state ? ', ' + payload.state : ''}`;

            if (isEditMode && editPropertyId) {
                // Update existing property
                await api.patch(`/properties/${editPropertyId}`, payload);

                // Update Q&A answers if any were modified
                if (propertyQA.length > 0) {
                    for (let i = 0; i < propertyQA.length; i++) {
                        const answer = qaAnswers[i];
                        if (answer !== undefined && answer !== propertyQA[i].answer) {
                            // Only update if answer changed
                            await api.post(`/qa/answer/${editPropertyId}`, {
                                questionIndex: i,
                                answer: answer.trim() || null
                            });
                        }
                    }
                }

                setSuccess(true);
                showToast('success', '✅ Property updated successfully!');
                setTimeout(() => navigate('/seller'), 2200);
            } else {
                // Create new property
                const res = await api.post('/properties', payload);
                setSuccess(true);
                showToast('success', '🎉 Property listed successfully!');

                // Redirect to Q&A page with property ID
                const propertyId = res.data.data.property._id;
                setTimeout(() => navigate(`/property-qa?propertyId=${propertyId}`), 2200);
            }
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to save property.');
        } finally {
            setSubmitting(false);
        }
    };

    // ═══════════════════════════════════════════════
    // SCREEN 1 — MODE SELECTION
    // ═══════════════════════════════════════════════
    if (!mode) {
        const cards = [
            {
                mode: 'pdf', icon: '📄', label: 'PDF / Document', accent: '#3b82f6',
                grad: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.08))',
                title: 'Upload & Auto-Fill',
                desc: 'Drop a brochure or listing scan — Mistral OCR extracts and structures every detail instantly.',
                badge: 'Mistral OCR',
                steps: ['Drag & drop PDF/image', 'AI extracts all data', 'Review & publish'],
            },
            {
                mode: 'stt', icon: '🎤', label: 'Voice / Text', accent: '#8b5cf6',
                grad: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.08))',
                title: 'Speak or Describe',
                desc: 'Say "3BHK in Bandra, ₹1.2Cr, 1400 sqft" or type it. Mistral AI maps your words to the form automatically.',
                badge: 'Speech-to-Text + Mistral AI',
                steps: ['Speak or type details', 'Gemini parses intent', 'Review & publish'],
            },
            {
                mode: 'manual', icon: '✍️', label: 'Manual Wizard', accent: '#06b6d4',
                grad: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(8,145,178,0.08))',
                title: 'Step-by-Step Form',
                desc: 'Prefer full control? Fill 5 guided sections with smart inputs, toggles, and real-time validation.',
                badge: 'Guided 5-Step Wizard',
                steps: ['Basic → Location', 'Specs → Pricing', 'Availability & publish'],
            },
        ];

        return (
            <PageShell user={user} toast={toast}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '60px 32px' }}>

                    {/* Hero badge */}
                    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 18px', borderRadius: '999px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block', animation: 'pulse-glow 2s infinite' }} />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa', letterSpacing: '0.5px' }}>3 AI-Powered Ways to List</span>
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: '800', letterSpacing: '-1.5px', textAlign: 'center', marginBottom: '14px', lineHeight: 1.1 }}>
                        <span style={{ background: 'linear-gradient(135deg, #fff 0%, #93c5fd 50%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>How would you like</span>
                        <br />to list your property?
                    </motion.h1>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                        style={{ color: '#64748b', fontSize: '16px', textAlign: 'center', maxWidth: '480px', lineHeight: 1.7, marginBottom: '56px' }}>
                        Choose the fastest path — our AI handles the heavy lifting so you can focus on selling.
                    </motion.p>

                    {/* Cards grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', width: '100%', maxWidth: '980px' }}>
                        {cards.map((card, i) => (
                            <motion.button key={card.mode} type="button"
                                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 + 0.15 }}
                                whileHover={{ y: -8, boxShadow: `0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px ${card.accent}50` }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setMode(card.mode)}
                                style={{
                                    textAlign: 'left', cursor: 'pointer', border: `1px solid rgba(255,255,255,0.08)`,
                                    borderRadius: '24px', padding: '32px', background: 'rgba(13,21,38,0.75)',
                                    backdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column', gap: '20px',
                                    transition: 'border-color 0.3s', position: 'relative', overflow: 'hidden',
                                }}>
                                {/* Background glow */}
                                <div style={{ position: 'absolute', top: '-30%', right: '-20%', width: '200px', height: '200px', borderRadius: '50%', background: `radial-gradient(circle, ${card.accent}18 0%, transparent 70%)`, pointerEvents: 'none' }} />

                                {/* Icon + labels */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: card.grad, border: `1px solid ${card.accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>
                                        {card.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: '800', color: card.accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '5px' }}>{card.label}</div>
                                        <div style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: '700', color: 'white', lineHeight: 1.2 }}>{card.title}</div>
                                    </div>
                                </div>

                                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.65, flex: 1, position: 'relative' }}>{card.desc}</p>

                                {/* Badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: `${card.accent}12`, border: `1px solid ${card.accent}25`, position: 'relative' }}>
                                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: card.accent, flexShrink: 0 }} />
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: card.accent, letterSpacing: '0.3px' }}>{card.badge}</span>
                                </div>

                                {/* Steps */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                                    {card.steps.map((s, si) => (
                                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: `${card.accent}18`, border: `1px solid ${card.accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: card.accent, flexShrink: 0 }}>{si + 1}</div>
                                            <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>{s}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Arrow */}
                                <div style={{ position: 'absolute', bottom: '28px', right: '28px', width: '36px', height: '36px', borderRadius: '50%', background: `${card.accent}15`, border: `1px solid ${card.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.accent }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                        className="btn btn-ghost btn-sm" onClick={() => navigate('/seller')} style={{ marginTop: '36px', color: '#475569' }}>
                        ← Back to Dashboard
                    </motion.button>
                </div>
            </PageShell>
        );
    }

    // ═══════════════════════════════════════════════
    // SCREEN 2 — PDF UPLOAD
    // ═══════════════════════════════════════════════
    if (mode === 'pdf') {
        return (
            <PageShell user={user} toast={toast}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '60px 32px' }}>
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '600px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setMode(null)} style={{ marginBottom: '28px', color: '#475569' }}>← Change Method</button>

                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '999px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '16px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa', letterSpacing: '0.5px' }}>📄 PDF / IMAGE UPLOAD</span>
                            </div>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '32px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px', marginBottom: '10px' }}>
                                Upload Your Property<br />
                                <span style={{ background: 'linear-gradient(135deg, #60a5fa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Document</span>
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.7 }}>
                                Drop a brochure, listing sheet, or photo. <strong style={{ color: '#93c5fd' }}>Mistral OCR</strong> extracts and structures every field automatically.
                            </p>
                        </div>

                        {/* Drop zone */}
                        <div
                            onDrop={onDrop}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onClick={() => !pdfLoading && fileInputRef.current?.click()}
                            style={{
                                border: `2px dashed ${pdfFile ? 'rgba(16,185,129,0.5)' : dragOver ? 'rgba(59,130,246,0.7)' : 'rgba(99,179,237,0.25)'}`,
                                borderRadius: '24px', padding: '64px 40px', textAlign: 'center',
                                cursor: pdfLoading ? 'default' : 'pointer',
                                background: pdfFile ? 'rgba(16,185,129,0.05)' : dragOver ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)',
                                transition: 'all 0.3s',
                                boxShadow: dragOver ? '0 0 40px rgba(59,130,246,0.15)' : 'none',
                            }}>
                            {pdfLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ position: 'relative', width: '72px', height: '72px' }}>
                                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.15)', position: 'absolute' }} />
                                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#3b82f6', position: 'absolute', animation: 'spin 0.9s linear infinite' }} />
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>📄</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '17px', fontWeight: '700', color: '#60a5fa', fontFamily: 'Space Grotesk', marginBottom: '6px' }}>Processing with Mistral OCR...</div>
                                        <div style={{ fontSize: '13px', color: '#475569' }}>Extracting and structuring property data</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {[0, 1, 2].map(i => (
                                            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: `pulse-glow 1.2s ease-in-out ${i * 0.4}s infinite` }} />
                                        ))}
                                    </div>
                                </div>
                            ) : pdfFile ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>✅</div>
                                    <div style={{ fontFamily: 'Space Grotesk', fontSize: '17px', fontWeight: '700', color: '#34d399' }}>{pdfFile.name}</div>
                                    <div style={{ fontSize: '13px', color: '#475569' }}>{(pdfFile.size / 1024).toFixed(1)} KB — click to replace</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>📂</div>
                                    <div>
                                        <div style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>Drag & Drop or Click to Upload</div>
                                        <div style={{ fontSize: '13px', color: '#475569' }}>PDF, PNG, JPG supported · Max 10 MB</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {['PDF', 'PNG', 'JPG'].map(t => (
                                            <span key={t} style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '11px', fontWeight: '700', color: '#60a5fa' }}>{t}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={e => handlePDFUpload(e.target.files[0])} />

                        {parseLog && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '16px', padding: '13px 18px', borderRadius: '12px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', fontSize: '13px', fontFamily: 'monospace', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#3b82f6' }}>›</span> {parseLog}
                            </motion.div>
                        )}

                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setMode('review')} style={{ color: '#475569' }}>
                                Skip → Fill manually
                            </button>
                        </div>
                    </motion.div>
                </div>
            </PageShell>
        );
    }

    // ═══════════════════════════════════════════════
    // SCREEN 3 — VOICE / TEXT
    // ═══════════════════════════════════════════════
    if (mode === 'stt') {
        const examples = [
            '3BHK in Bandra, ₹1.2Cr, 1400 sqft, fully furnished',
            '2BHK for rent ₹35K/mo in Koramangala, semi-furnished',
            'Commercial 800 sqft for lease in Connaught Place',
        ];
        return (
            <PageShell user={user} toast={toast}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '60px 32px' }}>
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '640px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setMode(null)} style={{ marginBottom: '28px', color: '#475569' }}>← Change Method</button>

                        <div style={{ marginBottom: '28px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '999px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', marginBottom: '16px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '0.5px' }}>🎤 VOICE / TEXT INPUT</span>
                            </div>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '32px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px', marginBottom: '10px' }}>
                                Describe Your<br />
                                <span style={{ background: 'linear-gradient(135deg, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Property</span>
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.7 }}>
                                Speak naturally or type. <strong style={{ color: '#c4b5fd' }}>Mistral AI</strong> extracts all property details automatically from your description.
                            </p>
                        </div>

                        {/* Example pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                            <span style={{ fontSize: '11px', color: '#475569', fontWeight: '600', alignSelf: 'center' }}>Try:</span>
                            {examples.map(ex => (
                                <button key={ex} onClick={() => setSttText(ex)} type="button" style={{
                                    padding: '6px 14px', borderRadius: '999px',
                                    border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)',
                                    fontSize: '12px', color: '#a78bfa', cursor: 'pointer', fontFamily: 'Inter',
                                    transition: 'all 0.2s', fontWeight: '500',
                                }}>💡 {ex.slice(0, 34)}…</button>
                            ))}
                        </div>

                        {/* Textarea + mic */}
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <textarea
                                value={sttText} onChange={e => setSttText(e.target.value)}
                                placeholder='e.g. "3BHK flat for sale in Mumbai, Bandra, ₹1.2 Crore, 1400 sqft fully furnished, near Bandra Station, has swimming pool and gym..."'
                                rows={7}
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: isListening ? 'rgba(139,92,246,0.07)' : 'rgba(255,255,255,0.04)',
                                    border: `1.5px solid ${isListening ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.09)'}`,
                                    borderRadius: '18px', padding: '20px 72px 20px 20px',
                                    color: 'white', fontFamily: 'Inter', fontSize: '14px',
                                    lineHeight: 1.7, outline: 'none', resize: 'none',
                                    boxShadow: isListening ? '0 0 40px rgba(139,92,246,0.15)' : 'none',
                                    transition: 'all 0.3s',
                                }} />

                            {/* Mic button */}
                            <button type="button" onClick={toggleSTT} style={{
                                position: 'absolute', top: '16px', right: '16px',
                                width: '44px', height: '44px', borderRadius: '50%', border: 'none',
                                cursor: 'pointer', transition: 'all 0.25s',
                                background: isListening
                                    ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                                    : 'rgba(255,255,255,0.08)',
                                boxShadow: isListening ? '0 0 24px rgba(139,92,246,0.6), 0 0 0 6px rgba(139,92,246,0.15)' : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                            }}>
                                {isListening ? '⏹' : '🎤'}
                            </button>
                        </div>

                        {isListening && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '10px 16px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                                    {[1, 1.5, 1, 2, 1].map((h, i) => (
                                        <div key={i} style={{ width: '3px', height: `${h * 8}px`, borderRadius: '2px', background: '#8b5cf6', animation: `pulse-glow ${0.6 + i * 0.1}s ease-in-out infinite` }} />
                                    ))}
                                </div>
                                <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: '600' }}>Listening — speak clearly in English</span>
                            </motion.div>
                        )}

                        {/* Char count */}
                        {sttText.length > 0 && (
                            <div style={{ textAlign: 'right', fontSize: '12px', color: '#475569', marginBottom: '16px' }}>
                                {sttText.length} characters
                            </div>
                        )}

                        <button className="btn btn-primary btn-lg btn-full" onClick={handleTextParse}
                            disabled={sttLoading || sttText.length < 5}
                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 4px 24px rgba(139,92,246,0.4)' }}>
                            {sttLoading
                                ? <><div className="loader" style={{ width: '18px', height: '18px', borderTopColor: 'white' }} /> Analyzing with Mistral AI...</>
                                : <>🤖 Parse with Mistral AI <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg></>
                            }
                        </button>

                        {parseLog && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '16px', padding: '13px 18px', borderRadius: '12px', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)', fontSize: '13px', fontFamily: 'monospace', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#8b5cf6' }}>›</span> {parseLog}
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </PageShell>
        );
    }

    // ═══════════════════════════════════════════════
    // SCREEN 4 — REVIEW / MANUAL FORM
    // ═══════════════════════════════════════════════
    const currentSection = SECTIONS[step];
    const totalAI = aiHighlighted.size;
    const sectionAI = currentSection.fields.filter(f => aiHighlighted.has(f)).length;

    return (
        <PageShell user={user} toast={toast}>
            <div style={{ padding: '32px 40px 60px', maxWidth: '1080px', margin: '0 auto' }}>

                {/* ── HEADER ─────────────────────── */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/seller')} style={{ color: '#475569', flexShrink: 0 }}>← Back to Dashboard</button>
                        <div>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '22px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>
                                {isEditMode ? '✏️ Edit Property' : totalAI > 0 ? '🤖 Review AI-Filled Details' : '✍️ Property Details'}
                            </h2>
                            {totalAI > 0 && !isEditMode && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px', flexWrap: 'wrap' }}>
                                    <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', fontSize: '12px', fontWeight: '700', color: '#34d399' }}>
                                        ✓ {totalAI} fields auto-filled
                                    </span>
                                    {parseLog && <span style={{ fontSize: '12px', color: '#475569', fontFamily: 'monospace' }}>{parseLog}</span>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Progress */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '13px', fontWeight: '600' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {SECTIONS.map((_, i) => (
                                <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i <= step ? '#3b82f6' : 'rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.3s' }} />
                            ))}
                        </div>
                        <span>Step {step + 1}/{SECTIONS.length}</span>
                    </div>
                </motion.div>

                {/* ── SECTION TABS ───────────────── */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {SECTIONS.map((s, i) => {
                        const isActive = i === step;
                        const filled = s.fields.filter(f => aiHighlighted.has(f)).length;
                        return (
                            <button key={s.id} type="button" onClick={() => setStep(i)} style={{
                                display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px',
                                borderRadius: '12px', border: `1.5px solid ${isActive ? s.color + '60' : 'rgba(255,255,255,0.07)'}`,
                                background: isActive ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                                color: isActive ? s.color : '#475569', cursor: 'pointer', fontFamily: 'Inter',
                                fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', whiteSpace: 'nowrap',
                                boxShadow: isActive ? `0 0 16px ${s.color}20` : 'none',
                            }}>
                                <span style={{ fontSize: '14px' }}>{s.icon}</span>
                                {s.label}
                                {filled > 0 && (
                                    <span style={{ padding: '1px 7px', borderRadius: '999px', background: 'rgba(16,185,129,0.2)', fontSize: '10px', fontWeight: '800', color: '#34d399' }}>{filled}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── FORM CARD ──────────────────── */}
                <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">
                        <motion.div key={step}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                borderRadius: '24px', padding: '36px 40px',
                                background: 'rgba(13,21,38,0.8)', backdropFilter: 'blur(24px)',
                                border: `1px solid ${currentSection.color}20`,
                                boxShadow: `0 0 60px ${currentSection.color}08, 0 8px 40px rgba(0,0,0,0.4)`,
                            }}>

                            {/* Section header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `${currentSection.color}15`, border: `1px solid ${currentSection.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                                        {currentSection.icon}
                                    </div>
                                    <div>
                                        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '20px', color: 'white' }}>{currentSection.label}</h3>
                                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{currentSection.fields.length} fields in this section</div>
                                    </div>
                                </div>
                                {sectionAI > 0 && (
                                    <div style={{ padding: '6px 14px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', fontSize: '12px', fontWeight: '700', color: '#34d399' }}>
                                        ✓ {sectionAI} AI-filled
                                    </div>
                                )}
                            </div>

                            {/* Fields grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '22px' }}>
                                {currentSection.fields.map(name => (
                                    <div key={name} style={{ gridColumn: ['description', 'address', 'features'].includes(name) ? '1 / -1' : 'auto' }}>
                                        <Field name={name} value={form[name]} onChange={handleChange} highlighted={aiHighlighted.has(name)} />
                                    </div>
                                ))}
                            </div>

                            {/* Navigation */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '36px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <button type="button" className="btn btn-secondary"
                                    onClick={() => setStep(s => Math.max(0, s - 1))}
                                    disabled={step === 0}
                                    style={{ opacity: step === 0 ? 0.4 : 1 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                                    Previous
                                </button>

                                {step < SECTIONS.length - 1 ? (
                                    <button type="button" className="btn btn-primary"
                                        onClick={() => {
                                            if (!validateSection(currentSection.id)) return;
                                            setStep(s => Math.min(SECTIONS.length - 1, s + 1));
                                        }}>
                                        Next Section
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>
                                ) : (
                                    <button type="submit" className="btn btn-primary btn-lg"
                                        disabled={submitting || success}
                                        style={{
                                            background: success
                                                ? 'linear-gradient(135deg, #10b981, #059669)'
                                                : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                            boxShadow: success ? '0 4px 24px rgba(16,185,129,0.4)' : '0 4px 24px rgba(59,130,246,0.4)',
                                            minWidth: '180px',
                                        }}>
                                        {success ? <>✅ {isEditMode ? 'Updated!' : 'Listed!'}</> : submitting
                                            ? <><div className="loader" style={{ width: '16px', height: '16px' }} /> {isEditMode ? 'Updating...' : 'Publishing...'}</>
                                            : <>{isEditMode ? '💾 Save Changes' : '🚀 Publish Property'}</>}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </form>

                {/* AI Legend */}
                {totalAI > 0 && (
                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#475569' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', flexShrink: 0 }} />
                        Green fields were auto-populated by AI. Review them before publishing.
                    </div>
                )}

                {/* ── Q&A SECTION (Edit Mode Only) ───────────────── */}
                {isEditMode && propertyQA.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            marginTop: '40px',
                            borderRadius: '24px',
                            padding: '36px 40px',
                            background: 'rgba(13,21,38,0.8)',
                            backdropFilter: 'blur(24px)',
                            border: '1px solid rgba(139,92,246,0.2)',
                            boxShadow: '0 0 60px rgba(139,92,246,0.08), 0 8px 40px rgba(0,0,0,0.4)',
                        }}
                    >
                        {/* Q&A Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '16px',
                                background: 'rgba(139,92,246,0.15)',
                                border: '1px solid rgba(139,92,246,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '22px'
                            }}>
                                💬
                            </div>
                            <div>
                                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '20px', color: 'white' }}>
                                    Buyer Questions & Answers
                                </h3>
                                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                                    {propertyQA.filter(q => qaAnswers[propertyQA.indexOf(q)]?.trim()).length} of {propertyQA.length} answered
                                </div>
                            </div>
                        </div>

                        {/* Questions List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {propertyQA.map((qa, index) => (
                                <div
                                    key={index}
                                    style={{
                                        padding: '24px',
                                        borderRadius: '16px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    {/* Category Badge */}
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        background: 'rgba(139,92,246,0.1)',
                                        border: '1px solid rgba(139,92,246,0.2)',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        color: '#a78bfa',
                                        marginBottom: '12px'
                                    }}>
                                        {qa.category}
                                    </div>

                                    {/* Question */}
                                    <div style={{
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        color: 'white',
                                        marginBottom: '12px',
                                        lineHeight: '1.5'
                                    }}>
                                        {index + 1}. {qa.question}
                                    </div>

                                    {/* Answer Input */}
                                    <textarea
                                        value={qaAnswers[index] || ''}
                                        onChange={(e) => setQaAnswers(prev => ({ ...prev, [index]: e.target.value }))}
                                        placeholder="Type your answer here... (or leave blank to skip)"
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1.5px solid rgba(255,255,255,0.09)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            color: 'white',
                                            fontFamily: 'Inter',
                                            fontSize: '14px',
                                            lineHeight: '1.6',
                                            outline: 'none',
                                            resize: 'vertical',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                                    />

                                    {/* Existing Answer Indicator */}
                                    {qa.answer && qa.answer !== qaAnswers[index] && (
                                        <div style={{
                                            marginTop: '8px',
                                            fontSize: '12px',
                                            color: '#64748b',
                                            fontStyle: 'italic'
                                        }}>
                                            Previous answer: {qa.answer.substring(0, 100)}{qa.answer.length > 100 ? '...' : ''}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Q&A Info */}
                        <div style={{
                            marginTop: '24px',
                            padding: '16px',
                            borderRadius: '12px',
                            background: 'rgba(59,130,246,0.05)',
                            border: '1px solid rgba(59,130,246,0.15)',
                            fontSize: '13px',
                            color: '#94a3b8',
                            lineHeight: '1.6'
                        }}>
                            💡 <strong style={{ color: '#60a5fa' }}>Tip:</strong> Answering these questions helps buyers make informed decisions and reduces unnecessary inquiries. Only answered questions are shown to buyers.
                        </div>
                    </motion.div>
                )}
            </div>
        </PageShell>
    );
};

export default ListProperty;
