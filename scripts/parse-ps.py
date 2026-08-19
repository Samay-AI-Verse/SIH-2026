import json
import re
import fitz

PDF = r"C:\SIH landing page\Themes and Problem statements.pdf"
OUT = r"C:\SIH landing page\tmp-problems.json"


def clean(s):
    if not s:
        return ""
    s = s.replace("\n", " ")
    s = s.replace("SoŌware", "Software").replace("SoŌ ware", "Software")
    s = s.replace("Ō", "t").replace("Ɵ", "ti").replace("ﬁ", "fi").replace("ﬂ", "fl")
    s = s.replace("ﬀ", "ff").replace("Σ", "S")
    s = s.replace("lmage", "Image").replace("lmplemen", "Implemen")
    s = s.replace("aximum", "Maximum").replace("ileasures", "Measures")
    s = s.replace("Al,", "AI,").replace(" Al ", " AI ")
    s = s.replace("Plaƞorm", "Platform").replace("CiƟes", "Cities")
    s = s.replace("caƩle", "cattle").replace("buﬀaloes", "buffaloes")
    s = s.replace("AnƟmicrobial", "Antimicrobial")
    s = s.replace("EducaƟon", "Education").replace("AƩendance", "Attendance")
    s = s.replace("AcƟvity", "Activity").replace("AnalyƟcs", "Analytics")
    s = s.replace("PesƟcide", "Pesticide").replace("InfecƟon", "Infection")
    s = s.replace("SegregaƟon", "Segregation").replace("LogisƟcs", "Logistics")
    s = s.replace("transportaƟon", "transportation").replace("soluƟon", "solution")
    s = s.replace("recogniƟon", "recognition")
    return re.sub(r"\s+", " ", s).strip()


def normalize_code(code):
    # OCR sometimes drops a digit: SIH12507 -> SIH25007 is guessed later
    return code.strip()


doc = fitz.open(PDF)
all_rows = []
for page in doc:
    tabs = page.find_tables()
    if not tabs:
        continue
    for table in tabs.tables:
        all_rows.extend(table.extract())

problems = []
current = None
header = {
    "s.no.",
    "problem statement title",
    "category",
    "ps number",
    "theme",
    "problem",
    "statement title",
}

for row in all_rows:
    cells = [(c or "").strip() if c else "" for c in (row or [])]
    while len(cells) < 7:
        cells.append("")
    sno, a, b, c, category, ps, theme = cells[:7]
    joined = " ".join(cells)
    match = re.search(r"SIH\d{5}", joined)
    if match:
        if current:
            problems.append(current)
        title = " ".join(x for x in [a, b, c] if x)
        current = {
            "sno": sno,
            "title": clean(title),
            "category": clean(category),
            "code": normalize_code(match.group(0)),
            "theme": clean(theme),
        }
        continue
    if current:
        extras = []
        for x in [a, b, c]:
            cx = clean(x)
            if cx and cx.lower() not in header:
                extras.append(cx)
        if extras:
            current["title"] = (current["title"] + " " + " ".join(extras)).strip()
        th = clean(theme)
        if th and th.lower() not in header:
            current["theme"] = (current["theme"] + " " + th).strip()
        cat = clean(category)
        if cat and cat.lower() not in header and not current["category"]:
            current["category"] = cat

if current:
    problems.append(current)

seen = {}
for item in problems:
    seen[item["code"]] = item
items = list(seen.values())
items.sort(key=lambda x: x["code"])

# Swap category/theme if Software/Hardware landed in theme
for item in items:
    cat = item["category"].lower()
    theme = item["theme"].lower()
    if theme in {"software", "hardware"} and "software" not in cat and "hardware" not in cat:
        item["category"], item["theme"] = item["theme"], item["category"]
    if "software" in item["category"].lower():
        item["category"] = "Software"
    elif "hardware" in item["category"].lower():
        item["category"] = "Hardware"
    item["title"] = re.sub(r"\s+", " ", item["title"]).strip(" -|")
    item["theme"] = re.sub(r"\s+", " ", item["theme"]).replace(" / /", " / ").strip(" /")

with open(OUT, "w", encoding="utf-8") as handle:
    json.dump(items, handle, ensure_ascii=False, indent=2)

report = "\n".join(f"{p['code']}\t{p['category']}\t{p['theme']}\t{p['title']}" for p in items)
with open(r"C:\SIH landing page\tmp-problems-report.txt", "w", encoding="utf-8") as handle:
    handle.write(f"count {len(items)}\n\n{report}\n")
print("wrote", len(items))
