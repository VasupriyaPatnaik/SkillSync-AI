# 🎯 SkillSync-AI

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-13AA52?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat-square&logo=python)](https://www.python.org/)

**Intelligent job-candidate matching powered by AI embeddings & cosine similarity**

[Features](#-features) • [Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [API Docs](#-api-endpoints) • [Contributing](#-contributing)

</div>

---

## 🚀 Live Demo

[https://skillsync-ai-6xsf.onrender.com](https://skillsync-ai-6xsf.onrender.com)

---

## 📋 Overview

**SkillSync-AI** is an intelligent platform that analyzes developer profiles across multiple coding platforms and matches them with job opportunities using advanced **vector embeddings** and **cosine similarity**.

Instead of traditional keyword matching, our system understands the *semantic meaning* of a developer's skills, experience, and coding practice—just like Netflix recommends movies based on what you enjoy watching.

### 🎯 The Problem We Solve

- ❌ Traditional job boards use simple keyword matching—missing qualified candidates
- ❌ Recruiters spend hours manually reviewing profiles
- ❌ Candidates don't know if they're actually a good fit for a role
- ✅ **SkillSync-AI** uses AI to understand coding expertise and make intelligent matches

---

## ✨ Features

### 🔗 Multi-Platform Integration
- **GitHub**: Analyze repositories, commit history, contributions, and open-source impact
- **LeetCode**: Track problem-solving abilities across difficulty levels
- **Codeforces**: Evaluate competitive programming rating and growth
- **CodeChef**: Monitor competitive coding achievements and ratings
- **Resume**: Extract skills, experience, and education with NLP

### 🤖 AI-Powered Analysis
- **Vector Embeddings**: Convert profiles to 384-dimensional semantic vectors using BAAI/bge-small-en-v1.5
- **Cosine Similarity Matching**: Find jobs with >75% compatibility scores
- **Intelligent Insights**: AI-powered recommendations using Groq + LangChain
- **Real-time Processing**: Instant embeddings and match calculations

### 👤 User Features
- 🔐 Secure authentication with JWT & bcrypt
- 📊 Comprehensive dashboard with profile insights
- 📈 Analysis history and trend tracking
- 🎨 Beautiful React UI with Tailwind CSS
- 📱 Responsive design for all devices

### 🔄 Data Management
- MongoDB collections for each platform's data
- Automatic data synchronization and updates
- Efficient vector storage and retrieval with FAISS
- Comprehensive logging and validation

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│                    (React 19 + Tailwind)                         │
└────────────────┬───────────────────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────────────────┐
│                      EXPRESS.JS BACKEND                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │   Auth      │  │   APIs      │  │   Data Processing    │   │
│  │  Routes     │  │  for        │  │   - Upload handler   │   │
│  │             │  │  Platforms  │  │   - Resume parser    │   │
│  └─────────────┘  └─────────────┘  └──────────────────────┘   │
└────────────────┬───────────────────────────────────────────────┘
                 │
         ┌────────┼────────┐
         │                 │
┌───────▼────┐   ┌────────▼────────────┐
│  MongoDB   │   │   Python Services   │
│  Database  │   │  ┌────────────────┐ │
│            │   │  │ Embedding Gen  │ │
│ Collections│   │  │ (FastEmbed)    │ │
│ - Users    │   │  ├────────────────┤ │
│ - GitHub   │   │  │ FAISS Vector   │ │
│ - LeetCode │   │  │ Indexing       │ │
│ - Resume   │   │  ├────────────────┤ │
│ - Analysis │   │  │ Similarity Cal │ │
│ - Embeddings   │  └────────────────┘ │
└────────────┘   └────────────────────┘
```

### 🔄 How It Works (5 Phases)

**Phase 1: Data Collection**
- User connects platform accounts (GitHub, LeetCode, etc.)
- Backend fetches and stores platform-specific data

**Phase 2: Text Preprocessing**
- Convert structured data into semantic text descriptions
- Example: GitHub followers, stars, commits → meaningful narrative

**Phase 3: Embedding Generation**
- Process text through ML model → 384-dimensional vectors
- Normalize vectors for fair comparison
- Store in MongoDB for quick retrieval

**Phase 4: Job Profile Encoding**
- Convert job descriptions to embeddings
- Store in vector database (FAISS)

**Phase 5: Matching & Analysis**
- Calculate cosine similarity between candidate & job embeddings
- Return top matches with compatibility scores
- Provide AI-powered insights and recommendations

---

## 🛠️ Tech Stack

### Backend
```
Node.js + Express.js
├── Authentication: JWT + bcrypt
├── Database: MongoDB + Mongoose ODM
├── File Upload: Multer
├── AI Integration: Groq SDK + LangChain
├── Web Scraping: Cheerio + Axios
└── Validation: Joi + custom validation middleware
```

### Frontend
```
React 19
├── Routing: React Router DOM v7
├── Styling: Tailwind CSS + PostCSS
├── Icons: Lucide React
├── Testing: Jest + React Testing Library
└── Build: Create React App
```

### Python/ML Services
```
Python 3.8+
├── Embeddings: FastEmbed (BAAI/bge-small-en-v1.5)
├── Vector Search: FAISS
├── Database: PyMongo
├── NLP: spaCy
├── Resume Parsing: PyPDF2 + python-docx
├── ML: scikit-learn (preprocessing & similarity)
└── Config: python-dotenv
```

---

## 🚀 Getting Started

### Quick Start (TL;DR)

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm start

# Terminal 3 - Python service
cd python
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Prerequisites
- **Node.js**: 18.x or higher
- **Python**: 3.8 or higher
- **MongoDB**: 5.0+ (local or Atlas)
- **npm**: 9.x or higher

### Environment Setup

1. **Clone & Navigate**
```bash
cd final-year-project
```

2. **Backend Configuration**
```bash
cd backend

# Create .env file
cat > .env << EOF
PORT=5000
MONGODB_CONNECTION=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/profile_analyzer
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:3000
PYTHON_SERVICE_URL=http://localhost:8000
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
# Add GITHUB_TOKEN if needed
EOF

# Install dependencies
npm install

# Validate configuration
npm run validate

# Start development server
npm run dev
```

3. **Frontend Configuration**
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm start
# Opens http://localhost:3000
```

4. **Python/ML Services**
```bash
cd ../python

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cat > .env << EOF
MONGODB_CONNECTION=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/profile_analyzer
EOF
```

### Verify Installation

```bash
# Backend: Validate configuration
cd backend && npm run validate

# Frontend: Access dashboard
open http://localhost:3000

# Python: Test embedding generation
cd python && python main.py
```

---

## 📚 Project Structure

```
final-year-project/
│
├── backend/                    # Node.js / Express Server
│   ├── src/
│   │   ├── app.js             # Express app setup
│   │   ├── config/            # Database & LLM configs
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   │   └── platforms/     # Platform integrations
│   │   ├── middlewares/       # Auth & file upload
│   │   └── uploads/           # Temporary file storage
│   ├── package.json           # Dependencies
│   └── validate-config.js     # Config validation script
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── pages/            # Route pages
│   │   ├── context/          # Auth context provider
│   │   ├── App.js            # Main app component
│   │   └── index.css         # Global styles
│   ├── public/               # Static assets
│   ├── tailwind.config.js    # Tailwind configuration
│   └── package.json          # Dependencies
│
├── python/                    # ML/Embedding Services
│   ├── main.py               # Entry point
│   ├── analyzeprofile.py     # Profile analysis
│   ├── preprocess.py         # Text preprocessing
│   ├── resumeparser.py       # Resume extraction
│   ├── skillextractor.py     # Skill mining
│   ├── requirements.txt      # Python dependencies
│   └── WEIGHT_JUSTIFICATION.md
│
└── README.md                 # This file
```

---

## 📡 API Endpoints

### Authentication
```
POST   /api/signup                 Register new account
POST   /api/login                  Login user
POST   /api/logout                 Logout user
```

### Profile & Platform Integration
```
GET    /api/profile/view             Get logged-in user profile
PATCH  /api/profile/update           Update profile fields
DELETE /api/profile/delete           Delete account

GET    /api/profile/:username        Fetch and save LeetCode profile
```

### Resume Management
```
POST   /api/resume/upload            Upload/parse resume and optionally scrape profiles
GET    /api/resume/parsed/:userId    Get latest parsed resume for a user
```

### Analysis & Matching
```
POST   /api/analysis/run              Run profile analysis against job role/description
GET    /api/analysis/:userId          Get latest analysis + LLM suggestions
GET    /api/analysis/history/:userId  Get analysis history with filters/pagination
```

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 🎯 Usage Examples

### 1. User Registration & Login
```javascript
// Register
POST /api/signup
{
  "firstName": "John",
  "lastName": "Developer",
  "email": "dev@example.com",
  "password": "secure_password1"
}

// Login
POST /api/login
{
  "email": "dev@example.com",
  "password": "secure_password1"
}
```

### 2. Connect GitHub Account
```javascript
POST /api/resume/upload
Content-Type: multipart/form-data
profileUrls=[{"profile":"github","profileUrl":"https://github.com/johndoe"}]
// Returns: scrape + merge + preprocess pipeline status
```

### 3. Upload & Parse Resume
```javascript
POST /api/resume/upload
Content-Type: multipart/form-data
[PDF or DOCX file]
// Returns: extracted skills, experience, education
```

### 4. Find Job Matches
```javascript
POST /api/analysis/run
{
  "jobRole": "Backend Developer",
  "jobDescription": "We need a Node.js developer with React experience..."
}
// Returns: analysis scores + explanation
```

### 5. Get AI Insights
```javascript
GET /api/analysis/:userId
// Returns latest analysis + AI suggestions/history
```

---

## 🔐 Security Features

- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **bcrypt Hashing**: Password encryption (10 rounds)
- ✅ **CORS Protection**: Configured whitelist of origins
- ✅ **Input Validation**: Request payloads validated with Joi schemas
- ✅ **Authentication Middleware**: Protected routes
- ✅ **Secure Headers**: HTTP security headers
- ✅ **Rate Limiting**: API request throttling to prevent abuse
- ✅ **Environment Variables**: Sensitive data in .env

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
```bash
git clone https://github.com/yourusername/skillsync-ai.git
cd skillsync-ai
```

2. **Create a feature branch**
```bash
git checkout -b feature/amazing-feature
```

3. **Make your changes**
```bash
# Backend changes
cd backend && npm run dev

# Frontend changes
cd frontend && npm start

# Python changes
cd python && python main.py
```

4. **Commit with clear messages**
```bash
git commit -m "feat: add amazing-feature"
# Format: feat, fix, docs, style, refactor, test, chore
```

5. **Push and create a Pull Request**
```bash
git push origin feature/amazing-feature
```

### Development Guidelines
- Follow existing code style
- Write meaningful commit messages
- Update tests for new features
- Document complex algorithms
- Test across Node, React, and Python stacks

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongod --version
# Or use MongoDB Atlas connection string
MONGODB_CONNECTION=mongodb+srv://user:pass@cluster.mongodb.net/devprofile
```

### Python Virtual Environment Issues
```bash
# Recreate venv
rm -rf python/venv
python -m venv python/venv
source python/venv/bin/activate
pip install -r python/requirements.txt
```

### CORS Errors
```bash
# Verify CLIENT_URL in backend .env
CLIENT_URL=http://localhost:3000
# Check frontend API calls point to http://localhost:5000
```

### Embedding Generation Slow
```bash
# Download model once (caches locally)
python -c "from fastembed import TextEmbedding; TextEmbedding('BAAI/bge-small-en-v1.5')"
```

---

## 📝 Configuration Files

### Required Environment Variables

**Backend (.env)**
```env
PORT=5000
MONGODB_CONNECTION=mongodb://localhost:27017/devprofile
JWT_SECRET=your_secret_key_min_32_chars
CLIENT_URL=http://localhost:3000
PYTHON_SERVICE_URL=http://localhost:8000
GROQ_API_KEY=key_from_groq_ai
GITHUB_TOKEN=optional
GROQ_MODEL=llama-3.1-8b-instant
```

**Frontend (.env)** (if needed)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

**Python (.env)**
```env
MONGODB_CONNECTION=mongodb://localhost:27017/devprofile
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
```

---

## 📚 Additional Resources

- [SYSTEM_EXPLANATION.md](./SYSTEM_EXPLANATION.md) - Deep dive into the matching algorithm
- [Express.js Docs](https://expressjs.com/)
- [MongoDB Mongoose](https://mongoosejs.com/)
- [React Documentation](https://react.dev/)
- [FastEmbed Documentation](https://qdrant.github.io/fastembed/)
- [FAISS Documentation](https://github.com/facebookresearch/faiss)

---

## 📞 Support

- 📧 Email: support@skillsync-ai.dev
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/discussions)

---

##  Acknowledgments

- **BAAI/bge-small-en-v1.5** for embedding model
- **Groq AI** for LLM inference
- **FAISS** for vector similarity search
- **Qdrant** for FastEmbed library
- **MongoDB** for document database
- **React Team** for modern UI framework

---

<div align="center">

### ⭐ If you found this project helpful, please star it!

Made with ❤️ by the SkillSync-AI Team

[Back to Top](#-skillsync-ai)

</div>
