import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Crown, Pencil, Plus, Trash2, Users, AlertCircle, Phone, Mail, ShieldCheck, GraduationCap, Layers } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Field, SelectInput, TextInput } from "../components/ui/Field";
import { useSettings } from "../hooks/useSettings";
import { INDIAN_STATES, STREAMS_CONFIG, BRANCHES } from "../utils/constants";
import { emptyMember, validateMember, validateTeamInfo, validateTeamRoster } from "../utils/validation";
import { createTeamRegistration } from "../services/apiService";
import { saveTeamSession } from "../lib/session";
import { formatINR } from "../utils/cn";

const steps = ["Team & Leader", "5 Team Members", "Review & Confirm"];

export function Register() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [memberErrors, setMemberErrors] = useState({});
  const [editing, setEditing] = useState(emptyMember());
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showFemaleModal, setShowFemaleModal] = useState(false);

  function scrollToFormTop() {
    setTimeout(() => {
      const container = document.getElementById("register-form-card") || document.getElementById("register-header-banner");
      if (container) {
        container.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 40);
  }

  useEffect(() => {
    scrollToFormTop();
  }, [step]);

  const [form, setForm] = useState({
    teamName: "",
    college: "",
    university: "",
    city: "",
    state: "Maharashtra",
    leaderName: "",
    email: "",
    phone: "",
    leaderGender: "",
    leaderCourse: "B.Tech",
    leaderBranch: "",
    leaderYear: "3rd Year",
    members: [],
  });

  const streamConfig = useMemo(() => {
    return STREAMS_CONFIG[form.leaderCourse] || STREAMS_CONFIG["B.Tech"];
  }, [form.leaderCourse]);

  const leaderAsMember = useMemo(
    () =>
      emptyMember({
        id: "leader-member-id",
        name: form.leaderName,
        email: form.email,
        phone: form.phone,
        college: form.college,
        gender: form.leaderGender,
        course: form.leaderCourse,
        branch: form.leaderBranch,
        year: form.leaderYear,
      }),
    [form]
  );

  const totalMembers = form.members.length;
  const femaleCount = form.members.filter((m) => String(m.gender).toLowerCase() === "female").length;
  const isFemaleSatisfied = femaleCount >= 1;

  // Compute Year Composition (e.g. "All 3rd Year" or "Mixed Years")
  const yearSummary = useMemo(() => {
    if (!form.members.length) return null;
    const yearCounts = {};
    form.members.forEach((m) => {
      if (m.year) {
        yearCounts[m.year] = (yearCounts[m.year] || 0) + 1;
      }
    });
    const entries = Object.entries(yearCounts);
    if (entries.length === 1) {
      return { isMixed: false, label: `All ${entries[0][0]} (${entries[0][1]} members)` };
    }
    const details = entries.map(([yr, cnt]) => `${cnt}x ${yr}`).join(", ");
    return { isMixed: true, label: `Mixed Years: ${details}` };
  }, [form.members]);

  function handleStreamChange(newStream) {
    const nextConfig = STREAMS_CONFIG[newStream] || STREAMS_CONFIG["B.Tech"];
    const defaultYear = nextConfig.years[Math.min(2, nextConfig.years.length - 1)] || nextConfig.years[0];
    
    setForm((curr) => ({
      ...curr,
      leaderCourse: newStream,
      leaderYear: defaultYear,
      // Update existing members to the same stream and reset year if out of bounds
      members: curr.members.map((m) => ({
        ...m,
        course: newStream,
        year: nextConfig.years.includes(m.year) ? m.year : defaultYear,
      })),
    }));
    
    setEditing((curr) => ({
      ...curr,
      course: newStream,
      year: nextConfig.years.includes(curr.year) ? curr.year : defaultYear,
    }));
  }

  function nextFromTeam() {
    const nextErrors = validateTeamInfo(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    // Set leader as first member if not present or update leader
    setForm((current) => {
      const nonLeaderMembers = current.members.filter((m) => m.id !== "leader-member-id" && m.email !== form.email);
      return {
        ...current,
        members: [leaderAsMember, ...nonLeaderMembers],
      };
    });
    setEditing(emptyMember({ college: form.college, course: form.leaderCourse, branch: form.leaderBranch, year: form.leaderYear }));
    setStep(1);
    scrollToFormTop();
  }

  function addOrUpdateMember() {
    if (!editing.name || !editing.name.trim()) {
      setMemberErrors({ name: "Member full name is required." });
      return;
    }
    if (!editing.gender) {
      setMemberErrors({ gender: "Please select gender." });
      return;
    }
    if (!editing.branch || !editing.branch.trim()) {
      setMemberErrors({ branch: "Please specify department / branch." });
      return;
    }
    if (!editing.year) {
      setMemberErrors({ year: "Please select study year." });
      return;
    }

    const memberToSave = {
      ...editing,
      course: form.leaderCourse, // Strictly enforce team's stream
      college: form.college,
    };

    const others = form.members.filter((item) => item.id !== editing.id);
    const nextErrors = validateMember(memberToSave, others);
    setMemberErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const isUpdating = form.members.some((item) => item.id === editing.id);
    if (!isUpdating && form.members.length >= settings.maxMembers) {
      setMemberErrors({ roster: `A team can have exactly ${settings.maxMembers} members (1 Leader + 5 Members).` });
      return;
    }

    setForm((current) => {
      if (isUpdating) {
        return {
          ...current,
          members: current.members.map((item) => (item.id === memberToSave.id ? memberToSave : item)),
        };
      }
      return {
        ...current,
        members: [...current.members, memberToSave],
      };
    });

    setEditing(emptyMember({ college: form.college, course: form.leaderCourse, branch: form.leaderBranch, year: form.leaderYear }));
    setMemberErrors({});
    scrollToFormTop();
  }

  function handleEditMember(member) {
    if (member.id === "leader-member-id" || member.email === form.email) {
      setStep(0);
      scrollToFormTop();
      return;
    }
    setEditing(member);
    setMemberErrors({});
    scrollToFormTop();
  }

  function handleRemoveMember(memberId) {
    setForm((current) => ({
      ...current,
      members: current.members.filter((m) => m.id !== memberId),
    }));
  }

  function proceedToReview() {
    const hasFemale = form.members.some((m) => String(m.gender).toLowerCase() === "female");
    if (!hasFemale) {
      setShowFemaleModal(true);
      return;
    }
    const rosterErrors = validateTeamRoster(form.members, settings.minMembers, settings.maxMembers);
    if (Object.keys(rosterErrors).length) {
      setMemberErrors(rosterErrors);
      return;
    }
    setStep(2);
    scrollToFormTop();
  }

  async function submitTeam() {
    const hasFemale = form.members.some((m) => String(m.gender).toLowerCase() === "female");
    if (!hasFemale) {
      setShowFemaleModal(true);
      setSubmitError("At least 1 Female member is mandatory in the 6-member team as per SIH 2026 guidelines.");
      return;
    }
    const rosterErrors = validateTeamRoster(form.members, settings.minMembers, settings.maxMembers);
    if (Object.keys(rosterErrors).length) {
      setMemberErrors(rosterErrors);
      setSubmitError(rosterErrors.roster);
      return;
    }
    setSaving(true);
    setSubmitError("");
    try {
      const result = await createTeamRegistration(form);
      saveTeamSession(result.teamId, result.registrationId);
      navigate(`/payment/${result.teamId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not create the team.";
      setSubmitError(msg);
      
      const lower = msg.toLowerCase();
      if (lower.includes("team name")) {
        setErrors((prev) => ({ ...prev, teamName: msg }));
        setStep(0);
      } else if (lower.includes("leader email")) {
        setErrors((prev) => ({ ...prev, email: msg }));
        setStep(0);
      } else if (lower.includes("email")) {
        setStep(1);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-24 sm:py-28">
      {/* Header Banner */}
      <div className="text-center md:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-web bg-gold/30 px-3 py-1 text-xs font-black tracking-widest text-web">
          <ShieldCheck size={14} /> OFFICIAL SIH 2026 TEAM REGISTRATION
        </div>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl text-web comic-pop">
          Register Your 6-Member Team
        </h1>
        <p className="mt-3 text-ink/75 max-w-2xl text-sm sm:text-base leading-relaxed">
          Quick & streamlined registration. Only the <strong>Team Leader&apos;s contact number & email</strong> are required. No student ID or complex forms needed!
        </p>
      </div>

      {/* Progress Steps */}
      <ol className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 text-center text-xs font-black uppercase tracking-wider">
        {steps.map((label, index) => {
          const isActive = index === step;
          const isDone = index < step;
          return (
            <li
              key={label}
              className={`rounded-lg p-3 sm:p-4 border-2 border-web transition flex items-center justify-center gap-2 ${
                isActive
                  ? "bg-spidey text-white shadow-[3px_3px_0_#071433]"
                  : isDone
                  ? "bg-gold/40 text-web shadow-[2px_2px_0_#071433]"
                  : "bg-white text-ink/50"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/15 text-[11px]">
                {isDone ? "✓" : index + 1}
              </span>
              <span className="truncate">{label}</span>
            </li>
          );
        })}
      </ol>

      {/* STEP 0: Team Profile & Team Leader Contact Details */}
      {step === 0 ? (
        <div className="mt-8 space-y-6">
          {/* Team Profile */}
          <div className="surface-card p-6 border-2 border-web">
            <h2 className="font-display text-2xl text-web flex items-center gap-2">
              <Users className="text-spidey" size={24} /> 1. Team Profile
            </h2>
            <div className="mt-5">
              <Field label="Team Name" error={errors.teamName}>
                <TextInput
                  placeholder="e.g. Byte Busters"
                  value={form.teamName}
                  onChange={(e) => {
                    setForm({ ...form, teamName: e.target.value });
                    if (errors.teamName) setErrors((prev) => ({ ...prev, teamName: "" }));
                  }}
                />
              </Field>
            </div>
          </div>

          {/* Stream & Leader Details */}
          <div className="surface-card p-6 border-2 border-web bg-cream/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl text-web flex items-center gap-2">
                <Crown className="text-gold" size={24} /> 2. Team Stream & Leader Details
              </h2>
              <span className="rounded bg-spidey/10 px-2.5 py-1 text-xs font-bold text-spidey border border-spidey/30">
                Leader is Primary WhatsApp Contact
              </span>
            </div>

            {/* Stream Rule Callout */}
            <div className="mt-4 rounded-xl border-2 border-web bg-gold/20 p-4 flex items-start gap-3">
              <GraduationCap className="text-web shrink-0 mt-0.5" size={22} />
              <div className="text-xs text-ink/80 leading-relaxed">
                <strong className="text-web block text-sm">Same Stream Rule:</strong>
                All 6 members in your team must belong to the same degree/stream (e.g. B.Tech with B.Tech, Diploma with Diploma). Students from different years of the same stream can team up together!
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Leader Full Name" error={errors.leaderName}>
                <TextInput
                  placeholder="e.g. Rahul Sharma"
                  value={form.leaderName}
                  onChange={(e) => setForm({ ...form, leaderName: e.target.value })}
                />
              </Field>

              <Field label="Leader WhatsApp / Mobile" error={errors.phone}>
                <TextInput
                  type="tel"
                  placeholder="10-digit Indian mobile number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                />
              </Field>

              <Field label="Leader Email Address" error={errors.email}>
                <TextInput
                  type="email"
                  placeholder="leader@college.edu"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                />
              </Field>

              <Field label="Leader Gender" error={errors.leaderGender}>
                <SelectInput
                  value={form.leaderGender}
                  onChange={(e) => setForm({ ...form, leaderGender: e.target.value })}
                >
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </SelectInput>
              </Field>

              <Field label="Leader Branch / Department" error={errors.leaderBranch}>
                <input
                  list="branch-suggestions"
                  placeholder="e.g. CSE / IT / Mechanical"
                  value={form.leaderBranch}
                  onChange={(e) => setForm({ ...form, leaderBranch: e.target.value })}
                  className="w-full rounded-md border-2 border-web bg-white px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink/40 focus:border-spidey focus:outline-none"
                />
                <datalist id="branch-suggestions">
                  {BRANCHES.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </Field>

              <Field label="Team Degree / Stream" error={errors.leaderCourse}>
                <SelectInput
                  value={form.leaderCourse}
                  onChange={(e) => handleStreamChange(e.target.value)}
                >
                  {Object.values(STREAMS_CONFIG).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label} ({st.durationYears} Years)
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label={`Leader Year (for ${form.leaderCourse})`} error={errors.leaderYear}>
                <SelectInput
                  value={form.leaderYear}
                  onChange={(e) => setForm({ ...form, leaderYear: e.target.value })}
                >
                  <option value="">Select year</option>
                  {streamConfig.years.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="lg" onClick={nextFromTeam} className="w-full sm:w-auto">
              Continue to 5 Team Members →
            </Button>
          </div>
        </div>
      ) : null}

      {/* STEP 1: Add 5 Team Members */}
      {step === 1 ? (
        <div className="mt-8 space-y-6">
          {/* Status Tracker Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="surface-card p-4 border-2 border-web flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-ink/60 font-bold">Team Strength</p>
                <p className="font-display text-2xl text-web">
                  {totalMembers} / {settings.maxMembers} Members
                </p>
              </div>
              <div className="text-right">
                {totalMembers === settings.maxMembers ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-bold border border-emerald-300">
                    <CheckCircle2 size={13} /> Full (6)
                  </span>
                ) : (
                  <span className="text-xs text-spidey font-bold">
                    Need {settings.maxMembers - totalMembers} more
                  </span>
                )}
              </div>
            </div>

            <div className="surface-card p-4 border-2 border-web flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-ink/60 font-bold">Team Stream</p>
                <p className="font-display text-xl text-web">
                  {form.leaderCourse}
                </p>
              </div>
              <span className="rounded bg-gold/40 border border-web px-2 py-0.5 text-xs font-black text-web">
                {streamConfig.durationYears} Years
              </span>
            </div>

            <div className="surface-card p-4 border-2 border-web flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-ink/60 font-bold">Female Rule</p>
                <p className="font-display text-2xl text-web">
                  {femaleCount} Female{femaleCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div>
                {isFemaleSatisfied ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-bold border border-emerald-300">
                    <CheckCircle2 size={13} /> Satisfied
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-1 text-xs font-bold border border-rose-300">
                    <AlertCircle size={13} /> 1 Required
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Member Input Card */}
          {form.members.length >= settings.maxMembers && !form.members.some((m) => m.id === editing.id && m.id !== leaderAsMember.id) ? (
            <div className="surface-card p-5 border-2 border-emerald-600 bg-emerald-50 text-emerald-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-700 shrink-0" size={24} />
                <div>
                  <strong className="block text-sm font-bold">Team Roster Full (6 / 6 Members Added)</strong>
                  <span className="text-xs opacity-90">
                    Additional members cannot be added. Click the pencil icon on any member below if you need to edit their details.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="surface-card p-6 border-2 border-web bg-white">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <h2 className="font-display text-xl text-web flex items-center gap-2">
                  <Plus className="text-spidey" size={20} />
                  {form.members.some((m) => m.id === editing.id) ? "Edit Team Member" : `Add Member (${totalMembers + 1} of 6)`}
                </h2>
                <span className="text-xs text-ink/60 font-bold">
                  Stream: <span className="text-spidey">{form.leaderCourse}</span>
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Member Full Name" error={memberErrors.name}>
                  <TextInput
                    placeholder="e.g. Priya Patil"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </Field>

                <Field label="Gender" error={memberErrors.gender}>
                  <SelectInput
                    value={editing.gender}
                    onChange={(e) => setEditing({ ...editing, gender: e.target.value })}
                  >
                    <option value="">Select gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </SelectInput>
                </Field>

                <Field label="Branch / Department" error={memberErrors.branch}>
                  <input
                    list="member-branch-suggestions"
                    placeholder="e.g. CSE / IT / Mechanical"
                    value={editing.branch || ""}
                    onChange={(e) => setEditing({ ...editing, branch: e.target.value })}
                    className="w-full rounded-md border-2 border-web bg-white px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink/40 focus:border-spidey focus:outline-none"
                  />
                  <datalist id="member-branch-suggestions">
                    {BRANCHES.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </Field>

                <Field label={`Year (for ${form.leaderCourse})`} error={memberErrors.year}>
                  <SelectInput
                    value={editing.year || streamConfig.years[0]}
                    onChange={(e) => setEditing({ ...editing, year: e.target.value })}
                  >
                    <option value="">Select study year</option>
                    {streamConfig.years.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>

              {memberErrors.roster ? (
                <p className="mt-3 text-sm text-spidey font-bold">{memberErrors.roster}</p>
              ) : null}

              <div className="mt-5 flex gap-3">
                <Button variant="secondary" onClick={addOrUpdateMember} className="w-full sm:w-auto">
                  <Plus size={16} /> {form.members.some((m) => m.id === editing.id) ? "Save Member Details" : "Add Member to Roster"}
                </Button>
                {editing.name ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditing(emptyMember({ college: form.college, course: form.leaderCourse, branch: form.leaderBranch, year: form.leaderYear }));
                      setMemberErrors({});
                    }}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>
          )}

          {/* Team Roster Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-xl text-web">Registered Team Roster ({form.members.length} / 6)</h3>
              {yearSummary ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-cream border border-web/30 text-ink/75">
                  {yearSummary.label}
                </span>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {form.members.map((member, index) => {
                const isLeader = index === 0 || member.id === "leader-member-id" || member.email === form.email;
                return (
                  <div
                    key={member.id || member.name + index}
                    className={`surface-card p-4 border-2 transition ${
                      isLeader ? "border-gold bg-gold/10" : "border-web bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-lg text-web">{member.name}</span>
                          {isLeader ? (
                            <span className="inline-flex items-center gap-1 rounded bg-gold px-2 py-0.5 text-[11px] font-black text-web border border-web">
                              <Crown size={12} /> LEADER
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-ink/50">#{index + 1}</span>
                          )}
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                          <span className={`px-2 py-0.5 rounded font-bold ${member.gender === "Female" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                            {member.gender || "Gender not set"}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-200">
                            {member.course || form.leaderCourse}
                          </span>
                          {member.year ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
                              {member.year}
                            </span>
                          ) : null}
                          {member.branch ? (
                            <span className="text-ink/75 font-medium">
                              • {member.branch}
                            </span>
                          ) : null}
                        </div>

                        {isLeader ? (
                          <div className="mt-2 text-xs text-ink/65 flex flex-col gap-0.5">
                            <span className="flex items-center gap-1"><Phone size={12} /> {form.phone}</span>
                            <span className="flex items-center gap-1"><Mail size={12} /> {form.email}</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Edit member"
                          onClick={() => handleEditMember(member)}
                          className="rounded p-1.5 text-ink/60 hover:bg-black/5 transition"
                        >
                          <Pencil size={15} />
                        </button>
                        {!isLeader ? (
                          <button
                            type="button"
                            aria-label="Remove member"
                            onClick={() => handleRemoveMember(member.id)}
                            className="rounded p-1.5 text-rose hover:bg-rose-50 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <Button variant="secondary" onClick={() => setStep(0)}>
              ← Back to Team Info
            </Button>
            <Button
              size="lg"
              onClick={proceedToReview}
            >
              Review Team & Proceed →
            </Button>
          </div>
        </div>
      ) : null}

      {/* STEP 2: Review & Final Confirmation */}
      {step === 2 ? (
        <div className="mt-8 space-y-6">
          <div className="surface-card p-6 border-2 border-web bg-white shadow-[4px_4px_0_#071433]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-4">
              <div>
                <span className="text-xs font-black tracking-widest text-spidey uppercase">CONFIRM TEAM DETAILS</span>
                <h2 className="font-display text-3xl sm:text-4xl text-web">{form.teamName}</h2>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-gold/40 border border-web px-2.5 py-0.5 text-xs font-black text-web">
                    <GraduationCap size={13} /> {form.leaderCourse} Stream ({streamConfig.durationYears} Years)
                  </span>
                  {yearSummary ? (
                    <span className="inline-flex items-center gap-1 rounded bg-spidey/10 border border-spidey/30 px-2.5 py-0.5 text-xs font-bold text-spidey">
                      <Layers size={13} /> {yearSummary.label}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="rounded-md border-2 border-web bg-gold px-3 py-1 font-display text-lg text-web">
                {formatINR(settings.fee, settings.currency)} / Team
              </div>
            </div>

            <div className="mt-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-ink/50 font-bold">Team Leader (Primary Contact)</p>
                <p className="font-medium text-ink mt-0.5">{form.leaderName} ({form.leaderGender})</p>
                <p className="text-xs text-ink/65 flex items-center gap-1 mt-0.5">
                  <Phone size={12} className="text-emerald-600" /> {form.phone} • <Mail size={12} /> {form.email}
                </p>
                <p className="text-xs text-ink/60 mt-0.5">
                  {form.leaderBranch} • {form.leaderYear}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-display text-xl text-web mb-3">Complete 6-Member Roster</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {form.members.map((member, idx) => (
                <div key={member.id || idx} className="surface-card p-3.5 border-2 border-web text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink truncate">{member.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      member.gender === "Female" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {member.gender}
                    </span>
                  </div>
                  <div className="text-xs text-ink/70 mt-1.5 space-y-0.5">
                    <p className="font-medium text-spidey">{idx === 0 ? "★ Team Leader" : `Member #${idx + 1}`}</p>
                    <p className="truncate">{member.branch || "General"}</p>
                    <p className="font-semibold text-web">{member.course || form.leaderCourse} · {member.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {submitError ? (
            <div className="rounded-lg border-2 border-rose bg-rose-50 p-4 text-sm text-rose font-medium">
              {submitError}
            </div>
          ) : null}

          <div className="surface-card p-5 border-2 border-web bg-cream flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
                ✓
              </div>
              <p className="text-xs sm:text-sm text-ink/80">
                Next step: Scan QR code to submit ₹300 registration fee and <strong>join the Official WhatsApp Group</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} disabled={saving}>
              ← Back to Members
            </Button>
            <Button size="lg" onClick={submitTeam} disabled={saving} className="w-full sm:w-auto">
              {saving ? "Creating Team Registration..." : "Confirm & Proceed to Payment →"}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Footer Info Notice */}
      <div className="mt-12 surface-card p-4 border-2 border-web text-xs text-ink/75 flex items-center justify-between">
        <span>Smart India Hackathon 2026 · GTMC Nanded Chapter</span>
        <span>Organized by Student Technical Council</span>
      </div>

      {/* ALL-MALE TEAM WARNING POPUP MODAL */}
      {showFemaleModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border-4 border-rose-600 bg-white p-6 sm:p-8 shadow-2xl transition-all scale-100">
            <div className="flex items-center gap-3 border-b-2 border-rose-100 pb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 font-black text-2xl">
                🚫
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-rose-600">SIH 2026 MANDATORY RULE</span>
                <h3 className="font-display text-2xl text-web leading-tight">All-Male Teams Not Allowed!</h3>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm text-ink/80 leading-relaxed">
              <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-4">
                <p className="font-bold text-rose-900 text-base flex items-center gap-2">
                  <AlertCircle className="text-rose-600 shrink-0" size={20} />
                  Female Member Mandatory in Every Team
                </p>
                <p className="mt-2 text-xs sm:text-sm text-rose-800">
                  As per official <strong>Smart India Hackathon (SIH 2026)</strong> regulations:
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-xs sm:text-sm font-semibold text-rose-900">
                  <li>Every 6-member team <strong>MUST include at least 1 Female Member</strong>.</li>
                  <li>All-male (6 Male) teams <strong>cannot</strong> be registered or approved.</li>
                </ul>
              </div>

              <p className="text-xs text-ink/70">
                Your current team roster has <strong>0 Female members ({femaleCount} Females, {form.members.length - femaleCount} Males)</strong>.
                Please change at least one member&apos;s gender to <strong>Female</strong> to proceed with registration.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-ink/10">
              <Button
                size="lg"
                onClick={() => {
                  setShowFemaleModal(false);
                  setStep(1);
                  scrollToFormTop();
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                ✏️ Got it! I&apos;ll Add a Female Member
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


