# 🏡 EstatePulse AI: Next-Gen Real Estate Intelligence

> **Transforming property transactions through AI-driven lead scoring, smart search, and automated seller accountability.**

[![Built with Gemini 2.5](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-blueviolet?style=for-the-badge)](https://deepmind.google/technologies/gemini/)
[![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20LangChain-blue?style=for-the-badge)](https://www.mongodb.com/)
[![Status](https://img.shields.io/badge/Status-Beta-orange?style=for-the-badge)]()

---

## 🌟 The Vision

EstatePulse AI is an intelligent ecosystem designed to solve the two biggest pain points in real estate: **Lead Qualification** and **Seller Responsiveness**. By leveraging **Google Gemini** and **LangChain**, we've built a platform that thinks, scores, and holds stakeholders accountable through a sophisticated behavioral analysis engine.

---

## 🚀 Key Innovation Pillars

### 1. 🔥 Intelligent Lead Scoring (0-100)
Our algorithm analyzes buyer behavior across five distinct dimensions to calculate a real-time "Intent Score":

| Component | Max Points | Criteria |
| :--- | :--- | :--- |
| **Profile Completeness** | 15 pts | Name, Email, Phone, Profession, Address verification. |
| **Exploration Depth** | 25 pts | Scroll depth (>80%), View time (>2m), Images viewed, Q&A engagement. |
| **Engagement** | 20 pts | Likes, Saves, and repeat view counts. |
| **AI Interaction** | 15 pts | Depth & quality of questions asked to the AI Property Agent. |
| **Owner Contact** | 25 pts | Direct messaging the owner/seller via the platform. |

**Lead Tiers:** `HOT (80+)` | `WARM (60+)` | `COLD (40+)` | `LOW (<40)`

### 2. 🤖 AI Orchestration (LangChain + Gemini)
The property search experience is entirely conversation-driven:
- **Natural Language Search**: Context-aware queries like *"Find me a 4BHK villa with a pool near Indiranagar under 5Cr"*.
- **Specialized AI Tools**: Seamless integration with **Google Maps** (location analysis), **OpenWeather** (climate data), and **Property Knowledge Base**.
- **Automated Q&A**: Every listing features AI-generated property-specific questions, with answers curated from seller-provided documents.

### 3. ⚖️ Dynamic Seller Accountability (SLA)
We don't just set deadlines; we adjust them based on real-world seller workload:
- **Base SLA**: Ranges from **15 minutes** (HOT leads) to **24 hours** (LOW leads).
- **Workload Multipliers**:
    - **Queue Multiplier**: Increases SLA by 20% for every 5 leads in the seller's queue (Max 2x).
    - **Active Multiplier**: Increases SLA by 15% for every 3 unresponded leads.
- **Auto-Escalation Pipeline**:
    - **Stage 4 (150% SLA)**: Property hidden for 24h, Seller rating drops -10 points, Buyer receives apology.
    - **Stage 5 (200% SLA)**: **Account Suspension (7 Days)**, all listings delisted, Admin manual approval required for reactivation.

---

## 🗺️ System Architecture

```mermaid
graph TD
    subgraph "Client Layer (React 19)"
        A[Vite 6 / Tailwind CSS] --> B[Framer Motion UI]
        B --> C[Behavioral Tracking SDK]
    end

    subgraph "AI Logic (LangChain)"
        D[AI Orchestrator] --> E[Gemini 2.5 Flash]
        D --> F[Maps & Weather Tools]
        D --> G[Vector Store / Property DB]
    end

    subgraph "Backend Core (Express 5)"
        H[API Gateway] --> I[Lead Scoring Service]
        H --> J[Accountability Engine]
        H --> K[ESM (Email/SMS) Service]
        H --> L[Admin Control Plane]
    end

    subgraph "Data Layer"
        M[(MongoDB Atlas)]
        N[(Redis Cache)]
    end

    C <--> H
    H <--> D
    H <--> M
```

---

## 🛠️ Tech Stack & Services

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion, Radix UI |
| **Backend** | Node.js 22, Express 5, Mongoose |
| **AI/ML** | Google Gemini 1.5/2.5 Flash, LangChain, Mistral OCR |
| **Integrations** | Google Maps API, OpenWeather API, Nodemailer (SMTP) |
| **DevOps** | Pino Logging, Zod Validation, JWT Auth |

---

## 📡 API Reference (Core Endpoints)

### Properties & AI
- `POST /api/v1/properties/parse-pdf` - AI context extraction from brochures.
- `POST /api/v1/properties/:id/summarize` - Instant AI property summaries.
- `POST /api/v1/search/properties` - Smart natural language search.

### Leads & Tracking
- `POST /api/v1/leads/track/view/:id` - Log property engagement.
- `POST /api/v1/leads/track/ai` - Log AI agent interactions.
- `PATCH /api/v1/leads/lead/:id/respond` - Mark SLA compliance.

### Admin & Control
- `GET /api/v1/admin/dashboard/stats` - Real-time platform health.
- `PATCH /api/v1/admin/properties/:id/approve` - Curate/Approve new listings.

---

## 🚦 Getting Started

### Prerequisites
- **Node.js**: v22.x
- **MongoDB**: v6.0+
- **API Keys**: Google Gemini, OpenWeather, Google Maps.

### Step 1: Clone & Install
```bash
git clone https://github.com/praneeth-7606/HACKTHON_TWO.git
cd HACKTHON_TWO

# Install Backend & Client
cd Server && npm install
cd ../Client && npm install
```

### Step 2: Environment Setup (`Server/.env`)
```env
PORT=5000
MONGODB_URI=your_mongo_uri
JWT_SECRET=your_32_char_secret
GEMINI_API_KEY=your_gemini_key
OPENWEATHER_API_KEY=your_weather_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
```

### Step 3: Launch
```bash
# Terminal 1: Server
cd Server && npm run dev

# Terminal 2: Client
cd Client && npm run dev
```

---

## 🤝 Contributing
1. Fork the project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Open a Pull Request.

---

<p align="center">Made with ❤️ for the future of Real Estate at the AI Hackathon.</p>
