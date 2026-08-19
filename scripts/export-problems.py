import json
import re

SRC = r"C:\SIH landing page\tmp-problems.json"
OUT = r"C:\SIH landing page\src\data\problem-statements.json"
FN_OUT = r"C:\SIH landing page\functions\src\problems.json"

REPLACEMENTS = [
    ("Al-", "AI-"),
    ("Al,", "AI,"),
    ("Al ", "AI "),
    ("lssue", "Issue"),
    ("Systern", "System"),
    ("Circulanty", "Circularity"),
    ("virtuall", "virtual"),
    ("sotware", "software"),
    ("fiƫngs", "fittings"),
    ("altermative", "alternative"),
    ("Problem Statement Title", ""),
    ("Track fiƫngs", "Track fittings"),
    ("on 'track fittings on Indian Railways'.", "on track fittings on Indian Railways"),
]


def polish(text):
    if not text:
        return ""
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    text = re.sub(r"\s+", " ", text).strip(" -•,")
    return text


raw = json.load(open(SRC, encoding="utf-8"))
problems = []
for index, item in enumerate(raw, start=1):
    code = item["code"]
    title = polish(item["title"])
    category = item["category"] or "Software"
    theme = polish(item["theme"])
    if theme == code or theme.lower() in {"software", "hardware"}:
        theme = ""
    if not theme:
        theme = "Miscellaneous"
    difficulty = "Hard" if category == "Hardware" else "Medium"
    problems.append(
        {
            "id": code,
            "code": code,
            "title": title,
            "organization": theme,
            "category": category,
            "theme": theme,
            "difficulty": difficulty,
            "description": f"{title} Official SIH problem statement {code} under {theme} ({category}).",
            "background": f"Published in the SIH Themes and Problem Statements booklet. Theme: {theme}.",
            "expectedSolution": f"A working {category.lower()} prototype that addresses: {title}",
            "technicalRequirements": [category, theme],
            "technologies": [category, theme],
            "constraints": ["Follow SIH guidelines from the official problem-statement PDF."],
            "evaluationCriteria": ["Relevance to the problem", "Technical feasibility", "Impact"],
            "selectedCount": 0,
            "maxSelections": 2,
            "status": "AVAILABLE",
            "pdfPage": None,
            "sortOrder": index,
        }
    )

json.dump(problems, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump(problems, open(FN_OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(len(problems), "problems written")
