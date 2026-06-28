import os
import uuid
import numpy as np
import faiss
from datetime import datetime
from dotenv import load_dotenv
from bson import ObjectId
from pymongo import MongoClient
from fastembed import TextEmbedding

load_dotenv()

# ================ CONFIG ================

MONGO_URL = os.getenv("MONGODB_CONNECTION")
DB_NAME = os.getenv("DB_NAME", "skillsync-ai")
VECTOR_DIM = 384

mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]

embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

# ================ HELPERS ================

def embed(text: str) -> np.ndarray:
    """Embed text and normalize vector."""
    if not text or not str(text).strip():
        return np.zeros(VECTOR_DIM, dtype="float32")
    
    vector = np.array(list(embedder.embed([text]))[0]).astype("float32")
    
    # Normalize vector (L2 norm)
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
    
    return vector

def load_data(db, user_object_id):
    """Load combined profile and resume data from MongoDB."""
    profile = db.combineddatas.find_one({"userId": user_object_id})
    resume = db.resumeparseddatas.find_one({"userId": user_object_id})
    return profile, resume

# ================ TEXT BUILDERS ================

def build_github_text(g: dict) -> str:
    """Build comprehensive GitHub profile description."""
    if not g or not g.get('followers', 0) and not g.get('totalStars', 0):
        return ""
    
    followers = g.get('followers', 0)
    stars = g.get('totalStars', 0)
    prs = g.get('totalPRs', 0)
    commits = g.get('totalCommits', 0)
    repos = g.get('publicRepos', 0)
    languages = g.get('topLanguages', [])
    freq = g.get('commitFrequency', 'low')
    complexity = g.get('projectComplexity', 0)
    
    text = f"""
GitHub Profile - Active Open Source Developer:
Has {followers} followers and received {stars} stars on repositories.
Maintains {repos} public repositories with {commits} total commits.
Contributed {prs} pull requests showing strong collaboration.
Commits at {freq} frequency with projects of moderate to high complexity.
Primary languages: {', '.join(languages[:5]) if languages else 'multiple languages'}.
Active contributor to open source community with demonstrated coding expertise.
"""
    return text.strip()

def build_leetcode_text(lc: dict) -> str:
    """Build LeetCode competitive programming description."""
    if not lc or not lc.get('totalSolved', 0):
        return ""
    
    total = lc.get('totalSolved', 0)
    easy = lc.get('easySolved', 0)
    medium = lc.get('mediumSolved', 0)
    hard = lc.get('hardSolved', 0)
    contests = lc.get('contestsAttended', 0)
    
    text = f"""
LeetCode Coding Interview Profile:
Proficient in data structures and algorithms with {total} problems solved.
Problem-solving breakdown: {easy} easy, {medium} medium, {hard} hard problems.
Participated in {contests} coding contests demonstrating competitive programming skills.
Strong foundation in algorithm implementation and optimization techniques.
"""
    return text.strip()

def build_codeforces_text(cf: dict) -> str:
    """Build Codeforces competitive programming description."""
    if not cf or (cf.get('rating', 0) <= 0 and cf.get('maxRating', 0) <= 0):
        return ""
    
    rating = cf.get('rating', 0)
    max_rating = cf.get('maxRating', 0)
    
    text = f"""
Codeforces Competitive Programming:
Current rating: {rating} with peak rating: {max_rating}.
Demonstrates competitive programming proficiency.
Regular contest participation and algorithm problem solving practice.
"""
    return text.strip()

def build_codechef_text(cc: dict) -> str:
    """Build CodeChef competitive programming description."""
    if not cc or (cc.get('rating', 0) <= 0 and cc.get('stars', 0) <= 0):
        return ""
    
    rating = cc.get('rating', 0)
    stars = cc.get('stars', 0)
    problems = cc.get('totalProblemsSolved', 0)
    
    text = f"""
CodeChef Competitive Programming:
Rating {rating} with {stars}-star proficiency level.
Solved {problems} problems across various difficulty levels.
Consistent competitive coding practice and contest participation.
"""
    return text.strip()

def build_resume_text(resume: dict) -> str:
    """Build resume/experience description."""
    if not resume:
        return ""
    
    skills = resume.get('skills', [])
    if not skills:
        return ""
    
    top_skills = skills[:15]
    all_skills_text = ", ".join(top_skills)
    
    text = f"""
Professional Resume and Experience:
Technical Skills: {all_skills_text}.
Demonstrates knowledge across {len(skills)} technical competencies.
Experience building software projects and solving technical problems.
Professional background in software development and engineering.
"""
    return text.strip()

# ================ MAIN ================

def preprocess_user(user_id: str):
    """
    Preprocess user profile data and generate embeddings for all platforms.
    Stores normalized vectors in MongoDB for later comparison.
    """
    try:
        user_object_id = ObjectId(user_id)
    except:
        return {"success": False, "error": "Invalid ObjectId"}

    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]

    profile, resume = load_data(db, user_object_id)

    if not profile:
        return {"success": False, "error": "Combined profile missing"}
    if not resume:
        return {"success": False, "error": "Resume data missing"}


    print("\n" + "="*70)
    print("📊 PREPROCESSING - PROFILE DATA")
    print("="*70)
    print(f"User ID: {user_id}")
    print(f"  • GitHub followers: {profile.get('github', {}).get('followers', 0)}")
    print(f"  • LeetCode solved: {profile.get('leetcode', {}).get('totalSolved', 0)}")
    print(f"  • Codeforces rating: {profile.get('codeforces', {}).get('rating', 0)}")
    print(f"  • CodeChef rating: {profile.get('codechef', {}).get('rating', 0)}")
    print(f"  • Resume skills: {len(resume.get('skills', []))}")
    print("="*70 + "\n")

    g = profile.get("github", {})
    lc = profile.get("leetcode", {})
    cf = profile.get("codeforces", {})
    cc = profile.get("codechef", {})

    # Build all platform texts
    blocks = {
        "github": build_github_text(g),
        "leetcode": build_leetcode_text(lc),
        "codeforces": build_codeforces_text(cf),
        "codechef": build_codechef_text(cc),
        "resume": build_resume_text(resume)
    }

    # FILTER: Only embed platforms with actual data
    print("🔄 EMBEDDING GENERATION")
    print("-" * 70)
    
    platforms_to_embed = {}
    
    if blocks['github']:
        platforms_to_embed['github'] = blocks['github']
    
    if blocks['leetcode']:
        platforms_to_embed['leetcode'] = blocks['leetcode']
    
    if blocks['codeforces']:
        platforms_to_embed['codeforces'] = blocks['codeforces']
    
    if blocks['codechef']:
        platforms_to_embed['codechef'] = blocks['codechef']
    
    if blocks['resume']:
        platforms_to_embed['resume'] = blocks['resume']
    
    for platform, text in platforms_to_embed.items():
        preview = text[:80].replace('\n', ' ') + "..." if len(text) > 80 else text
        print(f"  ✓ {platform:12} : {preview}")
    
    # Show skipped platforms
    skipped = set(blocks.keys()) - set(platforms_to_embed.keys())
    if skipped:
        print("\n  Skipped platforms (insufficient data):")
        for platform in skipped:
            print(f"  ✗ {platform}")
    
    print("-" * 70 + "\n")

    # Remove old embeddings for this user
    db.embeddings.delete_many({"userId": user_id})

    for platform, text in platforms_to_embed.items():
        vector = embed(text)  # Returns normalized vector
        
        db.embeddings.insert_one({
            "userId": user_id,
            "platform": platform,
            "vector": vector.tolist(),  # Store normalized vector
            "updatedAt": datetime.utcnow()
        })

    print(f"✓ Successfully stored {len(platforms_to_embed)} normalized embeddings\n")

    return {
        "success": True,
        "message": f"Preprocessed {len(platforms_to_embed)} platforms with normalized embeddings"
    }