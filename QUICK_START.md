# 🚀 QUICK START GUIDE - Get Running in 15 Minutes
## AI-Powered Professional Profile Compatibility Analyzer (SkillSync-AI)

---

## What is This?

A **smart AI system** that analyzes your coding profile and tells you how compatible you are with any job (0-100%).

**Example:**
```
You paste: "Looking for React developer..."
System shows: "You're 82% compatible with this job! Here's why..."
```

---

## 📋 Prerequisites (Before Starting)

Install these 3 things:

| What | Download | Check |
|------|----------|-------|
| **Node.js** (v20+) | https://nodejs.org | `node --version` |
| **Python** (3.8+) | https://python.org | `python --version` |
| **MongoDB** (Local) | https://mongodb.com | `mongod --version` |

---

## ⚡ Installation (10 minutes)

### Copy-Paste Commands:

```bash
# 1. Navigate to project
cd e:/final-year-project

# 2. Install backend
cd backend
npm install
cd ..

# 3. Install frontend  
cd frontend
npm install
cd ..

# 4. Install Python
cd python
pip install -r requirements.txt
cd ..
```

---

## 📝 Configuration (2 minutes)

### Create `backend/.env`
```
MONGODB_URI=mongodb://localhost:27017
DB_NAME=skillsync-ai
JWT_SECRET=your_secret_key_change_this
PORT=5000
NODE_ENV=development
GROQ_API_KEY=your_groq_key_here
CLIENT_URL=http://localhost:3000
```

### Create `python/config.py`
```python
MONGODB_URI = "mongodb://localhost:27017"
DB_NAME = "skillsync-ai"
GROQ_API_KEY = "your_groq_key_here"
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
```

---

## 🎬 Running the Application (3 minutes)

**Open 4 Terminal Windows:**

### Terminal 1: MongoDB
```bash
mongod
# Shows: "waiting for connections on port 27017"
```

### Terminal 2: Python Service
```bash
cd python
python main.py
# Shows: "Service ready on :5001"
```

### Terminal 3: Backend
```bash
cd backend
npm run dev
# Shows: "Server started on port 5000"
```

### Terminal 4: Frontend
```bash
cd frontend
npm start
# Opens: http://localhost:3000
```

---

## 🎯 Using the App (5 minutes)

### Step 1: Sign Up
- Go to `http://localhost:3000`
- Click "Sign Up"
- Enter email and password

### Step 2: Connect Platforms
- Click "Profile"
- Click "Connect GitHub" → Enter username → Fetch
- Click "Connect LeetCode" → Enter username → Fetch
- Upload resume (optional)

### Step 3: Analyze
- Go to "Analyze" tab
- Paste a job description
- Click "Analyze"
- **See your compatibility score! 🎉**

---

## ✅ Success Indicators

```
✓ Terminal 1 (Mongo): "waiting for connections"
✓ Terminal 2 (Python): "Service ready on :5001"  
✓ Terminal 3 (Backend): "Server started on port 5000"
✓ Terminal 4 (Frontend): Shows "http://localhost:3000"

→ Browser shows SkillSync-AI login page ✓
→ You can sign up & login ✓
→ Ready to analyze jobs! 🚀
```

---

## 🆘 Quick Fixes

| Problem | Fix |
|---------|-----|
| "Can't connect to MongoDB" | Run `mongod` in terminal |
| "Python service error" | Run `pip install -r requirements.txt` |
| "React won't compile" | Delete `frontend/node_modules` and run `npm install` again |
| "Platform connection failed" | Check username is correct and account is public |

---

## 📚 Need More Details?

👉 Read the **full USER_MANUAL.md** for:
- Detailed troubleshooting
- Understanding scores
- Data privacy & security
- Advanced setup options
- FAQs and common issues

---

## 🎓 Key Concepts (1 minute)

### How It Works (3 phases):

```
1. DATA COLLECTION
   You connect platforms (GitHub, LeetCode, etc.)
   ↓
2. AI ANALYSIS  
   System converts your profile to AI "embeddings"
   ↓
3. MATCHING
   Compares with job description using vector similarity
   Result: Compatibility score (0-100%)
```

### What Each Score Means:

```
90-100% → Perfect match! Apply now! 🟢
75-90%  → Great fit, strong candidate 🟢
60-75%  → Good match, worth applying 🟡
45-60%  → Some skills match, need improvement 🟠
0-45%   → Not a good fit right now 🔴
```

---

## 🎁 Bonus Features

- ✅ Analysis history (track all your analyses)
- ✅ AI recommendations (why you're compatible)
- ✅ Multi-platform analysis (GitHub, LeetCode, Codeforces, CodeChef, Resume)
- ✅ Account security (password encryption, JWT tokens)
- ✅ Confidence scoring (how reliable is this result?)

---

## 📞 Common Questions

**Q: How long does analysis take?**  
A: First time: 15-30 seconds | After that: 5-15 seconds

**Q: Can I use it without all 5 platforms?**  
A: Yes! But more platforms = more accurate. Minimum 1 platform.

**Q: Is my data safe?**  
A: Yes! Passwords encrypted, data stored locally, no sharing with third parties.

**Q: Can I use this on cloud/remote server?**  
A: Yes, but for beginners, local machine is easier. See full manual for cloud setup.

---

## 🏁 That's It!

You now have a working AI system for:
- ✓ Understanding your coding profile
- ✓ Finding jobs you'll excel in  
- ✓ Getting AI-powered recommendations
- ✓ Tracking your compatibility over time

**Next Steps:**
1. Follow the **⚡ Installation** section
2. Follow the **🎬 Running** section
3. Follow the **🎯 Using** section
4. Have fun analyzing jobs! 🚀

**For detailed info:** Read `USER_MANUAL.md` in the project folder

---

**Happy Job Hunting! 💼✨**
