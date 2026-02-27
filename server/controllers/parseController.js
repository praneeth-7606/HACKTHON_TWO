const multer = require('multer');
const { parsePDFWithMistral, parseTextWithMistral } = require('../services/parseService');

// ─── MULTER: MEMORY STORAGE (no disk writes, low memory) ─────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, PNG, JPG files are allowed'), false);
        }
    }
});

// ─── POST /api/v1/properties/parse-pdf ───────────────────────────────────────
const parsePDF = [
    upload.single('document'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ status: 'fail', message: 'No file uploaded. Send a PDF or image as "document".' });
            }
            console.log(`[PARSE] Received file: ${req.file.originalname} | size=${(req.file.size / 1024).toFixed(1)}KB | type=${req.file.mimetype}`);

            const result = await parsePDFWithMistral(req.file.buffer, req.file.mimetype);

            return res.status(200).json({
                status: 'success',
                message: `Extracted ${result.fieldsPopulated} of ${result.total} fields via ${result.source}`,
                data: result
            });
        } catch (err) {
            console.error('[PARSE] parsePDF controller error:', err.message);
            return res.status(500).json({ status: 'fail', message: err.message });
        }
    }
];

// ─── POST /api/v1/properties/parse-text ──────────────────────────────────────
const parseText = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length < 5) {
            return res.status(400).json({ status: 'fail', message: 'Provide at least 5 characters of property description in "text" field.' });
        }
        console.log(`[PARSE] Received text input: "${text.slice(0, 80)}..."`);

        const result = await parseTextWithMistral(text.trim());

        return res.status(200).json({
            status: 'success',
            message: `Extracted ${result.fieldsPopulated} of ${result.total} fields via ${result.source}`,
            data: result
        });
    } catch (err) {
        console.error('[PARSE] parseText controller error:', err.message);
        return res.status(500).json({ status: 'fail', message: err.message });
    }
};

module.exports = { parsePDF, parseText };
