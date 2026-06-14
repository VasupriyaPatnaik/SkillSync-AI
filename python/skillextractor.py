"""
Extract and compare skills for role-based recommendations
"""

import re
import logging
from collections import Counter

logger = logging.getLogger(__name__)

# Comprehensive skill database (expanded for better matching)
SKILL_KEYWORDS = {
    # Languages
    "python": ["python", "py"],
    "javascript": ["javascript", "js", "nodejs", "node.js"],
    "typescript": ["typescript", "ts"],
    "java": ["java"],
    "c++": ["c++", "cpp"],
    "c#": ["c#", "csharp"],
    "go": ["go", "golang"],
    "rust": ["rust"],
    "php": ["php"],
    "ruby": ["ruby"],
    "swift": ["swift"],
    "kotlin": ["kotlin"],
    "sql": ["sql"],
    
    # Frameworks & Libraries
    "react": ["react", "reactjs", "react.js"],
    "vue": ["vue", "vuejs", "vue.js"],
    "angular": ["angular", "angularjs"],
    "django": ["django"],
    "flask": ["flask"],
    "fastapi": ["fastapi", "fast api"],
    "spring boot": ["spring boot", "springboot", "spring"],
    "express": ["express", "expressjs"],
    "nest.js": ["nestjs", "nest.js"],
    "laravel": ["laravel"],
    "asp.net": ["asp.net", "aspnet"],
    
    # Databases
    "mongodb": ["mongodb", "mongo"],
    "postgresql": ["postgresql", "postgres", "psql"],
    "mysql": ["mysql"],
    "sql server": ["sql server"],
    "redis": ["redis"],
    "firebase": ["firebase"],
    "elasticsearch": ["elasticsearch"],
    "cassandra": ["cassandra"],
    
    # Cloud & DevOps
    "aws": ["aws", "amazon web services"],
    "azure": ["azure", "microsoft azure"],
    "gcp": ["gcp", "google cloud"],
    "docker": ["docker", "containerization"],
    "kubernetes": ["kubernetes", "k8s"],
    "jenkins": ["jenkins"],
    "gitlab ci": ["gitlab ci", "gitlab-ci"],
    "github actions": ["github actions"],
    
    # Tools & Technologies
    "git": ["git", "github", "gitlab", "bitbucket"],
    "rest api": ["rest", "rest api", "restful"],
    "graphql": ["graphql"],
    "grpc": ["grpc"],
    "microservices": ["microservices"],
    "design patterns": ["design patterns"],
    "oop": ["oop", "object-oriented"],
    "solid": ["solid"],
    "testing": ["testing", "jest", "unittest", "pytest", "mocha"],
    "agile": ["agile", "scrum", "kanban"],
    
    # Frontend
    "html": ["html", "html5"],
    "css": ["css", "css3", "scss", "sass"],
    "tailwind": ["tailwind", "tailwind css"],
    "bootstrap": ["bootstrap"],
    "material ui": ["material ui", "materialui"],
    
    # Data & AI
    "machine learning": ["machine learning", "ml"],
    "deep learning": ["deep learning"],
    "tensorflow": ["tensorflow"],
    "pytorch": ["pytorch"],
    "pandas": ["pandas"],
    "numpy": ["numpy"],
    "scikit-learn": ["scikit-learn", "sklearn"],
    "nlp": ["nlp", "natural language processing"],
    
    # Other
    "linux": ["linux", "unix"],
    "windows": ["windows"],
    "macos": ["macos", "mac"],
    "ci/cd": ["ci/cd", "cicd", "continuous integration"],
    "soap": ["soap"],
    "websockets": ["websocket", "socket.io"],
}

# Job title to skills mapping (for inferring skills from job titles)
JOB_TITLE_PATTERNS = {
    "backend": ["python", "java", "spring boot", "node.js", "express", "flask", "django", "sql", "mongodb", "postgresql", "rest api", "microservices"],
    "frontend": ["javascript", "react", "vue", "angular", "html", "css", "tailwind", "typescript"],
    "full.?stack": ["javascript", "react", "node.js", "mongodb", "sql", "python", "express", "rest api"],
    "mobile": ["swift", "kotlin", "java", "react"],
    "devops": ["docker", "kubernetes", "aws", "azure", "jenkins", "ci/cd"],
    "cloud": ["aws", "azure", "gcp", "docker", "kubernetes"],
    "data engineer": ["python", "sql", "redis", "mongodb", "rest api"],
    "machine learning": ["python", "tensorflow", "pytorch", "scikit-learn", "pandas"],
    "ai engineer": ["python", "nlp", "tensorflow", "pytorch"],
}

def normalize_skill(skill):
    """Normalize skill name for matching"""
    return skill.lower().strip()

def extract_skills_from_text(text):
    """
    Extract skills from text (job description or resume)
    Returns a set of normalized skill names
    """
    if not text:
        return set()
    
    text_lower = text.lower()
    found_skills = set()

    logger.debug("Scanning text for explicit skill keywords")
    matches_found = []
    
    # Match against skill keywords
    for skill, keywords in SKILL_KEYWORDS.items():
        for keyword in keywords:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.add(skill)
                matches_found.append((keyword, skill))
                break  # Found this skill, no need to check other keywords
    
    if matches_found:
        logger.debug("Found %s explicit skills", len(matches_found))
    else:
        logger.debug("No explicit skills matched in text")
    
    return found_skills

def compare_skills(user_skills, required_skills):
    """
    Compare user skills against role-required skills
    
    Returns:
    {
        "matched": [...],      # Skills user has that role needs
        "missing": [...],      # Skills role needs but user doesn't have
        "surplus": [...],      # Skills user has that role doesn't require
        "match_percentage": 0-100
    }
    """
    user_set = set(user_skills) if isinstance(user_skills, (list, set)) else user_skills
    required_set = set(required_skills) if isinstance(required_skills, (list, set)) else required_skills
    
    matched = user_set & required_set  # Intersection
    missing = required_set - user_set   # Required but not present
    surplus = user_set - required_set   # Present but not required
    
    # Calculate match percentage
    if required_set:
        match_percentage = round((len(matched) / len(required_set)) * 100, 2)
    else:
        match_percentage = 0
    
    return {
        "matched": sorted(list(matched)),
        "missing": sorted(list(missing)),
        "surplus": sorted(list(surplus)),
        "match_percentage": match_percentage,
        "matched_count": len(matched),
        "missing_count": len(missing),
        "required_count": len(required_set)
    }

def extract_and_compare_skills(job_description, user_skills_list):
    """
    Extract required skills from job description and compare with user skills
    
    Args:
        job_description: str - Full job description text
        user_skills_list: list - User's skills from resume
    
    Returns:
        dict - Comparison result with matched, missing, surplus skills
    """
    logger.debug("Processing job description. length=%s", len(str(job_description)))
    
    # Extract required skills from job description
    required_skills = extract_skills_from_text(job_description)
    
    logger.debug("Explicit skills found: %s", len(required_skills))
    
    # If no skills found, try to infer from job title
    if not required_skills:
        logger.debug("No explicit skills found. Attempting job title inference")
        inferred_from_title = set()
        job_desc_lower = job_description.lower()
        
        for title_pattern, inferred_skills in JOB_TITLE_PATTERNS.items():
            if re.search(r'\b' + title_pattern + r'\b', job_desc_lower):
                inferred_from_title.update(inferred_skills)
                logger.debug("Matched title pattern '%s'", title_pattern)
        
        required_skills = inferred_from_title
        
        if required_skills:
            logger.debug("Inferred skills from title: %s", len(required_skills))
        else:
            logger.debug("Could not infer skills from job description")
    
    # Normalize user skills
    user_skills = set(normalize_skill(s) for s in user_skills_list)
    
    logger.debug("User skills normalized count: %s", len(user_skills))
    
    # Compare
    comparison = compare_skills(user_skills, required_skills)
    
    return comparison

def get_skill_recommendations(comparison_result, max_recommendations=5):
    """
    Get prioritized skill learning recommendations
    
    Args:
        comparison_result: dict - Result from compare_skills()
        max_recommendations: int - Max number of recommendations
    
    Returns:
        list - Prioritized skills to learn
    """
    missing_skills = comparison_result["missing"]
    
    # Prioritize missing skills (could add complexity scoring later)
    recommendations = missing_skills[:max_recommendations]
    
    return recommendations
