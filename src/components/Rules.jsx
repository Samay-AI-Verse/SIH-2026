import { useState } from "react";
import { 
  Users, 
  ShieldCheck, 
  Target, 
  Award, 
  Scale, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Code, 
  GitBranch, 
  HeartHandshake, 
  BadgePercent,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "./ui/SectionHeading";
import { PROBLEM_STATEMENTS_PDF } from "../utils/constants";

const ruleCategories = [
  {
    id: "team",
    title: "1. Team Composition & Eligibility",
    icon: Users,
    badge: "MANDATORY",
    badgeColor: "bg-spidey text-white",
    summary: "Strict 6-member student roster with mandatory female participation.",
    highlights: [
      { label: "Team Size", value: "Exactly 6 Students", desc: "Teams with more or fewer than 6 members will be automatically disqualified." },
      { label: "Female Representation", value: "At Least 1 Female", desc: "Mandatory as per Ministry of Education SIH national diversity mandate." },
      { label: "Academic Eligibility", value: "B.Tech / BCA / MCA / Diploma", desc: "Open to all branches (CSE, IT, AI&DS, E&TC, Mech, Civil, Electrical, etc.)." },
      { label: "Identity Proof", value: "College ID Mandatory", desc: "All 6 participants must carry original physical college identity cards." }
    ],
    rules: [
      "All team members must be enrolled students of a recognized academic institution or university.",
      "Inter-branch teams within the same college are highly encouraged to promote cross-functional problem solving.",
      "The Team Leader is the primary point of contact for mentor sessions, project submission, and cash prize disbursements.",
      "No student is allowed to participate in more than one team."
    ]
  },
  {
    id: "problem",
    title: "2. Problem Allocation & 2-Team Limit",
    icon: Target,
    badge: "LIVE LOCKING",
    badgeColor: "bg-gold text-web",
    summary: "Real-time quota locking: maximum 2 teams per problem statement.",
    highlights: [
      { label: "Quota Limit", value: "Max 2 Teams / Problem", desc: "Ensures diverse competition without over-clustering on a single statement." },
      { label: "Real-time Lock", value: "Instant Quota Lock", desc: "Once 2 teams confirm payment, the statement is locked across India." },
      { label: "Open Innovation", value: "Unlimited Teams", desc: "Bring your own breakthrough idea outside the published PS list." },
      { label: "Selection Finality", value: "No Team Swapping", desc: "Problem selection is permanent once locked to prevent unfair slot hoarding." }
    ],
    rules: [
      "Problem statement allocation operates strictly on a first-come, first-verified basis after ₹300 registration confirmation.",
      "Teams choosing Open Innovation must submit an original Project Title, Abstract, and Proposed Architecture.",
      "Problem changes are strictly prohibited after submission unless sanctioned by the central technical committee under exceptional circumstances."
    ]
  },
  {
    id: "evaluation",
    title: "3. Judging & Evaluation Rubric",
    icon: Award,
    badge: "100 POINTS",
    badgeColor: "bg-web text-white",
    summary: "Transparent evaluation by industry mentors and academic experts.",
    highlights: [
      { label: "Innovation (25 pts)", value: "Novelty & Uniqueness", desc: "Originality of the conceptual approach and creative problem solving." },
      { label: "Tech Depth (25 pts)", value: "Architecture & Stack", desc: "Code quality, database design, API scalability, and edge optimization." },
      { label: "Working Demo (25 pts)", value: "Live Functional Prototype", desc: "Working software prototype solving the core edge cases without mockups." },
      { label: "Impact (25 pts)", value: "Feasibility & Social ROI", desc: "Market readiness, user experience, and real-world deployment viability." }
    ],
    rules: [
      "Mentors will conduct 3 milestone evaluation rounds during the hackathon sprint.",
      "PowerPoint slides alone are NOT sufficient; a live functioning software/hardware demonstration is compulsory.",
      "Jury decisions regarding scores, shortlisting, and awards are final and binding."
    ]
  },
  {
    id: "integrity",
    title: "4. Code of Conduct & IP Integrity",
    icon: ShieldCheck,
    badge: "ZERO TOLERANCE",
    badgeColor: "bg-red-700 text-white",
    summary: "Strict zero-tolerance policy towards plagiarism and AI scraping.",
    highlights: [
      { label: "Original Code", value: "100% Original Work", desc: "All core business logic must be authored during the official hackathon." },
      { label: "Version Control", value: "GitHub / GitLab", desc: "Teams must commit code incrementally with verified Git author history." },
      { label: "Open Source", value: "Permissible Libraries", desc: "Standard frameworks (React, FastAPI, PyTorch) are allowed; full project clones are banned." },
      { label: "IP Ownership", value: "100% Student Owned", desc: "Students retain full intellectual property rights for their submitted creations." }
    ],
    rules: [
      "Any team caught submitting pre-existing commercial projects or plagiarized GitHub repositories will face immediate disqualification.",
      "Respectful and professional conduct towards jury members, fellow participants, and coordinators is strictly enforced.",
      "Disqualification automatically forfeits eligibility for prizes, mentor recommendations, and event certificates."
    ]
  }
];

export function Rules() {
  const [activeTab, setActiveTab] = useState("team");
  const currentCategory = ruleCategories.find((c) => c.id === activeTab) || ruleCategories[0];

  return (
    <section id="rules" className="relative overflow-hidden px-4 py-24 md:px-6 bg-slate-50/50">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Official Guidelines"
          title="Rules that keep selection fair"
          copy="Standardized under Smart India Hackathon national framework to ensure transparent competition, equal opportunity, and rigorous evaluation for all participants."
        />

        {/* Quick Eligibility Highlight Ribbon */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          <div className="rounded-2xl border-3 border-web bg-white p-4 text-center shadow-comic">
            <span className="font-display text-3xl sm:text-4xl text-spidey">6</span>
            <p className="mt-1 text-xs font-black uppercase tracking-wider text-web">Members / Team</p>
            <p className="text-[11px] font-bold text-ink/60 mt-0.5">Strict Roster Size</p>
          </div>

          <div className="rounded-2xl border-3 border-web bg-white p-4 text-center shadow-comic">
            <span className="font-display text-3xl sm:text-4xl text-gold-dark text-amber-600">1+</span>
            <p className="mt-1 text-xs font-black uppercase tracking-wider text-web">Female Member</p>
            <p className="text-[11px] font-bold text-ink/60 mt-0.5">Mandatory Diversity</p>
          </div>

          <div className="rounded-2xl border-3 border-web bg-white p-4 text-center shadow-comic">
            <span className="font-display text-3xl sm:text-4xl text-spidey">2</span>
            <p className="mt-1 text-xs font-black uppercase tracking-wider text-web">Teams / Problem</p>
            <p className="text-[11px] font-bold text-ink/60 mt-0.5">Strict Quota Limit</p>
          </div>

          <div className="rounded-2xl border-3 border-web bg-white p-4 text-center shadow-comic">
            <span className="font-display text-3xl sm:text-4xl text-green-600">100%</span>
            <p className="mt-1 text-xs font-black uppercase tracking-wider text-web">Original Code</p>
            <p className="text-[11px] font-bold text-ink/60 mt-0.5">Live Git Commits</p>
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {ruleCategories.map((cat) => {
            const isSelected = activeTab === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`font-ui inline-flex items-center gap-2 rounded-2xl border-3 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all ${
                  isSelected
                    ? "border-web bg-web text-white shadow-comic -translate-y-0.5"
                    : "border-web/30 bg-white text-ink hover:border-web hover:bg-slate-100"
                }`}
              >
                <Icon size={16} className={isSelected ? "text-gold" : "text-spidey"} />
                <span>{cat.title.split(". ")[1]}</span>
              </button>
            );
          })}
        </div>

        {/* Detailed Interactive Rule Display Card */}
        <div className="mt-8 rounded-3xl border-4 border-web bg-white p-6 sm:p-10 shadow-comic animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-web/15 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border-2 border-web bg-gold/20 p-3 text-web">
                <currentCategory.icon size={26} />
              </div>
              <div>
                <span className={`inline-block rounded-md px-2.5 py-0.5 text-[10px] font-black tracking-widest ${currentCategory.badgeColor}`}>
                  {currentCategory.badge}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-web mt-1">{currentCategory.title}</h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-bold text-ink/70 max-w-md">
              {currentCategory.summary}
            </p>
          </div>

          {/* 4 Feature Badges Grid */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {currentCategory.highlights.map((item, idx) => (
              <div key={idx} className="rounded-2xl border-2 border-web/20 bg-slate-50/70 p-4 transition hover:border-web hover:bg-white hover:shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-wider text-spidey">{item.label}</p>
                <p className="mt-1 font-display text-lg sm:text-xl text-web">{item.value}</p>
                <p className="mt-1 text-xs font-semibold text-ink/70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Detailed Clauses List */}
          <div className="mt-8 rounded-2xl border-2 border-web bg-gold/15 p-6">
            <h4 className="font-display text-lg text-web flex items-center gap-2">
              <CheckCircle2 size={18} className="text-web" /> Detailed Regulations & Enforcement
            </h4>
            <div className="mt-3 space-y-2.5">
              {currentCategory.rules.map((ruleText, index) => (
                <div key={index} className="flex items-start gap-2.5 text-xs sm:text-sm font-bold text-ink/85">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-web text-[10px] font-black text-white">
                    {index + 1}
                  </span>
                  <p className="leading-relaxed">{ruleText}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PDF Download Action Strip */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t-2 border-web/15 pt-6">
            <div className="flex items-center gap-2 text-xs font-bold text-ink/70">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>All rules are formulated as per AICTE and MoE Innovation Cell guidelines.</span>
            </div>

            <a
              href={PROBLEM_STATEMENTS_PDF}
              target="_blank"
              rel="noreferrer"
              className="font-ui inline-flex items-center justify-center gap-2 rounded-xl bg-web px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-comic hover:bg-spidey transition"
            >
              <Download size={15} /> Download Official SIH Guidelines PDF
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
