import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  ShieldCheck, 
  Crown, 
  Users, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  CreditCard, 
  Sparkles, 
  ArrowRight, 
  Printer, 
  Mail,
  Phone,
  Building,
  GraduationCap,
  Copy,
  Check,
  Edit3,
  X,
  Save,
  User
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/Field";
import { PageLoader } from "../components/ui/Skeleton";
import { Modal } from "../components/ui/Modal";
import { WhatsAppCard } from "../components/WhatsAppCard";
import { api } from "../lib/api";
import { formatINR } from "../utils/cn";
import { getTeamSession } from "../lib/session";
import { updateTeamMember, fetchTeamBundle } from "../services/apiService";

export function TeamDashboard() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialTeam = searchParams.get("team") || searchParams.get("teamName") || "";
  const initialRegId = searchParams.get("regId") || searchParams.get("registrationId") || "";

  const [email, setEmail] = useState(initialEmail);
  const [teamName, setTeamName] = useState(initialTeam);
  const [regId, setRegId] = useState(initialRegId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [data, setData] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "Male",
    branch: "",
    year: "3rd Year"
  });
  const [savingMember, setSavingMember] = useState(false);
  const [memberMessage, setMemberMessage] = useState("");

  async function handleLookup(e) {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered Leader Email.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api("/api/dashboard/lookup", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          team_name: teamName.trim() || undefined,
          registration_id: regId.trim() || undefined,
        }),
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration not found with provided details.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function copyRegId(id) {
    if (id && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  }

  // Auto-fetch if teamId is in session or query params
  useEffect(() => {
    const sessionTeamId = getTeamSession()?.teamId;
    if (sessionTeamId && !data && !initialEmail) {
      setLoading(true);
      api(`/api/teams/${sessionTeamId}`)
        .then((res) => {
          if (res?.team) {
            setEmail(res.team.leaderEmail || res.team.leader_email || "");
            setTeamName(res.team.teamName || res.team.team_name || "");
            setData({
              team: res.team,
              members: res.members || [],
              payment: {
                transaction_id: res.team.payment_utr,
                status: res.team.payment_status || res.team.paymentStatus,
                amount: 300,
                currency: "INR",
              },
            });
          }
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    } else if (initialEmail) {
      handleLookup();
    }
  }, []);

  return (
    <div className="min-h-screen px-3 sm:px-6 pb-20 pt-24 sm:pt-28 md:pt-32">
      <div className="mx-auto max-w-5xl">
        {/* Title Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-web bg-gold/30 px-3.5 py-1 text-xs font-black tracking-widest text-web">
            <ShieldCheck size={15} /> PARTICIPANT PORTAL
          </div>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl text-web comic-pop">
            Team Status & Dashboard
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm font-bold text-ink/70 px-2">
            Lookup your registration, track payment verification, problem statement allocation, and view your complete team roster.
          </p>
        </div>

        {/* Search / Lookup Box */}
        <div className="mx-auto mt-6 sm:mt-8 max-w-2xl rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-web bg-white p-4 sm:p-7 shadow-comic">
          <form onSubmit={handleLookup} className="space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <Field label="Team Name (Optional)">
                <TextInput
                  placeholder="e.g. TeamSamay"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </Field>
              <Field label="Leader Email *" error={error && !email ? "Email is required" : ""}>
                <TextInput
                  type="email"
                  placeholder="leader@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border-2 border-red-500 bg-red-50 p-3 text-xs font-bold text-red-700">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-1">
              <Button type="submit" variant="primary" loading={loading} className="w-full sm:w-auto py-2.5 sm:py-2">
                <Search size={15} className="mr-2" /> Check Team Status
              </Button>
            </div>
          </form>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="mt-10">
            <PageLoader label="Fetching team records..." />
          </div>
        )}

        {/* Team Details View */}
        {data?.team && !loading && (
          <div className="mt-8 sm:mt-10 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Main Team Info Banner */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-web bg-gradient-to-r from-cream via-white to-gold/20 p-4 sm:p-7 shadow-comic">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => copyRegId(data.team.registration_id || data.team.registrationId)}
                      className="inline-flex items-center gap-1.5 rounded-lg border-2 border-web bg-gold px-2.5 py-1 font-mono text-xs font-black tracking-wider text-web hover:bg-gold-light transition"
                      title="Click to copy Registration ID"
                    >
                      {copiedId ? <Check size={13} /> : <Copy size={13} />}
                      <span>{data.team.registration_id || data.team.registrationId}</span>
                    </button>
                    
                    <span className={`inline-flex items-center gap-1 rounded-full border-2 px-3 py-0.5 sm:py-1 text-xs font-black tracking-wide ${
                      (data.team.payment_status === "SUCCESS" || data.team.paymentStatus === "SUCCESS")
                        ? "border-green-600 bg-green-100 text-green-800"
                        : (data.team.payment_status === "PROCESSING" || data.team.paymentStatus === "PROCESSING")
                        ? "border-amber-600 bg-amber-100 text-amber-800"
                        : "border-red-600 bg-red-100 text-red-800"
                    }`}>
                      {(data.team.payment_status === "SUCCESS" || data.team.paymentStatus === "SUCCESS") ? (
                        <><CheckCircle2 size={13} /> CONFIRMED</>
                      ) : (data.team.payment_status === "PROCESSING" || data.team.paymentStatus === "PROCESSING") ? (
                        <><Clock size={13} /> VERIFICATION IN PROGRESS</>
                      ) : (
                        <><AlertTriangle size={13} /> PAYMENT PENDING</>
                      )}
                    </span>
                  </div>

                  <h2 className="mt-2.5 font-display text-2xl sm:text-3xl md:text-4xl text-web">
                    {data.team.team_name || data.team.teamName}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="border-2 border-web text-xs font-black flex-1 sm:flex-initial"
                  >
                    <Printer size={13} className="mr-1.5" /> Print Pass
                  </Button>
                  {(data.team.payment_status !== "SUCCESS" && data.team.paymentStatus !== "SUCCESS") && (
                    <Link to={`/payment/${data.team.id}`} className="flex-1 sm:flex-initial">
                      <Button variant="primary" size="sm" className="w-full text-xs font-black bg-web text-white">
                        <CreditCard size={13} className="mr-1.5" /> Pay Fee
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Status Grid */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t-2 border-web/10 pt-5">
                <div className="rounded-xl border-2 border-web/20 bg-white p-3.5 sm:p-4">
                  <p className="text-[11px] font-black text-ink/50 uppercase tracking-wider">Team Leader</p>
                  <p className="mt-1 font-display text-base sm:text-lg text-web">{data.team.leader_name || data.team.leaderName}</p>
                  <p className="text-xs text-ink/70 mt-0.5 truncate">{data.team.leader_email || data.team.leaderEmail}</p>
                  <p className="text-xs text-ink/70">{data.team.leader_phone || data.team.leaderPhone}</p>
                </div>

                <div className="rounded-xl border-2 border-web/20 bg-white p-3.5 sm:p-4">
                  <p className="text-[11px] font-black text-ink/50 uppercase tracking-wider">Problem Statement</p>
                  {data.team.is_open_innovation ? (
                    <div>
                      <span className="inline-block mt-1 text-[11px] font-black text-web bg-gold/40 px-2 py-0.5 rounded border border-web">
                        OPEN INNOVATION
                      </span>
                      <p className="mt-1 text-xs font-bold text-ink line-clamp-2">
                        {data.team.open_innovation_title || "Custom Idea Submitted"}
                      </p>
                    </div>
                  ) : data.team.selected_problem_title || data.team.selectedProblemTitle ? (
                    <div>
                      <p className="mt-1 text-xs font-black text-web">
                        {data.team.selected_problem_id || data.team.selectedProblemId}
                      </p>
                      <p className="text-xs text-ink/80 line-clamp-2 mt-0.5">
                        {data.team.selected_problem_title || data.team.selectedProblemTitle}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="mt-1 text-xs font-bold text-amber-700">Not selected yet</p>
                      <Link to="/problems" className="mt-1.5 inline-flex items-center text-xs font-black text-web hover:underline">
                        Choose Problem <ArrowRight size={12} className="ml-1" />
                      </Link>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border-2 border-web/20 bg-white p-3.5 sm:p-4">
                  <p className="text-[11px] font-black text-ink/50 uppercase tracking-wider">Payment & UTR</p>
                  <p className="mt-1 font-display text-base sm:text-lg text-web">
                    {formatINR(data.payment?.amount || 300)}
                  </p>
                  <p className="text-xs font-mono font-bold text-ink/80 mt-0.5 break-all">
                    UTR: {data.payment?.transaction_id || data.team.payment_utr || "Not submitted"}
                  </p>
                  <p className="text-xs font-bold mt-1 text-ink/60">
                    Status: <span className="uppercase text-web font-black">{data.payment?.status || data.team.payment_status}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Problem Statement Detail Box */}
            {data.team.is_open_innovation ? (
              <div className="rounded-2xl border-3 sm:border-4 border-web bg-amber-50/50 p-4 sm:p-6 shadow-comic">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-web" />
                  <h3 className="font-display text-lg sm:text-xl text-web">Open Innovation Project Submission</h3>
                </div>
                <div className="mt-3 bg-white p-3.5 sm:p-4 rounded-xl border-2 border-web">
                  <p className="font-bold text-sm text-web">
                    {data.team.open_innovation_title || "Open Innovation Project"}
                  </p>
                  {data.team.open_innovation_description && (
                    <p className="mt-2 text-xs text-ink/80 whitespace-pre-line">
                      {data.team.open_innovation_description}
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {/* 6-Member Team Roster */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="font-display text-xl sm:text-2xl text-web flex items-center gap-2">
                  <Users size={20} /> Team Members ({data.members?.length || 6})
                </h3>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  ✏️ Roster Editable until registration cutoff
                </span>
              </div>

              {memberMessage && (
                <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center justify-between">
                  <span>{memberMessage}</span>
                  <button onClick={() => setMemberMessage("")} className="text-emerald-800 hover:text-black">✕</button>
                </div>
              )}

              <div className="mt-3 sm:mt-4 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.members?.map((member, index) => (
                  <div
                    key={member.id || index}
                    className={`relative rounded-2xl border-2 sm:border-3 p-4 sm:p-5 shadow-comic transition-all flex flex-col justify-between ${
                      member.is_leader || index === 0
                        ? "border-web bg-gold/15"
                        : "border-web/40 bg-white hover:border-web"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-md bg-web px-2 py-0.5 text-[10px] sm:text-[11px] font-black text-white">
                          {member.is_leader || index === 0 ? (
                            <><Crown size={11} className="text-gold" /> LEADER</>
                          ) : (
                            `MEMBER ${index + 1}`
                          )}
                        </span>
                        <span className="text-xs font-bold text-ink/60">
                          {member.gender}
                        </span>
                      </div>

                      <h4 className="mt-2 font-display text-base sm:text-lg text-web">
                        {member.name || member.full_name}
                      </h4>

                      <div className="mt-2.5 space-y-1 text-xs text-ink/80">
                        {member.email && (
                          <p className="flex items-center gap-1.5 truncate">
                            <Mail size={12} className="shrink-0 text-web/60" /> {member.email}
                          </p>
                        )}
                        {member.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone size={12} className="shrink-0 text-web/60" /> {member.phone}
                          </p>
                        )}
                        {(member.branch || member.year) && (
                          <p className="flex items-center gap-1.5 text-ink font-semibold">
                            <GraduationCap size={12} className="shrink-0 text-web/60" />
                            {[member.branch, member.year].filter(Boolean).join(" • ")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Edit Member Action */}
                    <div className="mt-4 pt-3 border-t border-web/15 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {member.is_leader ? "Primary Contact" : "Roster Member"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMember(member);
                          setEditForm({
                            name: member.name || member.full_name || "",
                            email: member.email || "",
                            phone: member.phone || "",
                            gender: member.gender || "Male",
                            branch: member.branch || "",
                            year: member.year || "3rd Year"
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border-2 border-web/30 bg-white hover:bg-gold/40 px-2.5 py-1 text-xs font-black uppercase text-web transition shadow-xs"
                      >
                        <Edit3 size={12} /> Edit Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Official WhatsApp Group Box */}
            <div className="mt-6 sm:mt-8">
              <WhatsAppCard />
            </div>

            {/* Next Steps / Instructions */}
            <div className="rounded-2xl border-2 sm:border-3 border-web bg-gold/20 p-4 sm:p-6">
              <h4 className="font-display text-base sm:text-lg text-web flex items-center gap-2">
                <CheckCircle2 size={16} /> Important Hackathon Guidelines
              </h4>
              <ul className="mt-2 space-y-1 text-xs font-bold text-ink/80 list-disc list-inside">
                <li>Keep your Registration ID (<span className="font-mono">{data.team.registration_id}</span>) ready during check-in.</li>
                <li>Each Problem Statement is strictly limited to <strong>2 teams</strong> maximum.</li>
                <li>Carry physical student ID cards of all 6 members on the Hackathon day.</li>
                <li>Join the official WhatsApp group for mentor updates and announcements.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* EDIT MEMBER MODAL */}
      {editingMember && (
        <Modal open={Boolean(editingMember)} onClose={() => setEditingMember(null)} labelledBy="edit-member-title">
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 pr-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-spidey bg-gold/30 px-2.5 py-0.5 rounded-md">
                  UPDATE ROSTER MEMBER
                </span>
                <h3 id="edit-member-title" className="font-display text-2xl text-web mt-1">
                  Edit Member Details
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Update details for <strong>{editingMember.name || editingMember.full_name}</strong> ({editingMember.is_leader ? "Team Leader" : "Team Member"}). Changes will be saved directly to your team roster.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingMember(true);
                try {
                  await updateTeamMember(data.team.id, editingMember.id, {
                    full_name: editForm.name.trim(),
                    gender: editForm.gender,
                    branch: editForm.branch.trim(),
                    year: editForm.year.trim()
                  });
                  // Refresh team bundle
                  const refreshed = await fetchTeamBundle(data.team.id);
                  if (refreshed) {
                    setData({ team: refreshed, members: refreshed.members || [] });
                  }
                  setMemberMessage(`✅ Successfully updated details for ${editForm.name.trim()}!`);
                  setEditingMember(null);
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Failed to update member details.");
                } finally {
                  setSavingMember(false);
                }
              }}
              className="space-y-4 pt-1"
            >
              {/* Full Name */}
              <Field label="Full Name *">
                <TextInput
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter full student name"
                  required
                />
              </Field>

              {/* Gender & Study Year (2-column layout) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Gender *">
                  <select
                    className="w-full rounded-xl border-2 border-web/30 bg-white p-3 text-xs sm:text-sm font-bold text-ink focus:border-web focus:outline-none"
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Study Year *">
                  <select
                    className="w-full rounded-xl border-2 border-web/30 bg-white p-3 text-xs sm:text-sm font-bold text-ink focus:border-web focus:outline-none"
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </Field>
              </div>

              {/* Department / Branch (Full Width) */}
              <Field label="Department / Branch">
                <TextInput
                  placeholder="e.g. Computer Science & Engineering (CSE)"
                  value={editForm.branch}
                  onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                />
              </Field>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 py-3 text-xs font-black uppercase"
                  onClick={() => setEditingMember(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingMember}
                  className="flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-wider bg-web text-white hover:bg-spidey transition shadow-comic"
                >
                  {savingMember ? "Saving..." : "Save Member Details ✓"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
