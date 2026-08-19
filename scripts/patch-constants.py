from pathlib import Path

frontend = Path(r"C:\SIH landing page\src\utils\constants.js")
text = frontend.read_text(encoding="utf-8")
start = text.index("export const SAMPLE_PROBLEMS")
end = text.index("export const FAQ_ITEMS")
insert = (
    'export const PROBLEM_STATEMENTS_PDF = "/docs/SIH-Themes-and-Problem-Statements.pdf";\n'
    "export const SAMPLE_PROBLEMS = PROBLEM_DATA.map((item) => ({ ...item, status: item.status || PROBLEM_STATUS.AVAILABLE }));\n"
)
text = text[:start] + insert + text[end:]
needle = 'import { PROBLEM_STATUS } from "../types";'
if "problem-statements.json" not in text:
    text = text.replace(
        needle,
        needle + '\nimport PROBLEM_DATA from "../data/problem-statements.json";',
    )
frontend.write_text(text, encoding="utf-8")

fn = Path(r"C:\SIH landing page\functions\src\constants.ts")
fn_text = fn.read_text(encoding="utf-8")
start = fn_text.index("export const SAMPLE_PROBLEMS")
end = len(fn_text)
fn_text = fn_text[:start] + "export const SAMPLE_PROBLEMS = problemsJson as Array<{\n  id: string;\n  code?: string;\n  title: string;\n  organization: string;\n  category: string;\n  difficulty: string;\n  description: string;\n  background: string;\n  expectedSolution: string;\n  technicalRequirements: string[];\n  technologies: string[];\n  constraints: string[];\n  evaluationCriteria: string[];\n}>;\n"
if "problems.json" not in fn_text:
    fn_text = fn_text.replace(
        'import { Timestamp } from "firebase-admin/firestore";',
        'import { Timestamp } from "firebase-admin/firestore";\nimport problemsJson from "./problems.json";',
    )
fn.write_text(fn_text, encoding="utf-8")
print("updated frontend and functions constants")
