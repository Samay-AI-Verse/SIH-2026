import { useState, useEffect, useMemo } from "react";
import {
  Award,
  Mail,
  Send,
  Download,
  Settings,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Users,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileCheck,
  Building,
  Check,
  ShieldCheck,
  Sparkles,
  Play,
  Pause
} from "lucide-react";
import {
  adminFetchTeams,
  adminFetchCertConfig,
  adminSaveCertConfig,
  adminTestSmtp,
  adminSendTeamCertificates,
  getMemberCertificateDownloadUrl,
  getCertificateSamplePreviewUrl
} from "../services/apiService";

export function AdminCertificates() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  // Certificate Config State
  const [config, setConfig] = useState({
    cert_event_title: "Smart India Hackathon 2026 (Internal Hackathon)",
    cert_issue_date: "March 2026",
    cert_sign_1_name: "SIH SPOC / Coordinator",
    cert_sign_1_title: "Convener, Innovation Cell",
    cert_sign_2_name: "Principal / Director",
    cert_sign_2_title: "Head of Institution",
    smtp_host: "smtp.gmail.com",
    smtp_port: 587,
    smtp_user: "",
    smtp_pass: "",
    smtp_from_name: "SIH Organizing Committee",
    is_smtp_configured: false
  });

  const [savingConfig, setSavingConfig] = useState(false);
  const [smtpTestStatus, setSmtpTestStatus] = useState(null); // { success: bool, message: str }
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Sending status tracker per team
  // teamId -> { status: 'idle' | 'sending' | 'sent' | 'failed', message: string }
  const [sendStatuses, setSendStatuses] = useState({});
  const [bulkDispatchActive, setBulkDispatchActive] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentTeam: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamsData, configData] = await Promise.all([
        adminFetchTeams(),
        adminFetchCertConfig()
      ]);
      setTeams(teamsData || []);
      if (configData) {
        setConfig((prev) => ({ ...prev, ...configData }));
      }
    } catch (err) {
      console.error("Error loading certificate hub data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        t.name?.toLowerCase().includes(q) ||
        t.registrationId?.toLowerCase().includes(q) ||
        t.leaderName?.toLowerCase().includes(q) ||
        t.leaderEmail?.toLowerCase().includes(q) ||
        t.college?.toLowerCase().includes(q)
      );
    });
  }, [teams, search]);

  // Handle saving certificate and SMTP settings
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await adminSaveCertConfig(config);
      setShowConfigModal(false);
      await loadData();
      alert("Certificate & SMTP settings saved successfully!");
    } catch (err) {
      alert("Error saving settings: " + (err.message || "Failed"));
    } finally {
      setSavingConfig(false);
    }
  };

  // Test SMTP
  const handleTestSmtp = async () => {
    if (!config.smtp_user) {
      alert("Please enter your SMTP Username / Gmail address first.");
      return;
    }
    setTestingSmtp(true);
    setSmtpTestStatus(null);
    try {
      const res = await adminTestSmtp({
        smtp_host: config.smtp_host,
        smtp_port: config.smtp_port,
        smtp_user: config.smtp_user,
        smtp_pass: config.smtp_pass,
        test_email: config.smtp_user
      });
      setSmtpTestStatus({ success: true, message: res.message || "Email connection successful!" });
    } catch (err) {
      setSmtpTestStatus({
        success: false,
        message: err.message || "Failed to connect to SMTP server. Check credentials."
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  // Send single team certificate package to leader
  const handleSendSingleTeam = async (team) => {
    if (!config.is_smtp_configured && !config.smtp_user) {
      setShowConfigModal(true);
      alert("Please configure your Gmail / SMTP details before sending certificates.");
      return;
    }

    const conf = window.confirm(
      `Send all member certificates for "${team.name}" to Leader email:\n${team.leaderEmail}?`
    );
    if (!conf) return;

    setSendStatuses((prev) => ({
      ...prev,
      [team.id]: { status: "sending", message: "Generating & dispatching..." }
    }));

    try {
      const res = await adminSendTeamCertificates(team.id);
      setSendStatuses((prev) => ({
        ...prev,
        [team.id]: { status: "sent", message: `Delivered! (${res.certificates_count} certs)` }
      }));
    } catch (err) {
      setSendStatuses((prev) => ({
        ...prev,
        [team.id]: { status: "failed", message: err.message || "Failed to send" }
      }));
    }
  };

  // Bulk Dispatch all filtered teams with safe rate-limiting delay
  const handleBulkDispatch = async () => {
    if (!config.is_smtp_configured && !config.smtp_user) {
      setShowConfigModal(true);
      alert("Please configure your Gmail / SMTP credentials first.");
      return;
    }

    const eligibleTeams = filteredTeams.filter((t) => {
      const s = sendStatuses[t.id]?.status;
      return s !== "sent";
    });

    if (eligibleTeams.length === 0) {
      alert("All selected teams have already received their certificates!");
      return;
    }

    const conf = window.confirm(
      `BULK CERTIFICATE DISPATCH:\n\nYou are about to send certificates to ${eligibleTeams.length} teams.\nEach team leader will receive their complete 6-member PDF certificate package.\n\nA safe delay of 2.5 seconds will be kept between emails to prevent SMTP blocking.\n\nDo you want to proceed?`
    );
    if (!conf) return;

    setBulkDispatchActive(true);
    let count = 0;

    for (const team of eligibleTeams) {
      count++;
      setBulkProgress({
        current: count,
        total: eligibleTeams.length,
        currentTeam: team.name
      });

      setSendStatuses((prev) => ({
        ...prev,
        [team.id]: { status: "sending", message: "Generating & dispatching..." }
      }));

      try {
        const res = await adminSendTeamCertificates(team.id);
        setSendStatuses((prev) => ({
          ...prev,
          [team.id]: { status: "sent", message: `Delivered (${res.certificates_count} certs)` }
        }));
      } catch (err) {
        setSendStatuses((prev) => ({
          ...prev,
          [team.id]: { status: "failed", message: err.message || "Failed" }
        }));
      }

      // Safe delay between sends: 2500ms
      await new Promise((r) => setTimeout(r, 2500));
    }

    setBulkDispatchActive(false);
    alert(`Bulk dispatch complete! Processed ${count} teams.`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/30 text-xs font-bold uppercase tracking-wider">
              <Award size={14} /> Smart India Hackathon 2026 Certificate Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Official Certificates & Email Dispatch
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Auto-generate high-res landscape merit/participation PDF certificates for all 6 team members
              and send them directly to the Team Leader’s registered email in a single clean email package.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 transition shadow-sm backdrop-blur-sm"
            >
              <Sliders size={16} className="text-gold" />
              Configure Template & SMTP
            </button>

            <a
              href={getCertificateSamplePreviewUrl(
                "Student Participant",
                "Sample Team",
                "Engineering College",
                "Leader"
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-md"
            >
              <Eye size={16} />
              Live Sample Preview
            </a>

            <button
              onClick={handleBulkDispatch}
              disabled={bulkDispatchActive || loading || filteredTeams.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg disabled:opacity-50"
            >
              <Send size={16} />
              {bulkDispatchActive ? "Dispatching Batch..." : `Send to All (${filteredTeams.length} Teams)`}
            </button>
          </div>
        </div>

        {/* Bulk Dispatch Progress Bar */}
        {bulkDispatchActive && (
          <div className="mt-6 pt-6 border-t border-white/10 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-2">
              <span>
                Sending Email {bulkProgress.current} of {bulkProgress.total}:{" "}
                <strong className="text-gold">{bulkProgress.currentTeam}</strong>
              </span>
              <span>
                {Math.round((bulkProgress.current / bulkProgress.total) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/15">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-500 h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${(bulkProgress.current / bulkProgress.total) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Building size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Teams</p>
            <p className="text-2xl font-black text-slate-800">{teams.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Student Certs</p>
            <p className="text-2xl font-black text-slate-800">
              {teams.reduce((acc, t) => acc + (t.members?.length || 6), 0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Mail size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMTP Sender Status</p>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {config.smtp_user ? (
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 size={14} /> Ready ({config.smtp_user.split("@")[0]})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600">
                  <AlertTriangle size={14} /> Not Configured
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sent Packages</p>
            <p className="text-2xl font-black text-slate-800">
              {Object.values(sendStatuses).filter((s) => s.status === "sent").length}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Team Name, Leader Email, ID, College..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-slate-500">
            Showing {filteredTeams.length} of {teams.length} teams
          </span>
          <button
            onClick={loadData}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            title="Refresh Teams"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Teams & Certificates List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw size={32} className="animate-spin mx-auto text-blue-600 mb-3" />
            <p className="font-semibold text-sm">Loading team rosters & certificate statuses...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileCheck size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">No teams matched your query.</p>
            <p className="text-xs text-slate-400 mt-1">Try searching with a different team name or clear search filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredTeams.map((team) => {
              const isExpanded = expandedTeamId === team.id;
              const sendState = sendStatuses[team.id];
              const members = team.members || [];

              return (
                <div key={team.id} className="transition hover:bg-slate-50/50">
                  {/* Team Header Row */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-blue-900 border border-slate-200 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                        {team.name ? team.name.charAt(0).toUpperCase() : "T"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900 text-base">{team.name}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                            {team.registrationId || "ID-PENDING"}
                          </span>
                          {sendState?.status === "sent" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                              <CheckCircle2 size={12} /> Email Dispatched
                            </span>
                          )}
                          {sendState?.status === "failed" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                              <XCircle size={12} /> Failed
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                          <span>
                            Leader: <strong className="text-slate-800">{team.leaderName}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Mail: <span className="font-mono text-blue-700">{team.leaderEmail}</span>
                          </span>
                          <span>•</span>
                          <span>{team.college || "GTMC College"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions on Team */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                      >
                        <Users size={14} />
                        {members.length} Members
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      <button
                        onClick={() => handleSendSingleTeam(team)}
                        disabled={sendState?.status === "sending" || bulkDispatchActive}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition disabled:opacity-50"
                      >
                        <Mail size={14} />
                        {sendState?.status === "sending" ? "Sending..." : "Send to Leader"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Members Drawer */}
                  {isExpanded && (
                    <div className="bg-slate-50/80 px-4 sm:px-6 py-4 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Team Members (Individual Certificates):
                        </p>
                        <span className="text-xs text-slate-400">
                          Click download to generate instant PDF
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {members.map((m, idx) => (
                          <div
                            key={m.id || idx}
                            className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-sm text-slate-900 truncate">
                                  {m.full_name || m.name}
                                </p>
                                {m.is_leader && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-black text-[10px] uppercase">
                                    Leader
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">
                                {m.college || team.college}
                              </p>
                            </div>

                            <a
                              href={getMemberCertificateDownloadUrl(m.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition shrink-0"
                              title={`Download ${m.full_name}'s Certificate`}
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Configuration & SMTP Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <Sliders size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Certificate & SMTP Settings</h2>
                  <p className="text-xs text-slate-500">Configure certificate text, authority signers, and Gmail SMTP</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-6">
              {/* Section 1: Certificate Text Customization */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Award size={16} /> Certificate Text & Authority
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Heading / Sub-header
                    </label>
                    <input
                      type="text"
                      value={config.cert_event_title}
                      onChange={(e) => setConfig({ ...config, cert_event_title: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600/30"
                      placeholder="e.g. Smart India Hackathon 2026 (Internal Hackathon)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Issue Date</label>
                    <input
                      type="text"
                      value={config.cert_issue_date}
                      onChange={(e) => setConfig({ ...config, cert_issue_date: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600/30"
                      placeholder="e.g. March 2026"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Signatory 1 Name (Left)
                      </label>
                      <input
                        type="text"
                        value={config.cert_sign_1_name}
                        onChange={(e) => setConfig({ ...config, cert_sign_1_name: e.target.value })}
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                        placeholder="e.g. Dr. Rajesh K."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Signatory 1 Title
                      </label>
                      <input
                        type="text"
                        value={config.cert_sign_1_title}
                        onChange={(e) => setConfig({ ...config, cert_sign_1_title: e.target.value })}
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                        placeholder="e.g. SIH SPOC / Coordinator"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Signatory 2 Name (Right)
                      </label>
                      <input
                        type="text"
                        value={config.cert_sign_2_name}
                        onChange={(e) => setConfig({ ...config, cert_sign_2_name: e.target.value })}
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                        placeholder="e.g. Prof. M. Sharma"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Signatory 2 Title
                      </label>
                      <input
                        type="text"
                        value={config.cert_sign_2_title}
                        onChange={(e) => setConfig({ ...config, cert_sign_2_title: e.target.value })}
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                        placeholder="e.g. Principal / Director"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* Section 2: Gmail SMTP Server Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Mail size={16} /> Gmail / SMTP Email Dispatch Configuration
                  </h3>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Use Google App Password
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p>
                    💡 <strong>Tip for Gmail:</strong> Go to your Google Account → Security → 2-Step Verification → <strong>App passwords</strong>. Generate an App Password (16 letters) and paste it below.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={config.smtp_host}
                      onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Port</label>
                    <input
                      type="number"
                      value={config.smtp_port}
                      onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) || 587 })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="587"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={config.smtp_from_name}
                    onChange={(e) => setConfig({ ...config, smtp_from_name: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="SIH 2026 Organizing Committee"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sender Gmail / Email ID
                    </label>
                    <input
                      type="email"
                      value={config.smtp_user}
                      onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="sih2026@college.edu or gmail"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Google App Password (16-chars)
                    </label>
                    <input
                      type="password"
                      value={config.smtp_pass}
                      onChange={(e) => setConfig({ ...config, smtp_pass: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="abcd efgh ijkl mnop"
                    />
                  </div>
                </div>

                {/* Test Connection Button */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={testingSmtp || !config.smtp_user}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition disabled:opacity-50"
                  >
                    <Sparkles size={14} className="text-amber-600" />
                    {testingSmtp ? "Testing SMTP..." : "Test SMTP Connection"}
                  </button>

                  {smtpTestStatus && (
                    <span
                      className={`text-xs font-bold ${
                        smtpTestStatus.success ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {smtpTestStatus.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {savingConfig ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
