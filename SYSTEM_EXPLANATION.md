# 🎯 Complete System Explanation: Embedding Generation & Score Calculation

## Overview
Your system uses **Vector Embeddings** and **Cosine Similarity** to match candidate profiles with job descriptions. Think of it like Netflix recommending movies - but instead of movies, we're matching developers to jobs based on their coding profiles.

---

## 🔄 The Complete Process (Step-by-Step)

### **PHASE 1: Data Collection** 
*Location: Backend services*

```
User connects their accounts → Backend fetches data:
├── GitHub: followers, stars, commits, languages, PRs     
├── LeetCode: problems solved (easy/medium/hard), contests
├── Codeforces: rating, max rating
├── CodeChef: rating, stars, problems solved
└── Resume: skills, experience, education
```

All this data is stored in MongoDB collections:
- `githubdatas`
- `leetcodedatas`
- `codeforcesDatas`
- `codechefdatas`
- `resumeparseddatas`
- `combineddatas` (merged platform data)

---

### **PHASE 2: Preprocessing - Converting Data to Text** 
*File: `python/preprocess.py`*

#### **Step 2.1: Build Text Descriptions**
Each platform's data is converted into a human-readable narrative:

**Example - GitHub:**
```
User has:
- 50 followers
- 100 stars
- 500 commits
- 10 repos

Becomes Text:
"GitHub Profile - Active Open Source Developer:
Has 50 followers and received 100 stars on repositories.
Maintains 10 public repositories with 500 total commits.
Contributed 25 pull requests showing strong collaboration.
Commits at medium frequency with projects of moderate to high complexity.
Primary languages: JavaScript, Python, Java, TypeScript.
Active contributor to open source community with demonstrated coding expertise."
```

**Similar conversions for:**
- **LeetCode**: Emphasizes problem-solving (DSA, contests)
- **Codeforces/CodeChef**: Competitive programming ratings
- **Resume**: Skills, experience, technical competencies

#### **Step 2.2: Generate Embeddings**
Each text description is converted into a **384-dimensional vector** using the `BAAI/bge-small-en-v1.5` model (FastEmbed).

**What's an embedding?**
- A vector of 384 numbers representing the "meaning" of the text
- Similar texts have similar vectors
- Example: `[0.23, -0.11, 0.45, ..., 0.08]` (384 numbers)

**Mathematical Process:**
```python
# 1. Input: Text description
text = "GitHub Profile - Active Open Source Developer..."

# 2. Generate raw embedding using ML model
vector = embedder.embed([text])  # Result: [v1, v2, ..., v384]

# 3. NORMALIZE (crucial!) - Makes all vectors unit length
norm = sqrt(v1² + v2² + ... + v384²)
normalized_vector = [v1/norm, v2/norm, ..., v384/norm]

# Length is now exactly 1.0
```

**Why normalize?**
- Makes comparison fair (longer text doesn't get higher scores)
- Cosine similarity becomes simple dot product
- Ensures scores are in 0-100 range

#### **Step 2.3: Store in Database**
```javascript
db.embeddings.insert({
  userId: "user123",
  platform: "github",
  vector: [0.23, -0.11, ...], // 384 normalized numbers
  updatedAt: "2026-03-08"
})
```

This happens for **all 5 platforms**: github, leetcode, codeforces, codechef, resume

---

### **PHASE 3: Job Description Analysis** 
*File: `python/analyzeprofile.py`*

When user pastes a job description:

#### **Step 3.1: Role Detection**
```python
job_description = "Looking for React developer with Node.js..."

# Scan for keywords
keywords_found = {
  "web": ["react", "frontend", "javascript"] → Score: 8.5
  "sde": ["developer"] → Score: 3.0
  "data": [] → Score: 0
}

# Detected role: "web"
```

#### **Step 3.2: Load Role-Specific Weights**
Based on detected role, load importance weights:

```python
# For Web Developer
weights = {
  "github": 0.50,      # Portfolio is MOST important
  "leetcode": 0.06,     # Basic problem-solving
  "codeforces": 0.02,   # Barely matters
  "codechef": 0.02,     
  "resume": 0.40,       # Framework skills important
}

# For SDE (Software Dev Engineer)
weights = {
  "github": 0.28,      
  "leetcode": 0.32,     # DSA is MOST important
  "codeforces": 0.16,   # Competitive coding matters
  "codechef": 0.11,     
  "resume": 0.13,       
}
```

#### **Step 3.3: Convert Job Description to Embedding**
```python
# Build enriched text
job_text = """
Job Description:
Looking for React developer with Node.js and MongoDB...

Key Technologies:
react node mongodb javascript typescript express react node mongodb javascript...

This is a web engineer role.
Candidate should have strong experience with these technologies.
"""

# Generate and normalize embedding (same as Step 2.2)
job_vector = embed(job_text)  # [0.15, -0.22, ..., 0.31]
```

---

### **PHASE 4: Calculate Similarity Scores** 
*The Core Matching Logic*

#### **Step 4.1: Compare Each Platform**

For EACH platform (github, leetcode, etc.):

```python
# 1. Fetch user's platform embedding (already normalized)
user_vector = db.embeddings.find_one({
  userId: "user123", 
  platform: "github"
})["vector"]

# 2. Calculate Cosine Similarity using FAISS
# Since both vectors are normalized, this is just dot product:
similarity = sum(user_vector[i] * job_vector[i] for i in range(384))

# Result: Number between -1 and 1
# -1 = completely opposite
#  0 = no relationship  
#  1 = identical

# 3. Convert to 0-100 score
platform_score = max(0, similarity * 100)

# Example: similarity = 0.73 → score = 73%
```

**Real Example:**
```
Platform Similarity Scores:
──────────────────────────────────────────────────────────
  ✓ github       : 0.7823 →  78.23%
  ✓ leetcode     : 0.4521 →  45.21%
  ✓ codeforces   : 0.2100 →  21.00%
  ✓ codechef     : 0.1894 →  18.94%
  ✓ resume       : 0.8245 →  82.45%
──────────────────────────────────────────────────────────
```

#### **Step 4.2: Calculate Weighted Final Score**

**Dynamic Re-normalization:**
If user hasn't connected all platforms, redistribute weights:

```python
# User only has: github, leetcode, resume
connected_platforms = ["github", "leetcode", "resume"]

# Original weights (for web role)
original = {
  "github": 0.50,
  "leetcode": 0.06,
  "resume": 0.40,
  # codeforces: 0.02 → NOT CONNECTED
  # codechef: 0.02   → NOT CONNECTED
}

# Re-normalize (distribute missing weight)
total_connected = 0.50 + 0.06 + 0.40 = 0.96
new_weights = {
  "github": 0.50 / 0.96 = 0.521,
  "leetcode": 0.06 / 0.96 = 0.063,
  "resume": 0.40 / 0.96 = 0.417,
}
# Now they sum to 1.0!
```

**Final Score Calculation:**
```python
final_score = (
  github_score * 0.521 +
  leetcode_score * 0.063 +
  resume_score * 0.417
)

# Example:
final_score = (78.23 * 0.521) + (45.21 * 0.063) + (82.45 * 0.417)
            = 40.76 + 2.85 + 34.38
            = 78.00%
```

---

### **PHASE 5: Confidence Score** 
*How reliable is this match?*

Confidence considers:
1. **Platform Coverage** (40% weight): How many platforms connected?
2. **Score Quality** (60% weight): How good are matches after role-based weighting?

```python
# Relevant platforms for confidence:
# github, leetcode, codeforces, codechef, resume
# (activity is excluded from confidence computation)

# Example (role = sde)
weights = {
  "github": 0.25,
  "leetcode": 0.30,
  "codeforces": 0.15,
  "codechef": 0.10,
  "resume": 0.15,
}

scores = {
  "github": 80,
  "leetcode": 60,
  "codeforces": 40,
  "codechef": 20,
  "resume": 70,
}

# Coverage part (threshold: score >= 10)
connected = 5
coverage_ratio = 5 / 5 = 1.0
coverage_contribution = coverage_ratio * 40 = 40

# Quality part (true weighted average over available platforms)
quality = (80*0.25 + 60*0.30 + 40*0.15 + 20*0.10 + 70*0.15) / (0.25+0.30+0.15+0.10+0.15)
        = 56.5
quality_contribution = 56.5 * 0.6 = 33.9

confidence = coverage_contribution + quality_contribution
           = 40 + 33.9
           = 73.9%
```

**Interpretation:**
- **80-100%**: High confidence (4-5 platforms, good matches)
- **50-80%**: Medium confidence (3 platforms or mixed matches)
- **0-50%**: Low confidence (1-2 platforms or poor matches)

---

### **PHASE 6: Skill Gap Analysis** 
*File: `python/skillextractor.py`*

```python
# Extract skills from job description using NLP
job_skills = ["React", "Node.js", "MongoDB", "TypeScript"]

# Get user's skills from resume
user_skills = ["JavaScript", "React", "Python", "SQL"]

# Calculate gap
matched = ["React"]  # 1 match
missing = ["Node.js", "MongoDB", "TypeScript"]  # 3 missing

match_percentage = 1 / 4 = 25%
```

---

## 📊 **Complete Example Flow**

### Input:
- **User**: Connected GitHub (strong), LeetCode (medium), Resume (strong)
- **Job**: "React Frontend Developer with TypeScript"

### Process:
```
1. Role Detection: "web" (found keywords: react, frontend)

2. Weights: 
   github=52.1%, leetcode=6.3%, resume=41.7%

3. Embeddings Comparison:
   GitHub:   User[0.45, -0.23, ...] ⊗ Job[0.52, -0.11, ...] = 0.78 → 78%
   LeetCode: User[0.12, 0.44, ...]  ⊗ Job[0.08, 0.21, ...]  = 0.45 → 45%
   Resume:   User[0.67, 0.05, ...]  ⊗ Job[0.71, 0.09, ...]  = 0.82 → 82%

4. Final Score:
   (78 × 0.521) + (45 × 0.063) + (82 × 0.417) = 78.0%

5. Confidence: 65% (3/5 platforms, good quality)

6. Skills: 
   - Matched: JavaScript, React
   - Missing: TypeScript, Redux, Testing
```

---

## 🔑 **Key Advantages of This System**

### 1. **Semantic Understanding**
- Not just keyword matching
- Understands context: "500 commits" ≈ "active contributor"
- Similar to how ChatGPT understands language

### 2. **Role-Adaptive**
- Web developers judged on portfolios
- SDE candidates judged on algorithms
- Data scientists judged on research

### 3. **Fair Scoring**
- Missing platforms don't hurt you
- Weights redistribute dynamically
- Normalized vectors ensure no platform dominates

### 4. **Transparent**
- See exactly which platforms matched well
- Understand why you got that score
- Clear skill gaps to improve

---

## 🧮 **Mathematical Summary**

```
∀ platform ∈ {github, leetcode, codeforces, codechef, resume}:

1. text[platform] = build_description(user_data[platform])

2. v[platform] = embed(text[platform])  
   where ||v[platform]|| = 1 (normalized)

3. v[job] = embed(job_description)
   where ||v[job]|| = 1

4. score[platform] = 100 × max(0, v[platform] · v[job])
   (dot product since normalized)

5. final_score = Σ (score[p] × weight[p]) for all connected platforms
   where Σ weight[p] = 1.0 (after dynamic re-normalization)

6. confidence = (connected_count / total_relevant_platforms) × 40
          + 0.6 × weighted_average_quality

  where:
  weighted_average_quality = Σ(score[p] × weight[p]) / Σ(weight[p])
  over platforms with score[p] > 0
```

---

## 🛠️ **Technical Stack**

- **Embeddings**: `BAAI/bge-small-en-v1.5` (FastEmbed library)
- **Vector Operations**: FAISS (Facebook AI Similarity Search)
- **Vector Size**: 384 dimensions
- **Similarity Metric**: Cosine Similarity (dot product of normalized vectors)
- **Storage**: MongoDB with 384-dimensional arrays

---

## 📝 **Summary**

**In Plain English:**
1. Convert your coding profiles to "meaning vectors"
2. Convert job description to a "meaning vector"
3. Measure how similar they are (0-100%)
4. Combine scores using role-specific importance weights
5. Tell you exactly where you match and where to improve

**The Magic:**
Vector embeddings capture *semantic meaning*, not just keywords. So "500 GitHub commits" and "active open source contributor" are understood as the same thing - even though they use different words!

---

## 🎓 **Why This Works**

This approach is used by:
- **Google Search**: Understanding what you really mean
- **Netflix**: Recommending similar movies
- **LinkedIn**: Job recommendations
- **GitHub Copilot**: Understanding code context

Your system applies the same AI technology to developer profile matching! 🚀
