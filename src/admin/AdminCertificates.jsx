import { useState, useEffect, useMemo, useRef } from "react";
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
  Printer,
  Sparkles,
  Edit3,
  Check,
  HelpCircle
} from "lucide-react";
import {
  adminFetchTeams,
  adminFetchCertConfig,
  adminSaveCertConfig,
  adminTestSmtp,
  adminSendTeamCertificates
} from "../services/apiService";

export function AdminCertificates() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0);

  // Certificate Editable Content
  const [certData, setCertData] = useState({
    certType: "PARTICIPATION", // PARTICIPATION / WINNER / FINALIST / APPRECIATION
    eventTitle: "Smart India Hackathon 2026 (Internal Hackathon)",
    subHeader: "MINISTRY OF EDUCATION & AICTE / MIC INITIATIVE",
    studentName: "Rahul Sharma",
    teamName: "CyberKnights",
    collegeName: "Gramin Technical and Management Campus, Nanded",
    role: "Leader", // Leader / Active Member
    issueDate: "September 2026",
    sign1Name: "Dr. SIH SPOC",
    sign1Title: "Convener & SPOC, Innovation Cell",
    sign2Name: "Dr. Principal / Director",
    sign2Title: "Head of Institution",
    description:
      "for exemplary technical innovation, teamwork, and dedicated participation in the 36-hour internal evaluation round of Smart India Hackathon 2026."
  });

  // SMTP Settings
  const [config, setConfig] = useState({
    smtp_host: "smtp.gmail.com",
    smtp_port: 587,
    smtp_user: "",
    smtp_pass: "",
    smtp_from_name: "SIH Organizing Committee",
    is_smtp_configured: false
  });

  const [savingConfig, setSavingConfig] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestStatus, setSmtpTestStatus] = useState(null);

  // Email sending progress
  const [sendStatuses, setSendStatuses] = useState({});
  const [bulkDispatchActive, setBulkDispatchActive] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentTeam: "" });

  const printRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamsData, configData] = await Promise.all([
        adminFetchTeams(),
        adminFetchCertConfig().catch(() => null)
      ]);
      const teamList = teamsData || [];
      setTeams(teamList);

      if (teamList.length > 0 && !selectedTeamId) {
        const first = teamList[0];
        setSelectedTeamId(first.id);
        const members = first.members || [];
        const leader = members.find((m) => m.is_leader) || members[0];
        setCertData((prev) => ({
          ...prev,
          studentName: leader?.full_name || leader?.name || first.leaderName || "Student Name",
          teamName: first.name || first.teamName || "CyberKnights",
          collegeName: first.college || prev.collegeName,
          role: "Leader"
        }));
      }

      if (configData) {
        setConfig((prev) => ({ ...prev, ...configData }));
        if (configData.cert_event_title) {
          setCertData((prev) => ({
            ...prev,
            eventTitle: configData.cert_event_title || prev.eventTitle,
            issueDate: configData.cert_issue_date || prev.issueDate,
            sign1Name: configData.cert_sign_1_name || prev.sign1Name,
            sign1Title: configData.cert_sign_1_title || prev.sign1Title,
            sign2Name: configData.cert_sign_2_name || prev.sign2Name,
            sign2Title: configData.cert_sign_2_title || prev.sign2Title
          }));
        }
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

  // Filtered teams list
  const filteredTeams = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.registrationId?.toLowerCase().includes(q) ||
        t.leaderName?.toLowerCase().includes(q) ||
        t.leaderEmail?.toLowerCase().includes(q) ||
        t.college?.toLowerCase().includes(q)
    );
  }, [teams, search]);

  // Current active team
  const currentTeam = useMemo(() => {
    return teams.find((t) => t.id === selectedTeamId) || teams[0] || null;
  }, [teams, selectedTeamId]);

  // When team selection changes, pick first member
  const handleSelectTeam = (team) => {
    setSelectedTeamId(team.id);
    setSelectedMemberIndex(0);
    const members = team.members || [];
    const member = members[0];
    const isLeader = member ? member.is_leader : true;

    setCertData((prev) => ({
      ...prev,
      teamName: team.name || team.teamName || "Team",
      collegeName: team.college || prev.collegeName,
      studentName: member?.full_name || member?.name || team.leaderName || "Student Name",
      role: isLeader ? "Leader" : "Member"
    }));
  };

  // When clicking a member inside the team
  const handleSelectMember = (member, index) => {
    setSelectedMemberIndex(index);
    setCertData((prev) => ({
      ...prev,
      studentName: member.full_name || member.name || "Student Name",
      collegeName: member.college || currentTeam?.college || prev.collegeName,
      role: member.is_leader ? "Leader" : "Member"
    }));
  };

  // Instant browser print / PDF download
  const handlePrintCertificate = () => {
    window.print();
  };

  // Save config
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await adminSaveCertConfig({
        ...config,
        cert_event_title: certData.eventTitle,
        cert_issue_date: certData.issueDate,
        cert_sign_1_name: certData.sign1Name,
        cert_sign_1_title: certData.sign1Title,
        cert_sign_2_name: certData.sign2Name,
        cert_sign_2_title: certData.sign2Title
      });
      setShowConfigModal(false);
      alert("Settings saved successfully!");
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
        message: err.message || "Failed to connect to SMTP server."
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  // Send single team email
  const handleSendSingleTeam = async (team) => {
    const conf = window.confirm(
      `Send all member certificates for "${team.name}" to Leader email:\n${team.leaderEmail}?`
    );
    if (!conf) return;

    setSendStatuses((prev) => ({
      ...prev,
      [team.id]: { status: "sending", message: "Dispatching..." }
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
  };

  // Bulk dispatch with 2-Step Safety Verification
  const handleBulkDispatch = async () => {
    // STEP 1: Initial Warning & Count
    const step1 = window.confirm(
      `⚠️ STEP 1 of 2: BULK EMAIL DISPATCH INITIATION\n\n` +
      `You are about to trigger official certificate dispatch for ${filteredTeams.length} teams.\n` +
      `Each team's leader will receive an automated email containing PDF certificates for all 6 members.\n\n` +
      `Do you want to proceed to Step 2 Verification?`
    );
    if (!step1) return;

    // STEP 2: Explicit Security Confirmation Phrase
    const confirmationText = window.prompt(
      `🔒 STEP 2 of 2: FINAL CONFIRMATION\n\n` +
      `To prevent accidental mass emails to students, please type "SEND CERTS" (without quotes) below to start dispatch:`
    );

    if (confirmationText?.trim().toUpperCase() !== "SEND CERTS") {
      alert("Dispatch cancelled. The confirmation text did not match 'SEND CERTS'. No emails were sent.");
      return;
    }

    setBulkDispatchActive(true);
    let count = 0;
    for (const team of filteredTeams) {
      count++;
      setBulkProgress({
        current: count,
        total: filteredTeams.length,
        currentTeam: team.name
      });
      try {
        await adminSendTeamCertificates(team.id);
        setSendStatuses((prev) => ({
          ...prev,
          [team.id]: { status: "sent", message: "Delivered" }
        }));
      } catch (err) {
        setSendStatuses((prev) => ({
          ...prev,
          [team.id]: { status: "failed", message: "Failed" }
        }));
      }
      await new Promise((r) => setTimeout(r, 2500));
    }
    setBulkDispatchActive(false);
    alert(`Bulk dispatch complete! Successfully dispatched certificates to ${count} teams.`);
  };


  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-2 sm:p-4 print:p-0 print:m-0">
      {/* Top Banner (Hidden when printing certificate) */}
      <div className="print:hidden relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/30 text-xs font-bold uppercase tracking-wider">
              <Award size={14} /> Official SIH 2026 Certificate & Dispatch Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Interactive Certificate Studio & Team Dispatch
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Live-preview authentic certificates with official collaborative partner logos (MoE, AICTE, MIC, SIH).
              Select any team & member to view, edit text dynamically, download/print directly as A4 Landscape PDF, or dispatch via email.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 transition shadow-sm backdrop-blur-sm"
            >
              <Sliders size={16} className="text-gold" />
              SMTP & Signatures
            </button>

            <button
              onClick={handlePrintCertificate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition shadow-md"
            >
              <Printer size={16} />
              Print / Save A4 PDF
            </button>

            <button
              onClick={handleBulkDispatch}
              disabled={bulkDispatchActive || loading || filteredTeams.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg disabled:opacity-50"
            >
              <Send size={16} />
              {bulkDispatchActive ? "Dispatching..." : `Bulk Send (${filteredTeams.length} Teams)`}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {bulkDispatchActive && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-2">
              <span>
                Sending to Team {bulkProgress.current} of {bulkProgress.total}:{" "}
                <strong className="text-gold">{bulkProgress.currentTeam}</strong>
              </span>
              <span>
                {Math.round((bulkProgress.current / bulkProgress.total) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${(bulkProgress.current / bulkProgress.total) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Studio Grid: Left Explorer + Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        {/* LEFT COLUMN: Team & Member Explorer (Hidden when printing) */}
        <div className="print:hidden lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users size={16} className="text-blue-600" />
                Select Team ({filteredTeams.length})
              </h3>
              <button
                onClick={loadData}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
                title="Refresh"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team, leader or ID..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              />
            </div>

            {/* Team List Scrollbox */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading teams...</div>
              ) : filteredTeams.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No teams found.</div>
              ) : (
                filteredTeams.map((team) => {
                  const isSelected = team.id === selectedTeamId;
                  const sendState = sendStatuses[team.id];

                  return (
                    <div
                      key={team.id}
                      onClick={() => handleSelectTeam(team)}
                      className={`p-3 cursor-pointer transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-blue-50/90 border-l-4 border-blue-600"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`font-black text-xs truncate ${isSelected ? "text-blue-900" : "text-slate-800"}`}>
                          {team.name || team.teamName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {team.leaderName} • {team.leaderEmail}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {sendState?.status === "sent" && (
                          <CheckCircle2 size={14} className="text-emerald-600" title="Email Delivered" />
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                          {(team.members || []).length || 6}p
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Team Members Selector */}
          {currentTeam && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Team Members in "{currentTeam.name}"
                </h3>
                <button
                  onClick={() => handleSendSingleTeam(currentTeam)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition"
                >
                  <Mail size={12} /> Send to Leader
                </button>
              </div>

              <div className="space-y-1.5">
                {(currentTeam.members || []).map((m, idx) => {
                  const isSelected = idx === selectedMemberIndex;
                  return (
                    <button
                      key={m.id || idx}
                      onClick={() => handleSelectMember(m, idx)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition text-xs flex items-center justify-between ${
                        isSelected
                          ? "bg-indigo-600 text-white font-bold shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span className="truncate">
                        {m.full_name || m.name}
                        {m.is_leader && (
                          <span
                            className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
                              isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            Leader
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] opacity-75">Click to Preview</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Quick Editor Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Edit3 size={15} className="text-amber-600" />
              Quick Content Editor
            </h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Student Name</label>
              <input
                type="text"
                value={certData.studentName}
                onChange={(e) => setCertData({ ...certData, studentName: e.target.value })}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Team Name</label>
                <input
                  type="text"
                  value={certData.teamName}
                  onChange={(e) => setCertData({ ...certData, teamName: e.target.value })}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Role</label>
                <select
                  value={certData.role}
                  onChange={(e) => setCertData({ ...certData, role: e.target.value })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Leader">Team Leader</option>
                  <option value="Member">Team Member</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Certificate Type</label>
              <select
                value={certData.certType}
                onChange={(e) => setCertData({ ...certData, certType: e.target.value })}
                className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-blue-900"
              >
                <option value="PARTICIPATION">CERTIFICATE OF PARTICIPATION</option>
                <option value="MERIT & EXCELLENCE">CERTIFICATE OF MERIT & EXCELLENCE</option>
                <option value="WINNER (1ST PLACE)">CERTIFICATE OF WINNER (1ST PLACE)</option>
                <option value="RUNNER UP">CERTIFICATE OF RUNNER UP</option>
                <option value="APPRECIATION">CERTIFICATE OF APPRECIATION</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">College / Institution</label>
              <input
                type="text"
                value={certData.collegeName}
                onChange={(e) => setCertData({ ...certData, collegeName: e.target.value })}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Official Real-Style SIH 2026 Landscape Certificate Preview */}
        <div className="lg:col-span-8 print:w-full print:p-0">
          <div className="bg-slate-200/70 p-3 sm:p-5 rounded-2xl border border-slate-300/80 shadow-inner overflow-x-auto print:p-0 print:bg-transparent print:border-none">
            {/* The Print Container */}
            <div
              ref={printRef}
              className="mx-auto bg-[#fdfbf7] text-slate-900 relative shadow-2xl rounded-sm print:shadow-none print:rounded-none overflow-hidden"
              style={{
                width: "100%",
                maxWidth: "880px",
                aspectRatio: "1.414 / 1", // A4 Landscape ratio
                padding: "24px",
                boxSizing: "border-box"
              }}
            >
              {/* Luxury Triple Border */}
              <div className="w-full h-full border-4 border-[#1e3a8a] relative p-2 box-border flex flex-col justify-between">
                <div className="w-full h-full border-2 border-[#d97706] p-4 relative box-border flex flex-col justify-between">
                  {/* Ornate Corner Rosettes */}
                  <div className="absolute top-1 left-1 w-3 h-3 bg-[#d97706] rounded-full border border-[#1e3a8a]" />
                  <div className="absolute top-1 right-1 w-3 h-3 bg-[#d97706] rounded-full border border-[#1e3a8a]" />
                  <div className="absolute bottom-1 left-1 w-3 h-3 bg-[#d97706] rounded-full border border-[#1e3a8a]" />
                  <div className="absolute bottom-1 right-1 w-3 h-3 bg-[#d97706] rounded-full border border-[#1e3a8a]" />

                  {/* Watermark in background */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none select-none">
                    <img src="/sih-logo.png" alt="Watermark" className="w-80 object-contain" />
                  </div>

                  {/* 1. TOP HEADER: Official Collaborative Partner Badges */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      {/* Left: Ministry / AICTE Logo text badges */}
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-800">
                            MINISTRY OF EDUCATION
                          </p>
                          <p className="text-[8px] font-semibold text-slate-500">GOVT. OF INDIA</p>
                        </div>
                        <span className="text-slate-300 text-xs">|</span>
                        <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-wider text-blue-900">
                            AICTE & MIC
                          </p>
                          <p className="text-[8px] font-semibold text-slate-500">INNOVATION CELL</p>
                        </div>
                      </div>

                      {/* Center: SIH Official Logo */}
                      <div className="flex items-center gap-2">
                        <img src="/sih-logo.png" alt="SIH 2026" className="h-10 sm:h-11 object-contain" />
                      </div>

                      {/* Right: Institution / Host Badge */}
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-800">
                          INTERNAL HACKATHON
                        </p>
                        <p className="text-[8px] font-bold text-amber-700">SIH 2026 EDITION</p>
                      </div>
                    </div>

                    <div className="text-center mt-3">
                      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-[#d97706]">
                        {certData.subHeader}
                      </p>
                      <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-[#1e3a8a] mt-0.5">
                        {certData.eventTitle}
                      </h2>
                    </div>
                  </div>

                  {/* 2. CENTER BODY: Certificate of ... & Student Details */}
                  <div className="relative z-10 text-center my-auto py-2">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif italic font-extrabold text-[#0f172a] tracking-wide">
                      {certData.certType}
                    </h3>
                    <div className="w-44 h-0.5 bg-[#d97706] mx-auto mt-1 mb-2" />

                    <p className="text-xs italic text-slate-500 font-serif">
                      This is proudly presented to
                    </p>

                    {/* Student Full Name */}
                    <div className="my-2">
                      <span className="text-xl sm:text-2xl lg:text-3xl font-sans font-black uppercase text-[#1e3a8a] tracking-wider px-6 py-0.5 border-b-2 border-[#d97706] inline-block">
                        {certData.studentName}
                      </span>
                    </div>

                    {/* Team and College details */}
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-2">
                      of Team <strong className="text-blue-900 font-black">"{certData.teamName}"</strong> as{" "}
                      <span className="text-amber-700 font-bold">{certData.role === "Leader" ? "Team Leader" : "Active Member"}</span>
                    </p>

                    {certData.collegeName && (
                      <p className="text-xs text-slate-600 font-medium italic mt-0.5">
                        representing {certData.collegeName}
                      </p>
                    )}

                    <p className="text-[11px] sm:text-xs text-slate-500 max-w-xl mx-auto mt-2 leading-relaxed">
                      {certData.description}
                    </p>
                  </div>

                  {/* 3. BOTTOM FOOTER: Official Signatures & Seal */}
                  <div className="relative z-10 pt-2 border-t border-slate-200">
                    <div className="grid grid-cols-3 items-end text-center">
                      {/* Left Signatory */}
                      <div className="text-center px-2">
                        <div className="w-32 border-b border-slate-800 mx-auto mb-1" />
                        <p className="text-[11px] font-black text-slate-900">{certData.sign1Name}</p>
                        <p className="text-[9px] text-slate-500 font-medium">{certData.sign1Title}</p>
                      </div>

                      {/* Center Seal */}
                      <div className="text-center">
                        <div className="inline-block p-1 border border-amber-600 rounded-full bg-amber-50/50 mb-1">
                          <span className="text-[9px] font-black text-amber-700 uppercase px-2 py-0.5 block">
                            ★ VERIFIED MERIT RECORD ★
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500">Issued: {certData.issueDate}</p>
                      </div>

                      {/* Right Signatory */}
                      <div className="text-center px-2">
                        <div className="w-32 border-b border-slate-800 mx-auto mb-1" />
                        <p className="text-[11px] font-black text-slate-900">{certData.sign2Name}</p>
                        <p className="text-[9px] text-slate-500 font-medium">{certData.sign2Title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action bar underneath preview */}
          <div className="print:hidden mt-3 flex items-center justify-between text-xs text-slate-500 px-2">
            <span>
              💡 <strong>Instant A4 Landscape PDF:</strong> Click "Print / Save A4 PDF" or press <kbd className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">Ctrl + P</kbd>. Select <em>"Save as PDF"</em> with <em>Landscape</em> orientation.
            </span>
            <button
              onClick={handlePrintCertificate}
              className="text-indigo-700 font-bold hover:underline flex items-center gap-1"
            >
              <Printer size={13} /> Direct Print
            </button>
          </div>
        </div>
      </div>

      {/* Configuration & SMTP Modal (Same as before) */}
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
                  <p className="text-xs text-slate-500">Configure Signatures and Gmail SMTP credentials</p>
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
              {/* Signatures Setup */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Award size={16} /> Signatures & Event Header
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Event Header</label>
                  <input
                    type="text"
                    value={certData.eventTitle}
                    onChange={(e) => setCertData({ ...certData, eventTitle: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Signatory 1 Name (Left)</label>
                    <input
                      type="text"
                      value={certData.sign1Name}
                      onChange={(e) => setCertData({ ...certData, sign1Name: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Signatory 1 Title</label>
                    <input
                      type="text"
                      value={certData.sign1Title}
                      onChange={(e) => setCertData({ ...certData, sign1Title: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Signatory 2 Name (Right)</label>
                    <input
                      type="text"
                      value={certData.sign2Name}
                      onChange={(e) => setCertData({ ...certData, sign2Name: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Signatory 2 Title</label>
                    <input
                      type="text"
                      value={certData.sign2Title}
                      onChange={(e) => setCertData({ ...certData, sign2Title: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* SMTP Settings */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Mail size={16} /> Gmail / SMTP Email Dispatch Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sender Gmail ID</label>
                    <input
                      type="email"
                      value={config.smtp_user}
                      onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="e.g. college.sih2026@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Google App Password</label>
                    <input
                      type="password"
                      value={config.smtp_pass}
                      onChange={(e) => setConfig({ ...config, smtp_pass: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="16 letters code"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={testingSmtp || !config.smtp_user}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition disabled:opacity-50"
                  >
                    <Sparkles size={14} className="text-amber-600" />
                    {testingSmtp ? "Testing..." : "Test SMTP Connection"}
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

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
                >
                  {savingConfig ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
