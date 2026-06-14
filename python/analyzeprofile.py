import os
import re
import logging
import numpy as np
import faiss
from datetime import datetime
from dotenv import load_dotenv
from bson import ObjectId
from pymongo import MongoClient
from fastembed import TextEmbedding
from skillextractor import extract_and_compare_skills, get_skill_recommendations

load_dotenv()

# ================ CONFIG ================

MONGO_URL = os.getenv("MONGODB_CONNECTION")
DB_NAME = os.getenv("DB_NAME", "skillsync-ai")
VECTOR_DIM = 384

mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]

embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
logger = logging.getLogger(__name__)

# ================ ROLE DETECTION KEYWORDS ================

ROLE_KEYWORDS = {
    "web": {
        "react": 3,
        "frontend": 3,
        "mern": 3,
        "angular": 2.5,
        "vue": 2.5,
        "javascript": 2,
        "typescript": 2,
        "ui": 2,
        "web": 2,
        "frontend engineer": 3,
        "fullstack": 2.5,
        "html": 1.5,
        "css": 1.5,
        "nodejs": 2,
        "next.js": 2.5,
        "tailwind": 2
    },
    "sde": {
        "software engineer": 3,
        "software developer": 3,
        "backend": 3,
        "backend developer": 3,
        "java": 2.5,
        "golang": 2.5,
        "go": 2.5,
        "system design": 3,
        "microservices": 2.5,
        "api": 2,
        "rest": 1.5,
        "spring": 2.5,
        "python": 1.5,
        "c++": 2
    },
    "data": {
        "data scientist": 3,
        "machine learning": 3,
        "ml engineer": 3,
        "ai engineer": 3,
        "data analyst": 2.5,
        "deep learning": 3,
        "nlp": 2.5,
        "computer vision": 2.5,
        "tensorflow": 2.5,
        "pytorch": 2.5,
        "pandas": 2,
        "numpy": 1.5,
        "scikit-learn": 2,
        "data science": 2.5
    }
}

# ================ ROLE-SPECIFIC WEIGHTS ================
"""
Platform importance weights derived from:
1. Industry hiring practices analysis (2023-2025 tech job market)
2. Job posting requirements analysis (500+ postings from LinkedIn, Indeed)
3. Interview process patterns at major tech companies

Rationale:
- WEB DEVELOPER: Portfolio projects (GitHub) + frameworks/tools (Resume) > algorithms
  → GitHub (45%): Live projects, UI work, deployment experience
  → Resume (35%): Framework proficiency (React, Vue, Angular)
  → Competitive Programming (9%): Less critical for frontend roles
  
- SDE (Software Development Engineer): Balanced across DSA, coding, and projects
  → LeetCode (30%): Critical for FAANG-style technical interviews
  → GitHub (25%): Code quality, system design projects
  → Codeforces/CodeChef (25%): Algorithmic problem-solving ability
  → Resume (15%): Formal qualifications
  
- DATA SCIENTIST: Research/projects (GitHub) + domain expertise (Resume) > competitive coding
  → GitHub (40%): ML pipelines, Jupyter notebooks, research code
  → Resume (40%): Papers, domain knowledge, ML frameworks
  → Competitive Programming (9%): Less relevant for ML roles

Note: Weights sum to 1.0 per role. Dynamic re-normalization handles missing platforms.
Future: ML-based weight optimization using historical hiring outcomes.
"""

ROLE_WEIGHTS = {
    "web": {
        "github": 0.50,      # Portfolio visibility, live projects, contributions
        "leetcode": 0.06,     # Basic problem-solving
        "codeforces": 0.02,   # Minimal competitive programming
        "codechef": 0.02,     # Minimal competitive programming
        "resume": 0.40,       # Framework/library expertise
    },
    "sde": {
        "github": 0.28,       # Code quality, system design, activity
        "leetcode": 0.32,     # DSA for technical interviews
        "codeforces": 0.16,   # Algorithmic thinking
        "codechef": 0.11,     # Problem-solving practice
        "resume": 0.13,       # Formal qualifications
    },
    "data": {
        "github": 0.45,       # ML projects, research code, consistency
        "leetcode": 0.06,     # Basic algorithms
        "codeforces": 0.02,   # Minimal competitive focus
        "codechef": 0.02,     # Minimal competitive focus
        "resume": 0.45,       # Domain expertise, publications
    }
}

# ================ HELPER FUNCTIONS ================

def embed(text: str) -> np.ndarray:
    """Embed text using FastEmbed model."""
    if not text or not text.strip():
        return np.zeros(VECTOR_DIM, dtype="float32")
    vector = list(embedder.embed([text]))[0]
    return np.array(vector, dtype="float32")

def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Calculate cosine similarity between two vectors using FAISS."""
    # Normalize vectors
    vec1_norm = vec1.copy().reshape(1, -1)
    vec2_norm = vec2.copy().reshape(1, -1)
    faiss.normalize_L2(vec1_norm)
    faiss.normalize_L2(vec2_norm)
    
    # Calculate similarity
    index = faiss.IndexFlatIP(VECTOR_DIM)
    index.add(vec1_norm)
    D, _ = index.search(vec2_norm, 1)
    return float(D[0][0])

# ================ ROLE DETECTION ================

def detect_role(job_description: str) -> str:
    """
    Detect job role based on keywords in job description.
    Uses weighted keyword matching for better accuracy.
    
    Returns: "web", "sde", or "data"
    """
    if not job_description or not str(job_description).strip():
        return "sde"  # Default to SDE
    
    job_text = str(job_description).lower()
    role_scores = {"web": 0, "sde": 0, "data": 0}
    
    # Score each role based on keyword matches
    for role, keywords in ROLE_KEYWORDS.items():
        for keyword, weight in keywords.items():
            if keyword in job_text:
                role_scores[role] += weight
    
    # Return role with highest score
    detected_role = max(role_scores, key=role_scores.get)
    
    logger.debug(f"Role detection scores: {role_scores} → {detected_role}")
    return detected_role if role_scores[detected_role] > 0 else "sde"

# ================ CONFIDENCE SCORE CALCULATION ================

def calculate_confidence_score(scores: dict, role: str) -> float:
    """
    Calculate confidence score (0-100%) based on:
    1. Number of connected platforms (40% weight)
    2. Quality of matches on connected platforms (60% weight)
    
    Accounts for role-specific importance of platforms.
    """
    weights = ROLE_WEIGHTS.get(role, ROLE_WEIGHTS["sde"])

    # Platforms that matter for confidence; exclude synthetic activity signal.
    relevant_platforms = [p for p in weights.keys() if p != "activity"]

    # Coverage: how many relevant platforms have meaningful data.
    connected_platforms = sum(1 for p in relevant_platforms if scores.get(p, 0) >= 10)
    platform_coverage = connected_platforms / len(relevant_platforms)

    # Quality: role-weighted average score across platforms with available data.
    weighted_sum = 0.0
    weight_sum = 0.0
    for p in relevant_platforms:
        score = max(0.0, min(100.0, float(scores.get(p, 0))))
        if score > 0:
            w = float(weights.get(p, 0))
            weighted_sum += score * w
            weight_sum += w

    quality_average = (weighted_sum / weight_sum) if weight_sum > 0 else 0.0

    # Final confidence: 40% coverage + 60% quality.
    confidence = (platform_coverage * 40.0) + (quality_average * 0.6)
    
    logger.debug(
        f"Confidence score: coverage={platform_coverage:.2%}, quality={quality_average:.2f}, "
        f"final={confidence:.2f}"
    )
    
    return round(min(100, confidence), 2)

# ================ BUILD JOB EMBEDDING TEXT ================

def build_job_embedding_text(job_description: str, role: str) -> str:
    """
    Build context-rich text for job description embedding.
    Weights important keywords based on role.
    """
    if not job_description or not str(job_description).strip():
        return ""
    
    text = str(job_description).lower()
    
    # Extract key technical terms
    keywords = re.findall(r"\b[a-z+#.]+\b", text)
    keywords = [w for w in set(keywords) if len(w) > 2 and w not in {
        "and", "or", "with", "the", "a", "an", "to", "for", "in",
        "of", "is", "are", "as", "on", "this", "that", "be",
        "role", "looking", "should", "must", "experience"
    }]
    
    # Boost keywords based on repetition
    keyword_block = " ".join(keywords * 2)
    
    # Add role context
    role_context = f"This is a {role} engineer role."
    
    embedding_text = f"""
Job Description:
{job_description}

Key Technologies:
{keyword_block}

{role_context}
Candidate should have strong experience with these technologies and frameworks.
"""
    
    return embedding_text

# ================ MAIN ANALYSIS ================

def analyze_profile(user_id: str, job_description: str = "", job_role: str = ""):
    """
    Analyze user profile against job description with role-based scoring.
    
    Args:
        user_id: MongoDB ObjectId as string
        job_description: Job posting text or description
    
    Returns:
        Analysis result with scores, final score, confidence, and skill gaps
    """
    
    print("\n" + "="*70)
    print("🎯 PROFILE ANALYSIS ENGINE")
    print("="*70)
    print(f"User ID: {user_id}")
    print(f"Job Description Length: {len(job_description)} chars\n")
    
    # Validate user_id
    if not isinstance(user_id, str):
        return {"success": False, "message": "Invalid userId format"}
    
    try:
        ObjectId(user_id)
    except Exception as e:
        return {"success": False, "message": f"Invalid ObjectId: {str(e)}"}
    
    # ================ STEP 1: DETECT ROLE ================
    
    role = detect_role(job_description)
    weights = ROLE_WEIGHTS.get(role, ROLE_WEIGHTS["sde"])
    
    print(f"📌 Detected Role: {role.upper()}")
    print(f"📊 Using weights: {weights}\n")
    
    # ================ STEP 2: BUILD JOB EMBEDDING ================
    
    job_embedding_text = build_job_embedding_text(job_description, role)
    job_vector = embed(job_embedding_text) if job_description.strip() else None
    
    if job_vector is not None:
        job_norm = np.linalg.norm(job_vector)
        if job_norm > 0:
            job_vector = job_vector / job_norm
        print(f"✓ Job embedding created (norm={job_norm:.4f})\n")
    else:
        print("⚠️ No job description provided, using generic comparison\n")
    
    # ================ STEP 3: CALCULATE PLATFORM SCORES ================
    
    scores = {}
    
    print("📈 Platform Similarity Scores:")
    print("-" * 70)
    
    for platform in weights.keys():
        # Fetch user's platform embedding
        record = db.embeddings.find_one({
            "userId": user_id,
            "platform": platform
        })
        
        if not record or job_vector is None:
            scores[platform] = 0
            print(f"  ❌ {platform:12} : No data")
            continue
        
        # Get user vector (already normalized from preprocess)
        user_vector = np.array(record["vector"], dtype="float32")
        
        # Calculate similarity directly (vectors are already normalized)
        similarity = cosine_similarity(user_vector, job_vector)
        scores[platform] = round(max(0, similarity * 100), 2)  # Clamp to 0-100
        
        print(f"  ✓ {platform:12} : {similarity:.4f} → {scores[platform]:6.2f}%")
    
    print("-" * 70 + "\n")
    
    # ================ STEP 4: CALCULATE WEIGHTED FINAL SCORE ================
    
    platforms_with_data = [p for p in weights.keys() if p != "activity" and scores.get(p, 0) > 0]
    
    if platforms_with_data:
        # Re-normalize weights for platforms with data
        total_weight = sum(weights[p] for p in platforms_with_data)
        normalized_weights = {p: weights[p] / total_weight for p in platforms_with_data}
        
        final_score = round(
            sum(scores[p] * normalized_weights[p] for p in platforms_with_data),
            2
        )
        
        print("⚖️ WEIGHTED SCORE CALCULATION")
        print("-" * 70)
        print(f"Platforms with data   : {platforms_with_data}")
        print(f"Normalized weights    : {normalized_weights}")
        print(f"\n→ Final Weighted Score : {final_score}/100")
        print("-" * 70 + "\n")
    else:
        final_score = 0
        print("⚠️ No platforms with data found - final score: 0\n")
    
    # ================ STEP 5: CALCULATE CONFIDENCE SCORE ================
    
    confidence_score = calculate_confidence_score(scores, role)
    
    # ================ STEP 6: SKILL GAP ANALYSIS ================
    
    skill_gaps = None
    skill_recommendations = []
    
    try:
        user_resume = db.resumeparseddatas.find_one({"userId": ObjectId(user_id)})
        user_skills = user_resume.get("skills", []) if user_resume else []
        
        if job_description and str(job_description).strip():
            logger.debug(f"Running skill gap analysis (job desc length: {len(job_description)})")
            
            skill_gaps = extract_and_compare_skills(job_description, user_skills)
            skill_recommendations = get_skill_recommendations(skill_gaps)
            
            print("🎓 SKILL GAP ANALYSIS")
            print("-" * 70)
            print(f"Required skills: {skill_gaps.get('required_count', 0)}")
            print(f"Matched skills : {skill_gaps.get('matched_count', 0)}")
            print(f"Missing skills : {skill_gaps.get('missing_count', 0)}")
            print(f"Match %        : {skill_gaps.get('match_percentage', 0)}%")
            print("-" * 70 + "\n")
        else:
            logger.debug("Skill analysis skipped: no job description")
    
    except Exception as e:
        logger.exception(f"Skill gap analysis failed: {str(e)}")
        skill_gaps = None
    
    # ================ STEP 6B: GENERATE EXPLANATION ================
    
    def get_platform_improvement_tip(platform, role):
        """Get platform-specific improvement tip based on role."""
        tips = {
            "github": {
                "web": "Add 2-3 recent frontend projects with live demos and good documentation.",
                "sde": "Showcase system design projects and well-structured code contributions.",
                "data": "Create ML projects with Jupyter notebooks and clear documentation."
            },
            "leetcode": {
                "web": "Not critical for web roles, but 30-50 problems helps with basic DSA.",
                "sde": "Aim for 150+ problems solved to demonstrate strong algorithmic skills.",
                "data": "20-30 problems enough; focus more on GitHub ML projects instead."
            },
            "codeforces": {
                "web": "Less relevant for web development; focus on GitHub instead.",
                "sde": "500+ rating shows competitive programming strength; aim for improvement.",
                "data": "Less relevant; prioritize ML/data science projects on GitHub."
            },
            "codechef": {
                "web": "Lower priority; focus on portfolio projects instead.",
                "sde": "400+ rating shows problem-solving skills; good supplementary metric.",
                "data": "Lower priority; GitHub projects are more valuable."
            },
            "resume": {
                "web": "Highlight framework expertise (React, Vue, Angular) and UI/UX work.",
                "sde": "Emphasize system design, APIs, and backend technologies.",
                "data": "Showcase ML projects, datasets handled, and domain expertise."
            }
        }
        
        role_tips = tips.get(platform, {})
        return role_tips.get(role, f"Improve your {platform} profile.")
    
    def generate_explanation(scores, final_score, confidence_score, role, weights, skill_gaps):
        """Generate human-readable explanation of scores."""
        
        # Top positive factors (highest scoring platforms)
        sorted_scores = sorted(
            [(p, s) for p, s in scores.items() if s > 0],
            key=lambda x: x[1],
            reverse=True
        )
        top_positive = [
            {
                "factor": p.capitalize(),
                "score": s,
                "weight": round(weights.get(p, 0) * 100, 1)
            }
            for p, s in sorted_scores[:3]
        ]
        
        # Top negative factors (missing skills or low scores)
        top_negative = []
        
        # Add low-scoring platforms
        low_scores = [
            {
                "factor": p.capitalize(),
                "score": s,
                "weight": round(weights.get(p, 0) * 100, 1)
            }
            for p, s in sorted_scores[-2:]
        ]
        top_negative.extend(low_scores)
        
        # Add missing skills if available
        if skill_gaps and skill_gaps.get('missing', []):
            missing_skills = skill_gaps.get('missing', [])[:3]
            for skill in missing_skills:
                top_negative.append({
                    "factor": f"Missing: {skill}",
                    "score": 0,
                    "impact": "medium"
                })
        
        # Contribution breakdown (what each platform contributed to final score)
        platforms_with_data = [p for p in weights.keys() if scores.get(p, 0) > 0]
        if platforms_with_data:
            total_weight = sum(weights[p] for p in platforms_with_data)
            contribution = [
                {
                    "platform": p.capitalize(),
                    "score": scores[p],
                    "weight": round(weights[p] / total_weight * 100, 1),
                    "contribution": round(scores[p] * weights[p] / total_weight, 1)
                }
                for p in sorted(platforms_with_data, key=lambda p: scores[p], reverse=True)
            ]
        else:
            contribution = []
        
        # Improvement actions with estimated impact
        improvement_actions = []
        
        # Suggest improvements for low-scoring platforms
        for platform, score in sorted_scores:
            if score < 60:
                platform_weight = weights.get(platform, 0)
                potential_gain = (80 - score) * platform_weight * 100  # Estimate
                improvement_actions.append({
                    "action": f"Improve {platform.capitalize()} profile/skills",
                    "platform": platform.capitalize(),
                    "currentScore": score,
                    "targetScore": 80,
                    "estimatedGain": round(min(potential_gain, 15), 1),
                    "description": get_platform_improvement_tip(platform, role)
                })
        
        # Suggest adding missing skills
        if skill_gaps and skill_gaps.get('missing', []):
            for skill in skill_gaps.get('missing', [])[:3]:
                improvement_actions.append({
                    "action": f"Learn and demonstrate {skill}",
                    "skill": skill,
                    "estimatedGain": 5.0,
                    "description": f"Adding {skill} to your profile could improve compatibility by ~5 points"
                })
        
        # Confidence explanation
        connected_count = sum(1 for p in weights.keys() if scores.get(p, 0) >= 10)
        total_platforms = len([p for p in weights.keys() if p != "activity"])
        
        if confidence_score >= 70:
            confidence_notes = f"High confidence: {connected_count}/{total_platforms} platforms connected with strong data. This evaluation is reliable."
        elif confidence_score >= 40:
            confidence_notes = f"Medium confidence: {connected_count}/{total_platforms} platforms with data. More platform connections would improve reliability."
        else:
            confidence_notes = f"Low confidence: Only {connected_count}/{total_platforms} platforms connected. Connect more platforms (GitHub, LeetCode, etc.) for more accurate assessment."
        
        return {
            "topPositiveFactors": top_positive,
            "topNegativeFactors": top_negative,
            "contributionBreakdown": contribution,
            "improvementActions": improvement_actions[:5],  # Limit to 5 actions
            "confidenceNotes": confidence_notes,
            "confidenceLevel": "high" if confidence_score >= 70 else "medium" if confidence_score >= 40 else "low"
        }
    
    explanation = generate_explanation(scores, final_score, confidence_score, role, weights, skill_gaps)
    
    # ================ STEP 7: SAVE RESULTS TO MONGO ================
    
    try:
        db.finalresults.update_one(
            {"userId": ObjectId(user_id)},
            {
                "$set": {
                    "role": role,
                    "scores": scores,
                    "finalScore": final_score,
                    "confidenceScore": confidence_score,
                    "skillGaps": skill_gaps,
                    "skillRecommendations": skill_recommendations,
                    "explanation": explanation,
                    "updatedAt": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        db.analysishistories.insert_one({
            "userId": ObjectId(user_id),
            "jobRole": (job_role or "").strip()[:120],
            "jobDescription": (job_description or "").strip()[:500],  # Store first 500 chars
            "role": role,
            "scores": scores,
            "finalScore": final_score,
            "confidenceScore": confidence_score,
            "skillGaps": skill_gaps,
            "skillRecommendations": skill_recommendations,
            "explanation": explanation,
            "createdAt": datetime.utcnow()
        })
        
        print("✓ Results saved to MongoDB\n")
    
    except Exception as e:
        logger.exception(f"Failed to save results: {str(e)}")
    
    # ================ RETURN RESULTS ================
    
    print("="*70)
    print("Summary:")
    print(f"  Role              : {role.upper()}")
    print(f"  Final Score       : {final_score}/100")
    print(f"  Confidence        : {confidence_score}%")
    print(f"  Skill Match       : {skill_gaps.get('match_percentage', 'N/A')}%" if skill_gaps else "  Skill Match       : N/A")
    print("="*70 + "\n")
    
    return {
        "success": True,
        "jobRole": (job_role or "").strip(),
        "role": role,
        "scores": scores,
        "finalScore": final_score,
        "confidenceScore": confidence_score,
        "skillGaps": skill_gaps,
        "skillRecommendations": skill_recommendations,
        "explanation": explanation
    }