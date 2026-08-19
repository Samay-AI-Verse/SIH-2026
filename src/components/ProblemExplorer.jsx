import { useMemo, useState } from "react";
import { Search, Sparkles, Lightbulb } from "lucide-react";
import { ProblemCard } from "./ProblemCard";
import { SectionHeading } from "./ui/SectionHeading";
import { Skeleton } from "./ui/Skeleton";
import { TextInput } from "./ui/Field";
import { Button } from "./ui/Button";
import { useProblems } from "../hooks/useProblems";
import { PROBLEM_STATEMENTS_PDF, OPEN_INNOVATION_PROBLEM } from "../utils/constants";

const filters = ["All", "AVAILABLE", "OPEN INNOVATION", "FULL", "LOCKED"];

export function ProblemExplorer({ compact = false, canSelect = false, selectedProblemId, onSelect }) {
    const { problems, loading } = useProblems();
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [technology, setTechnology] = useState("All");
    const [organization, setOrganization] = useState("All");
    const [difficulty, setDifficulty] = useState("All");
    const [availability, setAvailability] = useState("All");

    const openInnoProblem = useMemo(() => {
      return problems.find((p) => p.id === "OPEN_INNOVATION" || p.isOpenInnovation) || OPEN_INNOVATION_PROBLEM;
    }, [problems]);

    const categories = useMemo(() => ["All", ...new Set(problems.map((item) => item.category))], [problems]);
    const technologies = useMemo(() => ["All", ...new Set(problems.flatMap((item) => item.technologies || []))], [problems]);
    const organizations = useMemo(() => ["All", ...new Set(problems.map((item) => item.organization))], [problems]);
    const difficulties = useMemo(() => ["All", ...new Set(problems.map((item) => item.difficulty))], [problems]);

    const visible = problems.filter((item) => {
        if (availability === "OPEN INNOVATION") {
          return item.id === "OPEN_INNOVATION" || item.isOpenInnovation || item.category === "Open Innovation";
        }
        const haystack = `${item.title} ${item.description} ${item.code} ${item.organization} ${item.category} ${(item.technologies || []).join(" ")}`.toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        return (
            matchesSearch &&
            (category === "All" || item.category === category) &&
            (technology === "All" || item.technologies?.includes(technology)) &&
            (organization === "All" || item.organization === organization) &&
            (difficulty === "All" || item.difficulty === difficulty) &&
            (availability === "All" || item.status === availability)
        );
    });

    const list = compact ? visible.slice(0, 6) : visible;

    return (
      <section id="problems" className="section-lilac px-4 py-24 md:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Problem statements & Open Theme" title="Find your challenge or submit your own idea" copy="Choose from 100+ official SIH problem statements or submit your custom project idea under Open Innovation."/>
          
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="secondary" href={PROBLEM_STATEMENTS_PDF} target="_blank" rel="noreferrer">
              Download Problem Statements PDF
            </Button>
          </div>

          {/* DEDICATED THEME: OPEN INNOVATION HERO CARD */}
          <div className="relative mt-8 overflow-hidden rounded-3xl border-4 border-web bg-gradient-to-r from-cream via-amber-50 to-gold/30 p-6 md:p-8 shadow-comic">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-web bg-gold px-3.5 py-1 text-xs font-black tracking-widest text-web">
                  <Sparkles size={15} /> DEDICATED THEME: OPEN INNOVATION
                </span>
                <h3 className="font-display text-2xl md:text-3xl text-web comic-pop flex items-center gap-2">
                  <Lightbulb className="text-amber-500 shrink-0" size={28} /> Have Your Own Unique Project Idea?
                </h3>
                <p className="text-xs md:text-sm font-semibold text-ink/80 leading-relaxed">
                  Have a custom project outside the listed problem statements? Choose <strong>Open Innovation</strong> to submit your team's custom problem title, abstract, tech stack, and architecture solution!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
                <Button
                  variant="primary"
                  className="w-full md:w-auto text-xs sm:text-sm font-black py-3 px-6 shadow-comic bg-web text-white hover:bg-web/90"
                  onClick={() => onSelect?.(openInnoProblem)}
                  disabled={!canSelect}
                >
                  <Sparkles size={16} className="mr-2 text-gold" /> Select Open Innovation
                </Button>
              </div>
            </div>
          </div>

          {/* Filters & Explorer */}
          <div className="mt-10 grid gap-3 surface-card p-4 md:grid-cols-2 lg:grid-cols-6">
            <label className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"/>
              <TextInput className="pl-10" placeholder="Search problem statements" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search problem statements"/>
            </label>
            {[
              ["Category", category, setCategory, categories],
              ["Technology", technology, setTechnology, technologies],
              ["Organization", organization, setOrganization, organizations],
              ["Difficulty", difficulty, setDifficulty, difficulties],
            ].map(([label, value, setter, options]) => (
              <select key={String(label)} aria-label={String(label)} className="rounded-md border-2 border-web bg-white px-3 py-3 text-sm text-ink transition hover:border-spidey" value={String(value)} onChange={(event) => setter(event.target.value)}>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option === "All" ? String(label) : option}
                  </option>
                ))}
              </select>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map((item) => (
              <button key={item} onClick={() => setAvailability(item)} className={`rounded-md px-4 py-2 text-xs font-black tracking-[0.16em] uppercase transition ${availability === item ? "bg-spidey text-white shadow-[4px_4px_0_#071433]" : "bg-white text-web hover:bg-gold"}`}>
                {item}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (<Skeleton key={index} className="h-80"/>))}
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((problem) => (
                <ProblemCard key={problem.id} problem={problem} canSelect={canSelect} selectedProblemId={selectedProblemId} onSelect={onSelect}/>
              ))}
            </div>
          )}

          {!loading && list.length === 0 ? (<p className="mt-10 text-center text-ink/50">No problem statements match these filters.</p>) : null}
          {compact && !loading ? (
            <div className="mt-10 text-center">
              <Button to="/problems">View all {problems.length} problem statements</Button>
            </div>
          ) : null}
        </div>
      </section>
    );
}
