import re
import os
import spacy
from spacy.matcher import PhraseMatcher
from PyPDF2 import PdfReader
from docx import Document


SKILL_TERMS = [
    "python", "java", "javascript", "typescript", "c", "c++", "c#", "go", "rust",
    "react", "node.js", "express", "flask", "django", "spring boot", "fastapi",
    "mongodb", "mysql", "postgresql", "redis", "sqlite", "oracle",
    "html", "css", "tailwind", "bootstrap",
    "git", "github", "docker", "kubernetes", "linux", "aws", "azure", "gcp",
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "nlp", "machine learning",
    "data structures", "algorithms", "rest api", "graphql", "oop", "dbms", "sql",
]

SECTION_ALIASES = {
    "skills": [
        "Skills",
        "Technical Skills",
        "Core Skills",
        "Tech Stack",
        "Technical Proficiencies",
        "Technical Expertise",
        "Tools & Technologies",
        "Programming Languages",
    ],
    "education": ["Education", "Academic Background", "Qualification", "Qualifications"],
    "projects": ["Projects", "Academic Projects", "Personal Projects"],
    "experience": ["Experience", "Work Experience", "Professional Experience", "Internships", "Internship"],
    "certifications": ["Certifications", "Certificates", "Licenses & Certifications", "License & Certifications"],
    "achievements": [
        "Achievements",
        "Achievements & Leadership",
        "Awards",
        "Honors",
        "Accomplishments",
        "Leadership",
        "Activities & Leadership",
    ],
}

ALL_SECTION_HEADINGS = sorted(
    {heading for headings in SECTION_ALIASES.values() for heading in headings},
    key=len,
    reverse=True,
)
ALL_SECTION_HEADINGS_PATTERN = "|".join(re.escape(heading) for heading in ALL_SECTION_HEADINGS)


def _load_nlp():
    try:
        return spacy.load("en_core_web_sm")
    except Exception:
        return spacy.blank("en")


NLP = _load_nlp()
SKILL_MATCHER = PhraseMatcher(NLP.vocab, attr="LOWER")
SKILL_MATCHER.add("SKILLS", [NLP.make_doc(skill) for skill in SKILL_TERMS])


# ---------------- DOCUMENT READERS ----------------

def read_pdf(path):
    """Extract text from PDF file."""
    text = ""
    reader = PdfReader(path)

    for page in reader.pages:
        part = page.extract_text()
        if part:
            text += part + "\n"

    return text


def read_docx(path):
    """Extract text from DOCX file."""
    doc = Document(path)
    text = ""

    for paragraph in doc.paragraphs:
        if paragraph.text.strip():
            text += paragraph.text + "\n"

    return text


def normalize_text(text):
    """Apply text normalization and spacing fixes."""
    # Fix merged lowercase-uppercase words
    text = re.sub(r"([a-z])([A-Z])", r"\1 \2", text)

    # Fix merged alpha-numeric words (accuracyon, of11,777among)
    text = re.sub(r"([A-Za-z])(\d)", r"\1 \2", text)
    text = re.sub(r"(\d)([A-Za-z])", r"\1 \2", text)

    # Fix missing spaces after punctuation/symbol boundaries
    text = re.sub(r"([,.;:!?])([A-Za-z])", r"\1 \2", text)
    text = re.sub(r"\+([A-Za-z])", r"+ \1", text)
    text = re.sub(r"([A-Za-z])\(", r"\1 (", text)

    # Fix merged month (Ltd.May → Ltd. May)
    text = re.sub(
        r"\.(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)",
        r". \1",
        text
    )

    # Force newlines around known section headings (line-safe normalization)
    for aliases in SECTION_ALIASES.values():
        for heading in aliases:
            text = re.sub(
                rf"(?im)^[ \t]*{re.escape(heading)}[ \t]*$",
                f"\n{heading}\n",
                text,
            )

    return text


def read_document(path):
    """Automatically detect file type and extract text."""
    _, ext = os.path.splitext(path.lower())
    
    if ext == ".pdf":
        text = read_pdf(path)
    elif ext in [".docx", ".doc"]:
        text = read_docx(path)
    else:
        raise ValueError(f"Unsupported file format: {ext}. Only PDF and DOCX are supported.")
    
    # Apply normalization
    text = normalize_text(text)
    
    # Clean spacing
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n", "\n", text)

    return text.strip()


# ---------------- BASIC INFO ----------------

def find_email(text):
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else None


def find_phone(text):
    match = re.search(r"(\+?\d{1,3}[\s-]?)?\d{10}", text)
    return match.group(0) if match else None


def find_name(text):
    lines = text.split("\n")[:5]
    for line in lines:
        line = line.strip()
        if 5 < len(line) < 60 and re.match(r"^[A-Z][a-zA-Z]+\s[A-Z][a-zA-Z]+", line):
            return line
    return None


# ---------------- SECTION SPLITTER ----------------

def extract_section(text, section_name):
    pattern = rf"\n{re.escape(section_name)}\n(.*?)(?=\n(?:{ALL_SECTION_HEADINGS_PATTERN})\n|\Z)"
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else ""


def extract_section_by_aliases(text, aliases):
    for alias in aliases:
        block = extract_section(text, alias)
        if block:
            return block
    return ""


def parse_section_lines(block):
    if not block:
        return []

    lines = block.split("\n")
    merged = []

    def is_continuation_line(line_text):
        if not merged:
            return False
        if not line_text:
            return False

        prev = merged[-1]
        starts_lower_or_symbol = bool(re.match(r"^[a-z(\[]", line_text))
        prev_not_terminal = not re.search(r"[.!?:)]$", prev)
        very_short_line = len(line_text.split()) <= 4
        return starts_lower_or_symbol or (prev_not_terminal and very_short_line)

    for line in lines:
        cleaned = re.sub(r"\s+", " ", line).strip("•-\t :")
        if not cleaned:
            continue
        if len(cleaned) < 3:
            continue

        if is_continuation_line(cleaned):
            merged[-1] = f"{merged[-1]} {cleaned}".strip()
        else:
            merged.append(cleaned)

    items = merged

    deduped = []
    seen = set()
    for item in items:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)

    return deduped


# ---------------- SKILLS ----------------

def find_skills(text):
    skills_block = extract_section_by_aliases(text, SECTION_ALIASES["skills"])
    source_text = skills_block if skills_block else text
    if not source_text:
        return []

    doc = NLP(source_text)
    extracted = set()

    for _, start, end in SKILL_MATCHER(doc):
        span = doc[start:end].text.strip()
        if span:
            extracted.add(span)

    for ent in doc.ents:
        if ent.label_ in {"ORG", "PRODUCT", "WORK_OF_ART", "LANGUAGE"}:
            token_count = len(ent.text.split())
            if 1 <= token_count <= 4:
                extracted.add(ent.text.strip())

    noun_chunks = doc.noun_chunks if doc.has_annotation("DEP") else []
    for chunk in noun_chunks:
        chunk_text = chunk.text.strip("•- \t:;")
        if 1 <= len(chunk_text.split()) <= 4:
            lowered = chunk_text.lower()
            if any(term in lowered for term in SKILL_TERMS):
                extracted.add(chunk_text)

    cleaned_skills = []
    seen = set()
    for skill in extracted:
        normalized = re.sub(r"\s+", " ", skill).strip(" ,.;:-")
        if len(normalized) < 2:
            continue

        dedupe_key = normalized.lower()
        if dedupe_key in seen:
            continue

        seen.add(dedupe_key)
        cleaned_skills.append(normalized)

    return sorted(cleaned_skills, key=str.lower)


# ---------------- EDUCATION ----------------

def find_education(text):
    block = extract_section_by_aliases(text, SECTION_ALIASES["education"])
    return parse_section_lines(block)


# ---------------- PROJECT NAMES ONLY ----------------

def find_projects(text):
    block = extract_section_by_aliases(text, SECTION_ALIASES["projects"])
    if not block:
        return []

    lines = parse_section_lines(block)

    def looks_like_project_title(line_text):
        words = line_text.split()
        if len(words) > 16:
            return False

        lowered = line_text.lower()
        if lowered.startswith((
            "built ", "developed ", "implemented ", "designed ", "integrated ",
            "worked ", "processed ", "collaborated ", "automated ", "created ",
        )):
            return False

        has_title_separator = (" - " in line_text) or (" – " in line_text) or (" | " in line_text)
        has_link_marker = "link" in lowered
        has_project_keywords = any(keyword in lowered for keyword in ["system", "assistant", "platform", "app", "bot", "tracker"])

        return has_title_separator or has_link_marker or has_project_keywords

    project_titles = []
    seen = set()
    for line in lines:
        normalized = (
            line.replace("(GitHub)", "")
            .replace("(Git Hub)", "")
            .replace(" Link", "")
            .strip(" -–|")
        )
        if not normalized:
            continue

        if looks_like_project_title(normalized):
            key = normalized.lower()
            if key not in seen:
                seen.add(key)
                project_titles.append(normalized)

    if project_titles:
        return project_titles

    fallback = []
    for line in lines[:4]:
        if len(line.split()) <= 12:
            fallback.append(line)
    return fallback


def find_experience(text):
    block = extract_section_by_aliases(text, SECTION_ALIASES["experience"])
    return parse_section_lines(block)


def find_certifications(text):
    block = extract_section_by_aliases(text, SECTION_ALIASES["certifications"])
    return parse_section_lines(block)


def find_achievements(text):
    block = extract_section_by_aliases(text, SECTION_ALIASES["achievements"])
    return parse_section_lines(block)


# ---------------- MAIN PARSER ----------------

def parse_resume(path):
    text = read_document(path)

    return {
        "name": find_name(text),
        "email": find_email(text),
        "phone": find_phone(text),
        "education": find_education(text),
        "skills": find_skills(text),
        "projects": find_projects(text),
        "experience": find_experience(text),
        "certifications": find_certifications(text),
        "achievements": find_achievements(text),
        "raw_text": text[:15000],   # for embeddings
    }