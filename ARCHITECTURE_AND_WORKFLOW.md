# 🏗️ SYSTEM ARCHITECTURE & COMPLETE WORKFLOW
## How SkillSync-AI Works - Visual & Technical Guide

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Complete Workflow](#complete-workflow)
4. [Data Flow Diagram](#data-flow-diagram)
5. [Processing Pipeline](#processing-pipeline)
6. [Database Schema](#database-schema)

---

## System Overview

### What is SkillSync-AI Doing?

```
┌────────────────────────────────────────────────────────────────┐
│                    USER'S JOURNEY                              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "I want to know if I'm good for this job"                    │
│           ↓                                                     │
│  Paste job description into SkillSync-AI                       │
│           ↓                                                     │
│  AI analyzes your profiles + job                               │
│  (checks: GitHub portfolio, LeetCode skills, etc.)             │
│           ↓                                                     │
│  System compares using AI (vector similarity)                  │
│           ↓                                                     │
│  "You're 78% compatible! Here's why..."                        │
│           ↓                                                     │
│  Get insights to improve your profile                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### What Runs Where? (4 Independent Services)

```
┌─────────────────────────────────────────────────────────────────────┐
│                YOUR COMPUTER (Local Machine)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ FRONTEND (React User Interface)                 :3000     │   │
│  │ • Login/Signup page                                        │   │
│  │ • Dashboard                                                │   │
│  │ • Profile connection UI                                    │   │
│  │ • Analysis results display                                 │   │
│  │ • Beautiful Tailwind CSS design                            │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │ (HTTP requests)                           │
│                       ↓                                           │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ BACKEND (Express API Server)                   :5000     │   │
│  │ • User authentication                                      │   │
│  │ • API endpoints for all features                           │   │
│  │ • Route handlers                                           │   │
│  │ • Error handling                                           │   │
│  │ • Request validation                                       │   │
│  │ • Middleware (CORS, JWT, logging)                          │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │ (Request-Response)                       │
│                       ↓                                           │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ PYTHON SERVICE (AI Engine)                      :5001      │  │
│  │ • FastEmbed (generates vectors from text)                  │  │
│  │ • FAISS (fast similarity search)                           │  │
│  │ • Vector normalization                                     │  │
│  │ • Embedding processing                                     │  │
│  │ • Model caching for speed                                  │  │
│  └────────────────────┬──────────────────────────────────────┘  │
│                       │ (Vectors & numbers)                      │
│                       ↓                                           │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ MONGODB DATABASE (Data Storage)         :27017            │  │
│  │ • User accounts                                            │  │
│  │ • GitHub data                                              │  │
│  │ • LeetCode statistics                                      │  │
│  │ • Resume information                                       │  │
│  │ • Generated embeddings (vector storage)                    │  │
│  │ • Analysis history                                         │  │
│  │ • Compatibility scores                                     │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack Breakdown

```
FRONTEND
├── React 19 (User Interface Library)
├── React Router (Page Navigation)
├── Tailwind CSS (Styling)
├── Lucide React (Icons)
└── HTTP Requests to Backend

BACKEND
├── Node.js (Runtime)
├── Express.js (Web Framework)
├── MongoDB Driver (Database Connection)
├── Mongoose (Data Modeling)
├── JWT (Authentication)
├── Bcrypt (Password Encryption)
├── Axios (HTTP Requests to external APIs)
├── Winston (Logging)
└── Groq SDK (AI Insights)

PYTHON SERVICE
├── FastEmbed (Embedding Generation)
├── FAISS (Vector Search)
├── PyMongo (MongoDB Connection)
├── NumPy (Numerical Computing)
└── Pandas (Data Processing)

DATABASE
├── MongoDB (NoSQL Document Database)
└── Collections:
    ├── users
    ├── githubdatas
    ├── leetcodedatas
    ├── codeforcesDatas
    ├── codechefdatas
    ├── resumeparseddatas
    ├── embeddings
    ├── analysishistories
    └── finalresults
```

---

## Complete Workflow

### Full Execution Flow (Step by Step)

#### PHASE 1: USER REGISTRATION & LOGIN

```
┌─────────────────────────────────────────────────────────────┐
│                    SIGN UP PROCESS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User enters:                                               │
│  ├── Full Name: "John Developer"                            │
│  ├── Email: "john@example.com"                              │
│  └── Password: "SecurePass123!"                             │
│              ↓                                              │
│  Frontend sends to Backend: POST /api/auth/signup           │
│              ↓                                              │
│  Backend validates:                                         │
│  ├── Email not already registered ✓                         │
│  ├── Password meets requirements ✓                          │
│  └── Data format is valid ✓                                │
│              ↓                                              │
│  Backend processes:                                         │
│  ├── Hash password with bcrypt (SecurePass123! → asd@#$%)  │
│  └── Create user document in MongoDB                        │
│              ↓                                              │
│  MongoDB stores:                                            │
│  {                                                          │
│    "_id": "507f1f77bcf86cd799439011",                       │
│    "name": "John Developer",                                │
│    "email": "john@example.com",                             │
│    "password": "$2b$10$encrypted_hash...",  ← NO REAL PASS  │
│    "createdAt": "2026-04-04T10:30:00Z"                      │
│  }                                                          │
│              ↓                                              │
│  Backend returns:                                           │
│  {                                                          │
│    "success": true,                                         │
│    "message": "Account created successfully",               │
│    "redirectTo": "/login"                                   │
│  }                                                          │
│              ↓                                              │
│  Frontend redirects to Login page                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘

LOGIN PROCESS
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User enters: email + password                              │
│              ↓                                              │
│  Backend finds user in MongoDB                              │
│              ↓                                              │
│  Backend compares passwords:                                │
│  - Input: "SecurePass123!"                                  │
│  - Stored: "$2b$10$encrypted_hash..."                       │
│  - Match? YES ✓                                             │
│              ↓                                              │
│  Backend generates JWT token:                               │
│  {                                                          │
│    "userId": "507f1f77bcf86cd799439011",                    │
│    "email": "john@example.com",                             │
│    "exp": "2026-04-11T10:30:00Z"  ← Expires in 7 days      │
│  }                                                          │
│              ↓                                              │
│  Backend returns: { token: "eyJhbGciOi..." }               │
│              ↓                                              │
│  Frontend stores token in cookie                            │
│              ↓                                              │
│  Redirect to Dashboard                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

#### PHASE 2: CONNECTING PLATFORM (GitHub Example)

```
┌───────────────────────────────────────────────────────────────┐
│              GITHUB PROFILE CONNECTION                        │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  USER ACTION                                                  │
│  └─ Clicks "Connect GitHub" button in Profile page           │
│              ↓                                                │
│  FRONTEND                                                     │
│  └─ Sends to Backend: POST /api/profile/connect/github       │
│     Payload: { username: "john-developer" }                  │
│              ↓                                                │
│  BACKEND                                                      │
│  ├─ Validates JWT token (user is logged in) ✓                │
│  ├─ Validates username format                                │
│  └─ Makes API request to GitHub                              │
│     GET https://api.github.com/users/john-developer          │
│              ↓                                                │
│  GITHUB API RESPONSE (takes 1-2 seconds)                     │
│  {                                                            │
│    "login": "john-developer",                                │
│    "name": "John Developer",                                 │
│    "followers": 45,                                          │
│    "following": 23,                                          │
│    "public_repos": 18,                                       │
│    "total_gists": 5,                                         │
│    "bio": "Full Stack Developer",                            │
│    ...  (150+ fields total)                                  │
│  }                                                            │
│              ↓                                                │
│  GITHUB REPOSITORIES (separate API call)                     │
│  For each of 18 repositories:                                │
│  GET /repos/john-developer/{repo-name}                       │
│  Returns: stars, language, commits, etc.                     │
│              ↓                                                │
│  BACKEND AGGREGATION (combines all data)                     │
│  processed_github_data = {                                   │
│    "username": "john-developer",                             │
│    "followers": 45,                                          │
│    "stars_total": 342,                                       │
│    "repositories": [                                         │
│      {                                                        │
│        "name": "ml-classifier",                              │
│        "language": "Python",                                 │
│        "stars": 143,                                         │
│        "forks": 34,                                          │
│        "description": "..."                                  │
│      },                                                       │
│      ...  (17 more repos)                                    │
│    ],                                                         │
│    "languages": {                                            │
│      "JavaScript": 45,                                       │
│      "Python": 30,                                           │
│      "Java": 25                                              │
│    },                                                         │
│    "last_updated": "2026-04-04T10:30:00Z"                    │
│  }                                                            │
│              ↓                                                │
│  CONVERT TO TEXT (Preprocessing)                             │
│  "Developer john-developer with 45 followers has...          │
│   18 public repositories earning 342 total stars...          │
│   Primary languages are JavaScript 45%, Python 30%...        │
│   Most popular repo is ml-classifier with 143 stars..."      │
│              ↓                                                │
│  SEND TO PYTHON SERVICE                                      │
│  POST http://localhost:5001/embed                            │
│  Payload: { text: "Developer john-developer..." }            │
│              ↓                                                │
│  PYTHON SERVICE (FastEmbed)                                  │
│  ├─ Load BAAI/bge-small-en-v1.5 model (first time: slow)    │
│  ├─ Convert text to 384-dimensional vector                   │
│  ├─ Normalize vector (make length = 1.0)                     │
│  └─ Return: [0.23, -0.15, 0.89, ..., 0.34]  (384 numbers)   │
│              ↓                                                │
│  STORE IN MONGODB                                            │
│  db.embeddings.insert({                                      │
│    userId: "507f1f77bcf86cd799439011",                       │
│    platform: "github",                                       │
│    username: "john-developer",                               │
│    vector: [0.23, -0.15, 0.89, ..., 0.34],  ← AI embedding  │
│    rawData: { /* full GitHub data */ },                      │
│    status: "completed",                                      │
│    updatedAt: "2026-04-04T10:30:00Z"                         │
│  })                                                           │
│              ↓                                                │
│  STORE PLATFORM DATA IN MONGODB                              │
│  db.githubdatas.insert({                                     │
│    userId: "507f1f77bcf86cd799439011",                       │
│    ...processed_github_data                                  │
│  })                                                           │
│              ↓                                                │
│  BACKEND RESPONSE                                            │
│  {                                                            │
│    "success": true,                                          │
│    "message": "GitHub data synced successfully",             │
│    "stats": {                                                │
│      "followers": 45,                                        │
│      "stars": 342,                                           │
│      "repos": 18                                             │
│    }                                                          │
│  }                                                            │
│              ↓                                                │
│  FRONTEND                                                    │
│  ├─ Display success message                                  │
│  ├─ Update profile showing GitHub data                       │
│  └─ Show: "GitHub Connected ✓ (18 repos, 342 stars)"        │
│                                                                │
│  TIME TAKEN: 5-10 seconds                                    │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

---

#### PHASE 3: JOB ANALYSIS (The Core Feature)

```
┌──────────────────────────────────────────────────────────────┐
│                  WHEN USER CLICKS "ANALYZE"                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  INPUT: Job Description (pasted by user)                     │
│  ┌──────────────────────────────────────────────────┐         │
│  │ "Senior React Developer (5 years experience)     │         │
│  │  Must know: React, Node.js, MongoDB, AWS        │         │
│  │  Nice to have: Docker, Kubernetes              │         │
│  │  Competitive salary, remote work, great team"   │         │
│  └──────────────────────────────────────────────────┘         │
│              ↓                                                │
│  STEP 1: PARSE JOB DESCRIPTION (Backend)                     │
│  ├─ Extract keywords                                         │
│  └─ Results: ["React", "Node.js", "MongoDB", "AWS",          │
│             "Docker", "Kubernetes", ...]                     │
│              ↓                                                │
│  STEP 2: DETECT JOB ROLE (Python service)                    │
│  Analyze keywords using keyword-role mapping                 │
│  ├─ Keywords matching "web": React, Node.js → Score: 9/10   │
│  ├─ Keywords matching "frontend": React → Score: 8/10       │
│  └─ Detected role: "WEB_DEVELOPER"                           │
│              ↓                                                │
│  STEP 3: LOAD ROLE-SPECIFIC WEIGHTS (Backend)                │
│  For WEB_DEVELOPER role:                                     │
│  ┌────────────────────────────────────────┐                 │
│  │ Platform Importance Weights:           │                 │
│  │ ├─ GitHub: 50% (portfolio matters)    │                 │
│  │ ├─ Resume: 40% (framework skills)     │                 │
│  │ ├─ LeetCode: 6% (basic DSA)           │                 │
│  │ ├─ Codeforces: 2% (not important)     │                 │
│  │ └─ CodeChef: 2% (not important)       │                 │
│  └────────────────────────────────────────┘                 │
│              ↓                                                │
│  STEP 4: CONVERT JOB TO EMBEDDING (Python)                   │
│  ├─ Build enriched text from job description                │
│  ├─ Text: "Senior React Developer... must know React,       │
│  │          Node.js, MongoDB. 5 years experience."          │
│  ├─ Generate embedding (same model as user data)            │
│  └─ Result: [0.15, -0.22, 0.45, ..., 0.31]                 │
│              ↓                                                │
│  STEP 5: CALCULATE SIMILARITY SCORES (Python)                │
│  For each platform user connected:                           │
│                                                               │
│  GITHUB SIMILARITY:                                          │
│  ├─ User GitHub vector: [0.23, -0.15, 0.89, ..., 0.34]     │
│  ├─ Job vector: [0.15, -0.22, 0.45, ..., 0.31]             │
│  ├─ Calculate cosine similarity:                             │
│  │  similarity = 0.82 (on scale -1 to 1)                     │
│  └─ Convert to score: 0.82 × 100 = 82%                      │
│                                                               │
│  RESUME SIMILARITY:                                          │
│  ├─ User Resume vector: [...]                               │
│  ├─ Job vector: [...]                                        │
│  ├─ Similarity: 0.80 × 100 = 80%                            │
│                                                               │
│  LEETCODE SIMILARITY: 0.45 × 100 = 45%                      │
│  CODEFORCES SIMILARITY: 0.28 × 100 = 28%                    │
│  CODECHEF SIMILARITY: 0.20 × 100 = 20%                      │
│              ↓                                                │
│  STEP 6: CALCULATE WEIGHTED SCORE (Backend)                  │
│  If user only connected: GitHub, Resume, LeetCode           │
│  ├─ Recalculate weights (sum found platforms):              │
│  │  Sum = 0.50 + 0.40 + 0.06 = 0.96                         │
│  ├─ Redistribute:                                            │
│  │  GitHub: 0.50/0.96 = 0.521                               │
│  │  Resume: 0.40/0.96 = 0.417                               │
│  │  LeetCode: 0.06/0.96 = 0.063                             │
│  └─ (Now they sum to 1.0 again)                              │
│                                                               │
│  Calculation:                                                │
│  Score = (82 × 0.521) + (80 × 0.417) + (45 × 0.063)         │
│        = 42.72 + 33.36 + 2.84                                │
│        = 78.9% ← FINAL SCORE                                 │
│              ↓                                                │
│  STEP 7: CALCULATE CONFIDENCE (Backend)                      │
│  ├─ Platform coverage: 3/5 connected = 60%                   │
│  ├─ Score quality: Average quality of scores = 70%           │
│  ├─ Formula: (0.60 × 40%) + (70% × 60%) = 66%              │
│  └─ Confidence: 66% (MEDIUM)                                 │
│              ↓                                                │
│  STEP 8: GENERATE AI INSIGHTS (Groq LLM)                     │
│  Call Groq API with:                                         │
│  ├─ User profile data                                        │
│  ├─ Job description                                          │
│  ├─ Compatibility scores                                     │
│  └─ Platform details                                         │
│                                                               │
│  Groq generates insights like:                               │
│  "Your React expertise from GitHub matches well with         │
│   the position's frontend requirements. Your 15 JS projects  │
│   show strong practical experience..."                       │
│              ↓                                                │
│  STEP 9: STORE ANALYSIS (MongoDB)                            │
│  db.analysishistories.insert({                               │
│    userId: "507f1f77bcf86cd799439011",                       │
│    jobDescription: "Senior React Developer...",              │
│    detectedRole: "WEB_DEVELOPER",                            │
│    overallScore: 78.9,                                       │
│    confidenceScore: 66,                                      │
│    platformScores: {                                         │
│      github: 82,                                             │
│      resume: 80,                                             │
│      leetcode: 45,                                           │
│      codeforces: 28,                                         │
│      codechef: 20                                            │
│    },                                                         │
│    insights: "Your React expertise...",                      │
│    createdAt: "2026-04-04T10:30:00Z"                         │
│  })                                                           │
│              ↓                                                │
│  STEP 10: RETURN RESULTS (Frontend)                          │
│  {                                                            │
│    "success": true,                                          │
│    "result": {                                               │
│      "overallScore": 78.9,                                   │
│      "confidenceScore": 66,                                  │
│      "jobRole": "WEB_DEVELOPER",                             │
│      "platformBreakdown": {                                  │
│        "github": 82,                                         │
│        "resume": 80,                                         │
│        "leetcode": 45                                        │
│      },                                                       │
│      "insights": ["Your React expertise matches..."],        │
│      "recommendation": "APPLY_WITH_CONFIDENCE"               │
│    }                                                          │
│  }                                                            │
│              ↓                                                │
│  FRONTEND DISPLAYS BEAUTIFUL DASHBOARD                       │
│  ├─ Large score: 78.9% ████████░                            │
│  ├─ Confidence: 66% (MEDIUM)                                 │
│  ├─ Platform bars: GitHub (82%), Resume (80%), etc.         │
│  ├─ AI insights in readable format                           │
│  └─ "APPLY WITH CONFIDENCE" recommendation                   │
│                                                               │
│  TIME TAKEN: 5-15 seconds                                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Complete Data Flow (All Requests)

```
USER (Browser)
    ↓ ↑
    ↓ ↑ HTTP/JSON
    ↓ ↑
REACT FRONTEND (Port 3000)
    ↓ ↑
    ↓ ↑ API Calls (http://localhost:5000/api/...)
    ↓ ↑
EXPRESS BACKEND (Port 5000)
    │
    ├─→ Data Validation
    ├─→ JWT Token Verification
    ├─→ Error Handling
    │
    ├─→ For embedding requests:
    │   ↓
    │   → PYTHON SERVICE (Port 5001)
    │   ← Returns: [v1, v2, ..., v384] vector
    │
    ├─→ For all requests:
    │   ↓
    │   → MONGODB (Port 27017)
    │   ├─ Read/Write user data
    │   ├─ Read/Write platform data
    │   ├─ Read/Write embeddings
    │   └─ Read/Write analysis results
    │   ← Returns: JSON documents
    │
    └─→ For AI insights:
        ↓
        → GROQ API (External: groq.com)
        ← Returns: AI-generated text
```

---

## Processing Pipeline

### Complete Processing Steps for Analysis

```
Input: Job Description (Plain Text)
│
├─ Step 1: Parse & Extract
│  Input:  "Looking for React developer with Node..."
│  Output: Keywords = [React, Node, JavaScript, ...]
│
├─ Step 2: Detect Role
│  Input:  Keywords
│  Output: Role = "WEB_DEVELOPER"
│
├─ Step 3: Load Weights
│  Input:  Role = "WEB_DEVELOPER"
│  Output: Weights = {github: 0.50, resume: 0.40, ...}
│
├─ Step 4: Build Text Description
│  Input:  Job description keywords
│  Output: "Senior React Developer role seeking someone with..."
│
├─ Step 5: Generate Job Embedding
│  Input:  Job text description
│  Process:
│  ├─ Load BAAI/bge-small-en-v1.5 model (if not cached)
│  ├─ Convert text to 384-dimensional vector
│  ├─ Normalize: divide by magnitude
│  └─ Result: [0.15, -0.22, 0.45, ..., 0.31]
│  Output: Job vector (normalized)
│
├─ Step 6: Retrieve User Embeddings from DB
│  Query:  db.embeddings.find({userId: user_id})
│  Output: {
│   github: [0.23, -0.15, ..., 0.34],
│   resume: [0.30, -0.10, ..., 0.29],
│   leetcode: [0.12, -0.50, ..., 0.15]
│  }
│
├─ Step 7: Calculate Similarities (FAISS)
│  For each platform:
│  ├─ Load user vector
│  ├─ Load job vector
│  ├─ Calculate dot product (both normalized)
│  │  similarity = sum(v1[i] * v2[i]) for i in 1..384
│  └─ Convert to 0-100: similarity × 100
│
│  Results:
│  github:   0.82 → 82%
│  resume:   0.80 → 80%
│  leetcode: 0.45 → 45%
│
├─ Step 8: Recalculate Weights
│  Input:   Platform scores & original weights
│  Process: Redistribute weights only for connected platforms
│  Output:  Normalized weights sum to 1.0
│
├─ Step 9: Weighted Average
│  Formula: Σ(score[i] × weight[i])
│  Calculation:
│  = (82 × 0.521) + (80 × 0.417) + (45 × 0.063)
│  = 42.72 + 33.36 + 2.84
│  = 78.9%
│  Output: Final score = 78.9%
│
├─ Step 10: Calculate Confidence
│  Coverage ratio = platforms_connected / total_platforms
│  Quality rating = average_score / 100
│  Confidence = (coverage × 40%) + (quality × 60%)
│  Output: Confidence = 66%
│
├─ Step 11: AI Insights (Optional)
│  Input: All above data
│  Call:  Groq API with detailed prompt
│  Output: Textual insights & recommendations
│
├─ Step 12: Store Results
│  Save to DB:
│  {
│    userId, jobDescription, detectedRole,
│    overallScore, confidenceScore,
│    platformScores, insights, timestamp
│  }
│
└─ Output: Complete Analysis Result
   {
     score: 78.9%,
     confidence: 66%,
     platforms: {github: 82%, resume: 80%, ...},
     insights: ["..."],
     recommendation: "APPLY_WITH_CONFIDENCE"
   }
```

---

## Database Schema

### MongoDB Collections & Structure

```
DATABASE: skillsync-ai

┌─1. users
│   ├─ _id (ObjectId)
│   ├─ name (String)
│   ├─ email (String)
│   ├─ password (Hashed - bcrypt)
│   ├─ createdAt (Date)
│   └─ updatedAt (Date)
│
├─2. githubdatas
│   ├─ userId (ObjectId - references users)
│   ├─ username (String)
│   ├─ followers (Number)
│   ├─ stars_total (Number)
│   ├─ repositories (Array of Objects)
│   │  ├─ name, language, stars, forks
│   ├─ languages (Object - language percentages)
│   └─ lastUpdated (Date)
│
├─3. leetcodedatas
│   ├─ userId (ObjectId)
│   ├─ username (String)
│   ├─ totalSolved (Number)
│   ├─ easyCount (Number)
│   ├─ mediumCount (Number)
│   ├─ hardCount (Number)
│   ├─ contestRating (Number)
│   └─ acceptanceRate (Number)
│
├─4. codeforcesDatas
│   ├─ userId (ObjectId)
│   ├─ handle (String)
│   ├─ currentRating (Number)
│   ├─ maxRating (Number)
│   ├─ contests (Number)
│   └─ rank (Number)
│
├─5. codechefdatas
│   ├─ userId (ObjectId)
│   ├─ username (String)
│   ├─ rating (Number)
│   ├─ globalRank (Number)
│   ├─ problemsSolved (Number)
│   └─ contests (Number)
│
├─6. resumeparseddatas
│   ├─ userId (ObjectId)
│   ├─ fileName (String)
│   ├─ skills (Array of Strings)
│   ├─ experience (Array of Objects)
│   │  ├─ company, position, duration, description
│   ├─ education (Array of Objects)
│   │  ├─ institution, degree, field, year
│   └─ lastUpdated (Date)
│
├─7. embeddings
│   ├─ userId (ObjectId)
│   ├─ platform (String: "github", "leetcode", etc.)
│   ├─ vector (Array of 384 Numbers - the AI embedding)
│   ├─ rawData (Object - platform data that created this)
│   ├─ status (String: "completed", "pending", "failed")
│   └─ updatedAt (Date)
│
├─8. analysishistories
│   ├─ _id (ObjectId - results here!)
│   ├─ userId (ObjectId)
│   ├─ jobDescription (String)
│   ├─ detectedRole (String: "WEB", "SDE", "DATA", etc.)
│   ├─ overallScore (Number: 0-100)
│   ├─ confidenceScore (Number: 0-100)
│   ├─ platformScores (Object)
│   │  ├─ github (0-100)
│   │  ├─ leetcode (0-100)
│   │  ├─ codeforces (0-100)
│   │  ├─ codechef (0-100)
│   │  └─ resume (0-100)
│   ├─ insights (Array of Strings - AI insights)
│   ├─ recommendation (String: "APPLY_WITH_CONFIDENCE", etc.)
│   └─ createdAt (Date)
│
└─9. finalresults (Summary/Aggregated)
    ├─ userId (ObjectId)
    ├─ totalAnalyses (Number)
    ├─ averageScore (Number)
    ├─ topMatches (Array of job descriptions)
    └─ lastUpdated (Date)
```

---

## API Endpoints Overview

### All Available Endpoints

```
AUTH ROUTES (No token required)
├─ POST   /api/auth/signup           → Create account
├─ POST   /api/auth/login            → Login account
└─ POST   /api/auth/logout           → Logout

PROFILE ROUTES (Token required)
├─ GET    /api/profile               → Get user profile
├─ PUT    /api/profile               → Update profile
├─ POST   /api/profile/connect/github    → Connect GitHub
├─ POST   /api/profile/connect/leetcode  → Connect LeetCode
├─ POST   /api/profile/connect/codeforces → Connect Codeforces
├─ POST   /api/profile/connect/codechef   → Connect CodeChef
└─ DELETE /api/profile/account           → Delete account

RESUME ROUTES (Token required)
├─ POST   /api/resume/upload         → Upload resume
├─ GET    /api/resume                → Get resume data
└─ DELETE /api/resume                → Delete resume

ANALYSIS ROUTES (Token required)
├─ POST   /api/analysis/analyze      → Analyze job (MAIN)
├─ GET    /api/analysis/history      → Get all analyses
├─ GET    /api/analysis/:id          → Get specific analysis
└─ DELETE /api/analysis/:id          → Delete analysis

LEETCODE ROUTES (Token required)
├─ GET    /api/leetcode/stats        → Get LeetCode stats
└─ GET    /api/leetcode/problems     → Get specific problem
```

---

## Summary

```
WHAT HAPPENS WHEN YOU SIT DOWN TO USE SKILLSYNC-AI:

1. USER SIGNS UP
   └─ Account created in MongoDB

2. USER CONNECTS PLATFORMS
   └─ Data fetched from each platform
   └─ Converted to AI embeddings (vectors)
   └─ Stored in MongoDB for future use

3. USER PASTES JOB DESCRIPTION
   └─ Job parsed and role detected
   └─ Job converted to embedding
   └─ Compared with user's embeddings using similarity search
   └─ Scores calculated for each platform
   └─ Weighted score computed
   └─ Confidence determined

4. RESULTS DISPLAYED
   └─ Compatibility percentage shown
   └─ Platform breakdown shown
   └─ AI insights given
   └─ Recommendation displayed

5. ANALYSIS SAVED
   └─ Stored in database for history
   └─ Can view past analyses anytime

ALL OF THIS HAPPENS IN 5-15 SECONDS! 🚀
```

---

**Document Version:** 1.0  
**Last Updated:** April 2026
