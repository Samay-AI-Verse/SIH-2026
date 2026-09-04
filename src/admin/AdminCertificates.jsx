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
  HelpCircle,
  FileText,
  User,
  RotateCcw,
  Package,
  CheckCheck,
  ExternalLink,
  FileDown,
  Archive,
  ArrowDownToLine
} from "lucide-react";

import {
  adminFetchTeams,
  adminFetchCertConfig,
  adminSaveCertConfig,
  adminTestSmtp,
  adminSendTeamCertificates,
  adminSendCustomCertificate,
  getCertificateSamplePreviewUrl,
  lookupCertificates,
  getPublicMemberCertificateUrl,
  getPublicTeamCertificateZipUrl,
  getAdminTeamCertificateZipUrl,
  getMemberCertificateDownloadUrl,
  getCustomCertificateDownloadUrl,
  downloadFileFromUrl
} from "../services/apiService";


export function AdminCertificates() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [sendingCustomEmail, setSendingCustomEmail] = useState(false);
  const [customEmailResult, setCustomEmailResult] = useState(null);

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [emailPreviewType, setEmailPreviewType] = useState("single"); // "single" or "team"

  // Team Package Dispatch state
  const [dispatchTab, setDispatchTab] = useState("team"); // "team" (all 6 certs in single mail) | "single" (selected member) | "custom" (any manual student)
  const [editorMode, setEditorMode] = useState("team"); // "team" (synced with selected team) | "custom" (free manual entry)
  const [teamTargetEmail, setTeamTargetEmail] = useState("");
  const [teamCcMembers, setTeamCcMembers] = useState(true);
  const [sendingTeamEmail, setSendingTeamEmail] = useState(false);
  const [teamEmailResult, setTeamEmailResult] = useState(null);


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

  // Direct Participant / Student Certificate Downloader state
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState("");
  const [downloadingZipId, setDownloadingZipId] = useState(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

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
        const leaderEmail = leader?.email || first.leaderEmail || "";
        if (leaderEmail) {
          setCustomEmail(leaderEmail);
          setTeamTargetEmail(leaderEmail);
        }
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

  // Filtered teams list with comprehensive fast search
  const filteredTeams = useMemo(() => {
    const raw = search.trim().toLowerCase();
    if (!raw) return teams;

    // Tokens for multi-word queries ("code craft", "vikram code")
    const tokens = raw.split(/\s+/).filter(Boolean);
    const compactRaw = raw.replace(/\s+/g, "");

    return teams.filter((t) => {
      const teamName = (t.teamName || t.team_name || t.name || "").toLowerCase();
      const compactTeamName = teamName.replace(/\s+/g, "");
      const leaderName = (t.leaderName || t.leader_name || "").toLowerCase();
      const leaderEmail = (t.leaderEmail || t.leader_email || t.email || "").toLowerCase();
      const regId = (t.registrationId || t.registration_id || t.id || "").toLowerCase();
      const college = (t.college || t.university || "").toLowerCase();

      // Check all team members (names and emails)
      const members = t.members || [];
      const memberNames = members.map((m) => (m.full_name || m.name || "").toLowerCase()).join(" ");
      const memberEmails = members.map((m) => (m.email || "").toLowerCase()).join(" ");

      // Direct substring & space-insensitive matching
      if (
        teamName.includes(raw) ||
        compactTeamName.includes(compactRaw) ||
        leaderName.includes(raw) ||
        leaderEmail.includes(raw) ||
        regId.includes(raw) ||
        college.includes(raw) ||
        memberNames.includes(raw) ||
        memberEmails.includes(raw)
      ) {
        return true;
      }

      // Multi-token match across all fields
      const combinedText = `${teamName} ${leaderName} ${leaderEmail} ${regId} ${college} ${memberNames} ${memberEmails}`;
      return tokens.every((token) => combinedText.includes(token));
    });
  }, [teams, search]);

  // Current active team
  const currentTeam = useMemo(() => {
    return teams.find((t) => t.id === selectedTeamId) || teams[0] || null;
  }, [teams, selectedTeamId]);

  // Auto-select first matching team during search if current team is filtered out
  useEffect(() => {
    if (search.trim() && filteredTeams.length > 0) {
      const isCurrentInResults = filteredTeams.some((t) => t.id === selectedTeamId);
      if (!isCurrentInResults) {
        handleSelectTeam(filteredTeams[0]);
      }
    }
  }, [filteredTeams, search, selectedTeamId]);

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

    if (member?.email) {
      setCustomEmail(member.email);
    } else if (team.leaderEmail) {
      setCustomEmail(team.leaderEmail);
    }
    setTeamTargetEmail(team.leaderEmail || team.email || "");
    setTeamEmailResult(null);
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

    if (member.email) {
      setCustomEmail(member.email);
    } else if (member.is_leader && currentTeam?.leaderEmail) {
      setCustomEmail(currentTeam.leaderEmail);
    }
  };

  // Reset editable cert fields back to currently selected member
  const handleResetToSelectedMember = () => {
    if (!currentTeam) return;
    const members = currentTeam.members || [];
    const member = members[selectedMemberIndex] || members[0];
    const isLeader = member ? member.is_leader : true;
    setCertData((prev) => ({
      ...prev,
      studentName: member?.full_name || member?.name || currentTeam.leaderName || "Student Name",
      teamName: currentTeam.name || currentTeam.teamName || "Team",
      collegeName: currentTeam.college || prev.collegeName,
      role: isLeader ? "Leader" : "Member"
    }));
    const email = member?.email || currentTeam.leaderEmail || "";
    setCustomEmail(email);
    setEditorMode("team");
  };

  const handleSwitchToCustomMode = () => {
    setEditorMode("custom");
    setDispatchTab("custom");
  };

  const handleClearCustomFields = () => {
    setEditorMode("custom");
    setDispatchTab("custom");
    setCertData((prev) => ({
      ...prev,
      studentName: "",
      teamName: "Individual Participant",
      collegeName: "",
      role: "Participant",
      certType: "PARTICIPATION"
    }));
    setCustomEmail("");
    setCustomEmailResult(null);
  };

  const handleCopyFromSelectedMember = () => {
    if (!currentTeam) return;
    const members = currentTeam.members || [];
    const member = members[selectedMemberIndex] || members[0];
    const isLeader = member ? member.is_leader : true;
    setCertData((prev) => ({
      ...prev,
      studentName: member?.full_name || member?.name || currentTeam.leaderName || "Student Name",
      teamName: currentTeam.name || currentTeam.teamName || "Team",
      collegeName: currentTeam.college || prev.collegeName,
      role: isLeader ? "Leader" : "Member"
    }));
    const email = member?.email || currentTeam.leaderEmail || "";
    setCustomEmail(email);
    setCustomEmailResult(null);
  };

  // Instant direct vector PDF download & clean print (Zero browser headers/footers/URLs)
  const handlePrintCertificate = () => {
    // 1. Direct Backend Vector PDF Download (100% clean, exact A4, no browser headers, no page numbers)
    const directPdfUrl = getCertificateSamplePreviewUrl(
      certData.studentName,
      certData.teamName,
      certData.collegeName,
      certData.role
    );

    // Create an invisible anchor to trigger immediate vector PDF download
    const link = document.createElement("a");
    link.href = directPdfUrl;
    link.download = `Certificate_${(certData.studentName || "Participant").replace(/\s+/g, "_")}.pdf`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTeamZip = async (teamId, teamName) => {
    setDownloadingZipId(teamId);
    try {
      const url = getAdminTeamCertificateZipUrl(teamId);
      const cleanTeam = (teamName || "Team").replace(/\s+/g, "_");
      await downloadFileFromUrl(url, `Team_Certificates_${cleanTeam}.zip`);
    } catch (err) {
      alert("Download failed: " + (err.message || "Unknown error"));
    } finally {
      setDownloadingZipId(null);
    }
  };

  const handleDownloadMemberPdf = async (memberId, memberName, teamRegId) => {
    setDownloadingPdfId(memberId);
    try {
      const url = getPublicMemberCertificateUrl(memberId, false);
      const cleanName = (memberName || "Student").replace(/\s+/g, "_");
      await downloadFileFromUrl(url, `Certificate_${cleanName}_${teamRegId || "SIH"}.pdf`);
    } catch (err) {
      alert("Download failed: " + (err.message || "Unknown error"));
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleDownloadCustomPdf = async () => {
    const url = getCustomCertificateDownloadUrl({
      studentName: certData.studentName,
      teamName: certData.teamName,
      collegeName: certData.collegeName,
      role: certData.role,
      certType: certData.certType,
      preview: false
    });
    const cleanName = (certData.studentName || "Participant").replace(/\s+/g, "_");
    await downloadFileFromUrl(url, `Certificate_${cleanName}.pdf`);
  };

  const handleLookupCertificates = async (e) => {
    if (e) e.preventDefault();
    const q = lookupQuery.trim();
    if (!q) {
      setLookupResult(null);
      setLookupError("");
      return;
    }
    setLookupLoading(true);
    setLookupError("");
    try {
      const res = await lookupCertificates(q);
      setLookupResult(res);
    } catch (err) {
      const qLower = q.toLowerCase();
      const matchedTeam = teams.find((t) =>
        (t.leaderEmail && t.leaderEmail.toLowerCase().includes(qLower)) ||
        (t.name && t.name.toLowerCase().includes(qLower)) ||
        (t.registrationId && t.registrationId.toLowerCase().includes(qLower)) ||
        ((t.members || []).some(
          (m) =>
            (m.email && m.email.toLowerCase().includes(qLower)) ||
            (m.full_name && m.full_name.toLowerCase().includes(qLower)) ||
            (m.name && m.name.toLowerCase().includes(qLower))
        ))
      );
      if (matchedTeam) {
        const matchedMember = (matchedTeam.members || []).find(
          (m) =>
            (m.email && m.email.toLowerCase() === qLower) ||
            (m.full_name && m.full_name.toLowerCase().includes(qLower)) ||
            (m.name && m.name.toLowerCase().includes(qLower))
        );
        setLookupResult({
          success: true,
          team: {
            id: matchedTeam.id,
            team_name: matchedTeam.name || matchedTeam.teamName,
            registration_id: matchedTeam.registrationId || matchedTeam.registration_id,
            college: matchedTeam.college,
            leader_name: matchedTeam.leaderName,
            leader_email: matchedTeam.leaderEmail,
            zip_download_url: getPublicTeamCertificateZipUrl(matchedTeam.id)
          },
          matched_member_id: matchedMember?.id || matchedTeam.members?.[0]?.id,
          members: (matchedTeam.members || []).map((m, idx) => ({
            id: m.id,
            name: m.full_name || m.name,
            email: m.email,
            role: m.is_leader || idx === 0 ? "Leader" : "Member",
            is_leader: m.is_leader || idx === 0,
            download_url: getPublicMemberCertificateUrl(m.id)
          }))
        });
      } else {
        setLookupError(err.message || `No records found for "${q}". Please check student email, leader email, or registration ID.`);
        setLookupResult(null);
      }
    } finally {
      setLookupLoading(false);
    }
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

  // Send single team email package with all 6 certificates
  const handleSendSingleTeam = async (team = null, customRecipient = null, ccMembers = null) => {
    const targetTeam = team || currentTeam;
    if (!targetTeam) {
      alert("Please select a team from the list first.");
      return;
    }

    const teamName = targetTeam.name || targetTeam.teamName || targetTeam.team_name || "Selected Team";
    const leaderEmail = targetTeam.leaderEmail || targetTeam.leader_email || targetTeam.email || (targetTeam.members?.[0]?.email) || "";
    let recipient = (customRecipient || teamTargetEmail || leaderEmail || "").trim();

    if (!recipient || !recipient.includes("@")) {
      const promptEmail = window.prompt(
        `Leader email not found for team "${teamName}".\nPlease enter the recipient email address to send the 6 certificates to:`,
        ""
      );
      if (!promptEmail || !promptEmail.includes("@")) {
        alert("A valid email address is required to dispatch certificates.");
        return;
      }
      recipient = promptEmail.trim();
      setTeamTargetEmail(recipient);
    }

    const useCc = ccMembers !== null ? ccMembers : teamCcMembers;
    const members = targetTeam.members || [];
    const membersCount = members.length || 6;

    const conf = window.confirm(
      `✉️ CONFIRM DEDICATED TEAM DISPATCH\n\n` +
      `• Team: "${teamName}"\n` +
      `• Recipient: ${recipient}\n` +
      `• Certificates: All ${membersCount} member PDFs will be attached in 1 email package.\n` +
      (useCc ? `• CC Copy: Sending copy to all team member emails.\n\n` : `\n`) +
      `Send all ${membersCount} certificates now?`
    );
    if (!conf) return;

    setSendingTeamEmail(true);
    setTeamEmailResult(null);
    setSendStatuses((prev) => ({
      ...prev,
      [targetTeam.id]: { status: "sending", message: "Dispatching..." }
    }));

    try {
      const res = await adminSendTeamCertificates(targetTeam.id, {
        target_email: recipient,
        cc_members: useCc
      });
      setSendStatuses((prev) => ({
        ...prev,
        [targetTeam.id]: { status: "sent", message: `Delivered (${res.certificates_count || membersCount} certs)` }
      }));
      const successMsg = res.message || `Successfully sent all ${res.certificates_count || membersCount} certificates to ${recipient}!`;
      setTeamEmailResult({
        success: true,
        message: successMsg
      });
      alert(`🎉 SUCCESS!\n\n${successMsg}`);
    } catch (err) {
      const errorDetail = err.message || "Failed to dispatch team certificates.";
      setSendStatuses((prev) => ({
        ...prev,
        [targetTeam.id]: { status: "failed", message: errorDetail }
      }));
      setTeamEmailResult({
        success: false,
        message: errorDetail
      });

      if (errorDetail.toLowerCase().includes("smtp") || errorDetail.toLowerCase().includes("credential")) {
        const wantToOpen = window.confirm(
          `⚠️ SMTP CREDENTIALS NOT CONFIGURED!\n\n` +
          `To send real emails to teams, please save your Gmail address and 16-character Google App Password.\n\n` +
          `Would you like to open the "SMTP & Signatures" settings right now to set it up?`
        );
        if (wantToOpen) {
          setShowConfigModal(true);
        }
      } else {
        alert(`⚠️ Failed to Send Email:\n\n${errorDetail}`);
      }
    } finally {
      setSendingTeamEmail(false);
    }
  };

  // Send customized certificate directly to any student/leader email
  const handleSendCustomCertificate = async () => {
    if (!customEmail || !customEmail.includes("@")) {
      alert("Please enter a valid student email address.");
      return;
    }
    const conf = window.confirm(
      `Send certificate for "${certData.studentName}" (${certData.teamName}) to:\n${customEmail}?`
    );
    if (!conf) return;

    setSendingCustomEmail(true);
    setCustomEmailResult(null);
    try {
      const res = await adminSendCustomCertificate({
        student_name: certData.studentName,
        student_email: customEmail,
        team_name: certData.teamName,
        college_name: certData.collegeName,
        role: certData.role
      });
      setCustomEmailResult({ success: true, message: res.message || "Certificate emailed successfully!" });
    } catch (err) {
      setCustomEmailResult({ success: false, message: err.message || "Failed to send email." });
    } finally {
      setSendingCustomEmail(false);
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
    <div className="space-y-6 max-w-[1640px] mx-auto p-2 sm:p-4 print:p-0 print:m-0">
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
              onClick={() => {
                setEmailPreviewType("single");
                setShowEmailPreviewModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider border border-blue-500/40 transition shadow-sm"
            >
              <Eye size={16} />
              View Email Template
            </button>

            <button
              onClick={handlePrintCertificate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition shadow-md"
            >
              <Download size={16} />
              Download Clean A4 PDF
            </button>

            {currentTeam && (
              <button
                onClick={() => handleDownloadTeamZip(currentTeam.id, currentTeam.name)}
                disabled={downloadingZipId === currentTeam.id}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50"
                title={`Download ZIP package of all ${(currentTeam?.members || []).length || 6} certificates for ${currentTeam?.name}`}
              >
                <Archive size={16} />
                {downloadingZipId === currentTeam.id ? "Packing ZIP..." : `Download Team ZIP (${(currentTeam?.members || []).length || 6})`}
              </button>
            )}

            <button
              onClick={() => handleSendSingleTeam(currentTeam)}
              disabled={sendingTeamEmail || !currentTeam}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50"
              title={`Send all ${(currentTeam?.members || []).length || 6} certificates for ${currentTeam?.name || 'selected team'} in a single email`}
            >
              <Package size={16} />
              {sendingTeamEmail ? "Sending Team Package..." : `Send Selected Team (${(currentTeam?.members || []).length || 6} Certs)`}
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

      {/* DIRECT CERTIFICATE DOWNLOADER BY EMAIL / REG ID */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-blue-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles size={13} className="text-cyan-400" />
              Direct Participant Download Hub
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Download size={22} className="text-cyan-400" />
              Direct Certificate Download by Participant Email
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Enter any student's email, team leader's email, or registration ID to immediately download verified A4 PDF certificates or full team ZIP bundles with one click.
            </p>
          </div>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleLookupCertificates} className="mt-4 flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Enter Student Email (e.g. rahul@gmail.com), Leader Email, or Reg ID..."
              className="w-full pl-11 pr-8 py-3 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 border border-white/20 focus:border-cyan-400 rounded-2xl text-xs sm:text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/30 transition shadow-inner font-mono"
            />
            {lookupQuery && (
              <button
                type="button"
                onClick={() => {
                  setLookupQuery("");
                  setLookupResult(null);
                  setLookupError("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-1 rounded-full text-xs transition"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={lookupLoading || !lookupQuery.trim()}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer"
          >
            {lookupLoading ? (
              <RefreshCw size={16} className="animate-spin text-slate-950" />
            ) : (
              <Search size={16} className="text-slate-950" />
            )}
            {lookupLoading ? "Searching..." : "Find & Direct Download"}
          </button>
        </form>

        {/* Search Error */}
        {lookupError && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400 shrink-0" />
              <span>{lookupError}</span>
            </div>
            <button
              onClick={() => setLookupError("")}
              className="text-rose-300 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search Result Card */}
        {lookupResult?.team && (
          <div className="mt-5 p-5 bg-white text-slate-900 rounded-2xl border-2 border-cyan-400 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-black font-mono">
                    {lookupResult.team.registration_id || "SIH-2026"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-black">
                    ✓ Verified Hackathon Record
                  </span>
                  {lookupResult.matched_member_id && (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-black flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-amber-600" />
                      Matched Student Found
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  {lookupResult.team.team_name}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {lookupResult.team.college || "College / Institution"} • Leader: <strong>{lookupResult.team.leader_name}</strong> ({lookupResult.team.leader_email})
                </p>
              </div>

              {/* Fast Team Download Action */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDownloadTeamZip(lookupResult.team.id, lookupResult.team.team_name)}
                  disabled={downloadingZipId === lookupResult.team.id}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Archive size={16} />
                  {downloadingZipId === lookupResult.team.id ? "Packing ZIP..." : `Download All ${lookupResult.members?.length || 6} Certs (.ZIP)`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const matchedTeamObj = teams.find((t) => t.id === lookupResult.team.id);
                    if (matchedTeamObj) handleSelectTeam(matchedTeamObj);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5"
                >
                  <Eye size={15} /> Open in Studio
                </button>
              </div>
            </div>

            {/* Members Direct Download Roster */}
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                <span>Team Members ({lookupResult.members?.length || 0}) — Direct 1-Click PDF Download:</span>
                <span className="text-[11px] font-normal text-slate-500">click any button to download high-res A4 PDF</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(lookupResult.members || []).map((m, idx) => {
                  const isMatched = m.id === lookupResult.matched_member_id;
                  const isDownloading = downloadingPdfId === m.id;

                  return (
                    <div
                      key={m.id || idx}
                      className={`p-3.5 rounded-xl border-2 transition flex flex-col justify-between ${
                        isMatched
                          ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              m.is_leader
                                ? "bg-amber-500 text-slate-950"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {m.is_leader ? "👑 Team Leader" : `Member ${idx + 1}`}
                          </span>
                          {isMatched && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-200/70 px-1.5 py-0.5 rounded">
                              Target Match
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 truncate" title={m.name}>
                          {m.name}
                        </h4>
                        {m.email && (
                          <p className="text-[11px] text-slate-500 font-mono truncate" title={m.email}>
                            {m.email}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownloadMemberPdf(m.id, m.name, lookupResult.team.registration_id)}
                          disabled={isDownloading}
                          className="flex-1 py-1.5 px-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Download size={13} className={isDownloading ? "animate-spin" : ""} />
                          {isDownloading ? "Downloading..." : "Download PDF"}
                        </button>
                        <a
                          href={getPublicMemberCertificateUrl(m.id, true)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg transition text-xs font-bold"
                          title="Preview in new browser tab"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Studio Grid: Left Directory + Center Live Stage + Right Quick Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 print:block items-start">
        {/* COLUMN 1: Team & Member Directory (Hidden when printing) */}
        <div className="print:hidden lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Team Selector Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users size={15} className="text-blue-600" />
                Teams ({filteredTeams.length}{search.trim() ? `/${teams.length}` : ""})
              </h3>
              <button
                onClick={loadData}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
                title="Refresh team list"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-2.5">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team, student, leader, ID..."
                className="w-full pl-7 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-white border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold transition"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Team List Scrollbox */}
            <div className="max-h-[250px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading teams...</div>
              ) : filteredTeams.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 space-y-1.5">
                  <p className="font-bold text-slate-600">No teams match "{search}"</p>
                  <p className="text-[10px] text-slate-400">Search by team name, student name, leader or registration ID</p>
                  <button
                    onClick={() => setSearch("")}
                    className="text-[11px] text-blue-600 hover:underline font-bold pt-1 block mx-auto"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                filteredTeams.map((team) => {
                  const isSelected = team.id === selectedTeamId;
                  const sendState = sendStatuses[team.id];

                  return (
                    <div
                      key={team.id}
                      onClick={() => handleSelectTeam(team)}
                      className={`p-2.5 cursor-pointer transition flex items-center justify-between gap-1.5 ${
                        isSelected
                          ? "bg-blue-50/95 border-l-4 border-blue-600"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`font-black text-xs truncate ${isSelected ? "text-blue-950" : "text-slate-800"}`}>
                          {team.name || team.teamName}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {team.leaderName}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        {sendState?.status === "sent" && (
                          <CheckCircle2 size={13} className="text-emerald-600" title="Delivered" />
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
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 truncate max-w-[140px]" title={currentTeam.name || currentTeam.teamName}>
                  Members: {currentTeam.name || currentTeam.teamName || "Team"}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDownloadTeamZip(currentTeam.id, currentTeam.name || currentTeam.teamName)}
                    disabled={downloadingZipId === currentTeam.id}
                    className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 px-2 py-0.5 rounded transition cursor-pointer"
                    title="Direct Download all member certificates as a ZIP archive"
                  >
                    <Archive size={11} /> {downloadingZipId === currentTeam.id ? "..." : "ZIP"}
                  </button>
                </div>
              </div>

              {/* Dedicated Big One-Click Send Button */}
              <div className="mb-2.5 p-2.5 bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50 rounded-xl border border-indigo-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold">
                  <span className="truncate flex items-center gap-1">
                    <Mail size={11} className="text-indigo-600 shrink-0" />
                    <span className="truncate">To: {currentTeam.leaderEmail || currentTeam.email || "Leader"}</span>
                  </span>
                  <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                    {(currentTeam.members || []).length || 6} Certs
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSendSingleTeam(currentTeam)}
                  disabled={sendingTeamEmail}
                  className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-black text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  title="Send all 6 certificates to this team via single email"
                >
                  <Send size={13} className={sendingTeamEmail ? "animate-spin" : ""} />
                  {sendingTeamEmail ? "Dispatching 6 Certificates..." : "✉️ Send All 6 Certs to Team"}
                </button>
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                {(currentTeam.members || []).map((m, idx) => {
                  const isSelected = idx === selectedMemberIndex;
                  return (
                    <div
                      key={m.id || idx}
                      onClick={() => handleSelectMember(m, idx)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl transition text-xs flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white font-bold shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span className="truncate flex items-center gap-1">
                        <span className="truncate">{m.full_name || m.name}</span>
                        {m.is_leader && (
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-black uppercase shrink-0 ${
                              isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            Leader
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadMemberPdf(m.id, m.full_name || m.name, currentTeam?.registrationId);
                          }}
                          className={`p-1 rounded transition ${
                            isSelected
                              ? "hover:bg-white/20 text-white"
                              : "hover:bg-slate-200 text-slate-500 hover:text-blue-600"
                          }`}
                          title={`Download ${m.full_name || m.name}'s Certificate (PDF)`}
                        >
                          <Download size={12} />
                        </button>
                        <span className="text-[9px] opacity-75">Select</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>


        {/* COLUMN 2: Official Real-Style SIH 2026 Landscape Certificate Preview */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-3">
          <div className="bg-slate-300/60 p-2 sm:p-4 rounded-2xl border border-slate-300 shadow-inner overflow-x-auto flex items-center justify-center">
            {/* The Certificate Container with responsive scaling */}
            <div
              id="sih-certificate-render-node"
              ref={printRef}
              className="w-full bg-white text-slate-900 relative shadow-2xl rounded-md overflow-hidden select-none"
              style={{
                maxWidth: "1020px",
                aspectRatio: "1492 / 1054", // Exact ratio of official 2nd - 3rd.png certificate
                boxSizing: "border-box"
              }}
            >
              {/* Official Certificate Background Image (Updated Final with Spider-Man SIH Badge) */}
              <img
                src="/sih_spiderman_certificate_2026.png"
                alt="SIH Official Certificate Template"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                crossOrigin="anonymous"
              />

              {/* Exact Dynamic Text Overlay safely placed in the white gap (Y: 52% to 70%) */}
              <div 
                className="absolute inset-x-0 flex flex-col items-center justify-between text-center pointer-events-none z-10"
                style={{
                  top: "52%",
                  bottom: "31.5%",
                  left: "8%",
                  right: "8%"
                }}
              >
                {/* Dynamic Student Name with Auto-Scaling for Long Names */}
                <div className="w-full">
                  <h1
                    className={`font-black uppercase text-[#1e3a8a] tracking-wider drop-shadow-xs leading-tight ${
                      (certData.studentName || "").length > 25
                        ? "text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl"
                        : (certData.studentName || "").length > 18
                        ? "text-sm sm:text-base md:text-xl lg:text-2xl xl:text-3xl"
                        : "text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl"
                    }`}
                  >
                    {certData.studentName}
                  </h1>
                  <div
                    className={`h-0.5 sm:h-1 bg-[#ea580c] mx-auto mt-0.5 ${
                      (certData.studentName || "").length > 25
                        ? "w-40 sm:w-56 md:w-72"
                        : "w-32 sm:w-44 md:w-60"
                    }`}
                  />
                </div>

                {/* Elegant Team Presentation with Ornaments */}
                <div className="flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
                  <p className="text-[11px] sm:text-xs md:text-sm lg:text-base font-medium text-slate-600 font-serif italic">
                    of Team{" "}
                    <span className="font-sans font-black not-italic text-slate-900 tracking-wide text-[11px] sm:text-xs md:text-sm lg:text-base ml-1">
                      {certData.teamName}
                    </span>
                  </p>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
                </div>

                {/* Description */}
                <p className="text-[8px] sm:text-[10px] md:text-xs text-slate-500 max-w-2xl mx-auto leading-tight">
                  for active innovation, technical excellence, and committed participation in the Smart India Hackathon 2026 Internal College Round.
                </p>
              </div>
            </div>
          </div>

          {/* Action bar underneath preview */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <strong className="text-slate-700">Live Stage:</strong> Official A4 Landscape (300 DPI Vector)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEmailPreviewType("single");
                  setShowEmailPreviewModal(true);
                }}
                className="text-slate-700 font-bold hover:bg-slate-100 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs transition"
              >
                <Eye size={13} className="text-blue-600" /> Preview Email
              </button>
              <button
                onClick={() => handleSendSingleTeam(currentTeam)}
                disabled={sendingTeamEmail || !currentTeam}
                className="text-blue-900 font-bold bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-xs transition disabled:opacity-50"
                title={`Send all ${(currentTeam?.members || []).length || 6} certificates for ${currentTeam?.name || 'team'} in a single email`}
              >
                <Package size={13} className="text-blue-700" /> Send {(currentTeam?.members || []).length || 6} Certs to Team
              </button>
              <button
                onClick={handlePrintCertificate}
                className="text-white font-bold bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg shadow-xs transition"
              >
                <Download size={13} /> Download Clean A4 PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED BOTTOM SECTION: Full-Width Studio Controls & Email Dispatcher */}
      <div className="print:hidden bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl shadow-md">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Certificate Content Editor & Dedicated Dispatch Hub
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Customize certificate fields dynamically, enter custom student details manually, or dispatch packages directly.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetToSelectedMember}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <RotateCcw size={14} className="text-indigo-600" /> Reset to Current Member
            </button>
            <button
              type="button"
              onClick={handleSwitchToCustomMode}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
                editorMode === "custom"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs ring-2 ring-amber-400/40"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
              }`}
            >
              <Sparkles size={14} className="text-amber-700" /> ✨ Custom Student Mode
            </button>
          </div>
        </div>

        {/* 2 Wide Side-by-Side Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CARD 1: Quick Content Editor (lg:col-span-6) */}
          <div className="lg:col-span-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
                  <Edit3 size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Quick Content Editor
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Real-time dynamic canvas overlay</p>
                </div>
              </div>

              {/* Mode Toggle inside Editor */}
              <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setEditorMode("team");
                    handleResetToSelectedMember();
                  }}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer text-xs ${
                    editorMode === "team"
                      ? "bg-indigo-600 text-white font-black shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users size={12} /> Team Member
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToCustomMode}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer text-xs ${
                    editorMode === "custom"
                      ? "bg-amber-600 text-white font-black shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles size={12} /> Custom Student
                </button>
              </div>
            </div>

            {/* Custom Mode Banner with Quick Actions */}
            {editorMode === "custom" && (
              <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-150">
                <span className="flex items-center gap-1.5 font-bold">
                  <Sparkles size={14} className="text-amber-600 shrink-0" />
                  Custom Student Mode Active: Enter any name & email manually.
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleClearCustomFields}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
                  >
                    ➕ Blank Form
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyFromSelectedMember}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                  >
                    👥 Copy from Team
                  </button>
                </div>
              </div>
            )}

            {/* Content Fields */}
            <div className="space-y-4">
              {/* Student Name */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  <User size={14} className="text-blue-600" />
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={certData.studentName}
                  onChange={(e) => setCertData({ ...certData, studentName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition shadow-2xs"
                />
              </div>

              {/* Student Email Address */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  <Mail size={14} className="text-indigo-600" />
                  Student Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition shadow-2xs"
                />
              </div>

              {/* Team Name and Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                    <Users size={14} className="text-indigo-600" />
                    Team / Project Name
                  </label>
                  <input
                    type="text"
                    value={certData.teamName}
                    onChange={(e) => setCertData({ ...certData, teamName: e.target.value })}
                    placeholder="e.g. CyberKnights or Individual"
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                    <Award size={14} className="text-amber-600" />
                    Role / Designation
                  </label>
                  <div className="relative">
                    <select
                      value={certData.role}
                      onChange={(e) => setCertData({ ...certData, role: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition shadow-2xs appearance-none pr-8 cursor-pointer"
                    >
                      <option value="Leader">Team Leader</option>
                      <option value="Member">Team Member</option>
                      <option value="Participant">Individual Participant</option>
                      <option value="Winner">Winner / 1st Place</option>
                      <option value="Runner Up">Runner-Up</option>
                      <option value="Mentor">Mentor / Guide</option>
                      <option value="Volunteer">Volunteer</option>
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Certificate Type */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  <Award size={14} className="text-emerald-600" />
                  Certificate Type
                </label>
                <div className="relative">
                  <select
                    value={certData.certType}
                    onChange={(e) => setCertData({ ...certData, certType: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 border border-blue-200 rounded-xl font-bold text-blue-900 bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition shadow-2xs appearance-none pr-8 cursor-pointer"
                  >
                    <option value="PARTICIPATION">📜 CERTIFICATE OF PARTICIPATION</option>
                    <option value="MERIT & EXCELLENCE">🌟 CERTIFICATE OF MERIT & EXCELLENCE</option>
                    <option value="WINNER (1ST PLACE)">🏆 CERTIFICATE OF WINNER (1ST PLACE)</option>
                    <option value="RUNNER UP">🥈 CERTIFICATE OF RUNNER UP</option>
                    <option value="APPRECIATION">🎖️ CERTIFICATE OF APPRECIATION</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
                </div>
              </div>

              {/* College / Institution */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  <Building size={14} className="text-slate-600" />
                  College / Institution / Organization
                </label>
                <input
                  type="text"
                  value={certData.collegeName}
                  onChange={(e) => setCertData({ ...certData, collegeName: e.target.value })}
                  placeholder="College / Institution Name"
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* CARD 2: Dedicated Email Dispatch & Download Hub (lg:col-span-6) */}
          <div className="lg:col-span-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-700 flex items-center justify-center font-bold">
                  <Mail size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Email Dispatch Hub
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Send certificates via Gmail SMTP</p>
                </div>
              </div>

              {/* Mode Switcher Tabs (3 Tabs: Team Package | Selected Member | Custom Student) */}
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
                <button
                  type="button"
                  onClick={() => setDispatchTab("team")}
                  className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer text-xs ${
                    dispatchTab === "team"
                      ? "bg-indigo-600 text-white shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Package size={13} /> Team Package
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDispatchTab("single");
                    setEditorMode("team");
                  }}
                  className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer text-xs ${
                    dispatchTab === "single"
                      ? "bg-indigo-600 text-white shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <User size={13} /> Selected Member
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToCustomMode}
                  className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer text-xs ${
                    dispatchTab === "custom"
                      ? "bg-amber-600 text-white shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles size={13} /> Custom Student
                </button>
              </div>
            </div>

            {/* SMTP Not Configured Helper Banner */}
            {!config.is_smtp_configured && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span>
                    <strong>Gmail SMTP Not Configured:</strong> Connect your Gmail & App Password to enable real email sending.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-lg shrink-0 text-xs shadow-2xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Sliders size={12} /> Configure Gmail SMTP
                </button>
              </div>
            )}

            {/* TAB 1: DEDICATED TEAM PACKAGE */}
            {dispatchTab === "team" && (
              <div className="space-y-4 bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-white p-4 sm:p-5 rounded-2xl border border-indigo-200 shadow-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-indigo-950 flex items-center gap-1.5 truncate">
                    <Package size={16} className="text-indigo-600 shrink-0" />
                    <span className="truncate">{currentTeam?.name || currentTeam?.teamName || "Team Package"}</span>
                  </span>
                  <span className="text-xs font-black bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg border border-indigo-200 shrink-0">
                    All {(currentTeam?.members || []).length || 6} Certs Attached
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Send to Team Email (Leader or Custom):
                  </label>
                  <input
                    type="email"
                    value={teamTargetEmail}
                    onChange={(e) => setTeamTargetEmail(e.target.value)}
                    placeholder="leader@example.com"
                    className="w-full text-sm px-3.5 py-2.5 border border-indigo-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono shadow-2xs"
                  />
                </div>

                {/* CC Members Checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={teamCcMembers}
                    onChange={(e) => setTeamCcMembers(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-semibold">
                    Also send a CC copy to all registered team member emails
                  </span>
                </label>

                {/* Members Included List */}
                <div className="bg-white/90 p-3 rounded-xl border border-indigo-100 space-y-2">
                  <p className="font-bold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <CheckCheck size={13} className="text-emerald-600" />
                    All {(currentTeam?.members || []).length || 6} Member PDFs in this Email Package:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {(currentTeam?.members || []).map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-800 text-xs px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="truncate flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate font-medium">{m.full_name || m.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                          {m.is_leader ? "Leader" : "Member"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons: Email + ZIP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSendSingleTeam(currentTeam)}
                    disabled={sendingTeamEmail || !teamTargetEmail}
                    className="py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Send size={15} className={sendingTeamEmail ? "animate-spin" : ""} />
                    {sendingTeamEmail
                      ? "Dispatching 6 Certificates..."
                      : `Send All ${(currentTeam?.members || []).length || 6} Certs in Single Mail`}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadTeamZip(currentTeam?.id, currentTeam?.name || currentTeam?.teamName)}
                    disabled={downloadingZipId === currentTeam?.id || !currentTeam}
                    className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Archive size={15} />
                    {downloadingZipId === currentTeam?.id ? "Packing ZIP..." : "Download Team ZIP"}
                  </button>
                </div>

                {/* Feedback Message */}
                {teamEmailResult && (
                  <div
                    className={`text-xs font-bold p-3 rounded-xl flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                      teamEmailResult.success
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {teamEmailResult.success ? (
                        <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle size={16} className="shrink-0 text-rose-600" />
                      )}
                      <span className="truncate">{teamEmailResult.message}</span>
                    </div>
                    <button
                      onClick={() => setTeamEmailResult(null)}
                      className="text-slate-400 hover:text-slate-700 text-sm font-bold shrink-0 ml-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SELECTED TEAM MEMBER CERTIFICATE */}
            {dispatchTab === "single" && (
              <div className="space-y-4 bg-gradient-to-br from-indigo-50/60 via-slate-50/50 to-blue-50/40 p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5 truncate">
                    <User size={15} className="text-indigo-600 shrink-0" />
                    <span className="truncate">{certData.studentName || "Selected Member"}</span>
                  </span>
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg shrink-0">
                    Team: {currentTeam?.name || "Team Member"}
                  </span>
                </div>

                {/* Quick Fill suggestion if leaderEmail exists and differs */}
                {currentTeam?.leaderEmail && customEmail !== currentTeam.leaderEmail && (
                  <button
                    type="button"
                    onClick={() => setCustomEmail(currentTeam.leaderEmail)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 truncate cursor-pointer"
                  >
                    💡 Use leader email: <span className="font-mono font-bold truncate">{currentTeam.leaderEmail}</span>
                  </button>
                )}

                {/* Full-width Recipient Email Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Send Certificate to Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full text-sm px-3.5 py-2.5 border border-indigo-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-2xs font-mono"
                  />
                </div>

                {/* Action Buttons: Clean Side-by-Side Row (Never Squished) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadCustomPdf}
                    className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                    title="Direct Download this Certificate (PDF)"
                  >
                    <Download size={14} /> Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCustomCertificate}
                    disabled={sendingCustomEmail || !customEmail}
                    className="py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Send size={14} className={sendingCustomEmail ? "animate-spin" : ""} />
                    {sendingCustomEmail ? "Sending Email..." : "Send Certificate Email"}
                  </button>
                </div>

                {customEmailResult && (
                  <div
                    className={`text-xs font-bold p-3 rounded-xl flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                      customEmailResult.success
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {customEmailResult.success ? (
                        <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle size={16} className="shrink-0 text-rose-600" />
                      )}
                      <span className="truncate">{customEmailResult.message}</span>
                    </div>
                    <button
                      onClick={() => setCustomEmailResult(null)}
                      className="text-slate-400 hover:text-slate-700 text-sm font-bold shrink-0 ml-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CUSTOM / MANUAL STUDENT CERTIFICATE */}
            {dispatchTab === "custom" && (
              <div className="space-y-4 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5 truncate">
                    <Sparkles size={16} className="text-amber-600 shrink-0" />
                    <span>Custom Student Certificate</span>
                  </span>
                  <span className="text-xs font-black bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-300 shrink-0">
                    Manual Dispatch
                  </span>
                </div>

                {/* Recipient Details Preview Card */}
                <div className="p-3 bg-white/90 rounded-xl border border-amber-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Recipient Name:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">
                      {certData.studentName || "(Enter name in editor)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Certificate Type:</span>
                    <span className="font-bold text-blue-700">{certData.certType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Team / Organization:</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                      {certData.teamName} • {certData.collegeName || "Institution"}
                    </span>
                  </div>
                </div>

                {/* Full-width Recipient Email Input */}
                <div className="space-y-1">
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Send To Student Email <span className="text-rose-500">*</span></span>
                    {currentTeam?.leaderEmail && (
                      <button
                        type="button"
                        onClick={() => setCustomEmail(currentTeam.leaderEmail)}
                        className="text-[11px] text-amber-700 hover:text-amber-900 underline font-normal cursor-pointer"
                      >
                        Use {currentTeam.name} leader email
                      </button>
                    )}
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="student.name@gmail.com"
                    className="w-full text-sm px-3.5 py-2.5 border border-amber-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-2xs font-mono"
                  />
                </div>

                {/* Side-by-Side Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadCustomPdf}
                    className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                    title="Direct Download this Custom Certificate (PDF)"
                  >
                    <Download size={14} /> Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCustomCertificate}
                    disabled={sendingCustomEmail || !customEmail || !certData.studentName}
                    className="py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Send size={14} className={sendingCustomEmail ? "animate-spin" : ""} />
                    {sendingCustomEmail ? "Sending Certificate..." : "Email to Student"}
                  </button>
                </div>

                {/* Quick helpers */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <button
                    type="button"
                    onClick={handleClearCustomFields}
                    className="hover:text-slate-800 underline cursor-pointer"
                  >
                    ➕ Blank / New Student
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyFromSelectedMember}
                    className="hover:text-slate-800 underline cursor-pointer"
                  >
                    👥 Copy current team details
                  </button>
                </div>

                {/* Feedback Message */}
                {customEmailResult && (
                  <div
                    className={`text-xs font-bold p-3 rounded-xl flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                      customEmailResult.success
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {customEmailResult.success ? (
                        <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle size={16} className="shrink-0 text-rose-600" />
                      )}
                      <span className="truncate">{customEmailResult.message}</span>
                    </div>
                    <button
                      onClick={() => setCustomEmailResult(null)}
                      className="text-slate-400 hover:text-slate-700 text-sm font-bold shrink-0 ml-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}
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
                      placeholder="16 letters code (e.g. abcd efgh ijkl mnop)"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      💡 Generate at: <strong>Google Account → Security → 2-Step Verification → App Passwords</strong> (Select 'Mail').
                    </p>
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

      {/* Interactive Email Format Preview Modal */}
      {showEmailPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <Mail size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Official Dispatch Email Format</h2>
                  <p className="text-xs text-slate-500">Live preview of the actual email delivered to students/leaders</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-200 p-1 rounded-xl">
                <button
                  onClick={() => setEmailPreviewType("single")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    emailPreviewType === "single"
                      ? "bg-white text-indigo-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Single Student
                </button>
                <button
                  onClick={() => setEmailPreviewType("team")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    emailPreviewType === "team"
                      ? "bg-white text-indigo-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Team Leader (All 6 Certs)
                </button>
              </div>
            </div>

            {/* Email Metadata Bar */}
            <div className="bg-slate-100/80 px-6 py-3 border-b border-slate-200 text-xs space-y-1">
              <div className="flex items-center text-slate-600">
                <span className="w-16 font-bold text-slate-500 uppercase text-[10px]">From:</span>
                <span className="font-mono text-slate-800">
                  {config.smtp_from_name || "SIH Organizing Committee"} &lt;{config.smtp_user || "sih.organizing@gtmc.edu"}&gt;
                </span>
              </div>
              <div className="flex items-center text-slate-600">
                <span className="w-16 font-bold text-slate-500 uppercase text-[10px]">To:</span>
                <span className="font-mono text-slate-800">
                  {emailPreviewType === "single"
                    ? (customEmail || "student@example.com")
                    : (currentTeam?.leaderEmail || "team.leader@example.com")}
                </span>
              </div>
              <div className="flex items-center text-slate-600">
                <span className="w-16 font-bold text-slate-500 uppercase text-[10px]">Subject:</span>
                <span className="font-bold text-slate-900">
                  {emailPreviewType === "single"
                    ? `Official Certificate for ${certData.studentName || "Participant"} • Smart India Hackathon 2026`
                    : `Official Team Certificates Package: Team '${certData.teamName || "CyberKnights"}' • Smart India Hackathon 2026`}
                </span>
              </div>
            </div>

            {/* Email Preview Body */}
            <div className="p-6 overflow-y-auto bg-slate-100 flex-1">
              <div className="max-w-xl mx-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                {/* Email Header with Authentic Spider-Man SIH Badge & Luxury Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#0a1931] to-[#ea580c] text-white p-7 text-center">
                  <div className="flex justify-center mb-3">
                    <img
                      src="/sih_spiderman_badge_thumb.png"
                      alt="SIH 2026 Badge"
                      className="w-20 h-20 rounded-full border-2 border-amber-400 shadow-xl object-cover"
                    />
                  </div>
                  <span className="inline-block bg-white/15 border border-white/30 text-amber-300 px-3.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                    Official Recognition
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                    Smart India Hackathon 2026
                  </h1>
                  <p className="text-slate-200 text-xs mt-1 font-medium">
                    Internal Hackathon Round • Ministry of Education & AICTE Initiative
                  </p>
                </div>


                {/* Email Content */}
                <div className="p-6 text-slate-700 text-sm space-y-4">
                  <p className="font-semibold text-slate-900">
                    {emailPreviewType === "single"
                      ? `Dear ${certData.studentName || "Student"},`
                      : `Dear ${certData.studentName || "Team Leader"} (Team Leader),`}
                  </p>

                  <p className="leading-relaxed">
                    {emailPreviewType === "single"
                      ? `Congratulations on your outstanding participation, technical excellence, and dedication representing Team ${certData.teamName} in the Smart India Hackathon 2026 Internal College Round!`
                      : `Congratulations to you and all members of Team ${certData.teamName} for your innovative technical project and performance in the Smart India Hackathon 2026 Internal College Round!`}
                  </p>

                  {/* Highlight Package Box */}
                  <div className="bg-slate-50 border-l-4 border-orange-500 p-4 rounded-r-xl border border-slate-200">
                    <p className="font-bold text-slate-900 text-sm">
                      {emailPreviewType === "single"
                        ? "Official Certificate Attached:"
                        : "Complete Team Certificate Package (6 Certificates):"}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {emailPreviewType === "single"
                        ? `Your verified, high-resolution A4 digital certificate (Certificate_${(certData.studentName || "Student").replace(/\s+/g, "_")}.pdf) is attached to this email.`
                        : `We have attached all official PDF certificates for every registered member of Team "${certData.teamName}" in this single email.`}
                    </p>
                  </div>

                  {emailPreviewType === "team" && (
                    <p className="text-xs text-slate-600 italic">
                      Please forward the respective individual PDF certificates to each of your team members.
                    </p>
                  )}

                  <p className="text-sm">Wishing you endless success and innovation in your future hackathons!</p>

                  <div className="pt-4 border-t border-dashed border-slate-200">
                    <p className="font-black text-slate-900 text-sm">SIH 2026 Organizing Committee</p>
                    <p className="text-xs text-slate-500">Hackathon Management & Innovation Cell</p>
                  </div>
                </div>

                {/* Attached Files Bar */}
                <div className="bg-slate-50 p-4 border-t border-slate-200">
                  <p className="text-[11px] font-black uppercase text-slate-600 mb-2 flex items-center gap-1.5">
                    <FileText size={13} className="text-indigo-600" />
                    {emailPreviewType === "single" ? "1 Attachment (PDF)" : "All 6 Team Certificates Attached (PDF)"}
                  </p>
                  <div className="space-y-1">
                    {emailPreviewType === "single" ? (
                      <div className="flex items-center justify-between bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
                        <span className="font-medium text-slate-800">
                          Certificate_{(certData.studentName || "Student").replace(/\s+/g, "_")}.pdf
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">1.4 MB</span>
                      </div>
                    ) : (
                      (currentTeam?.members || [
                        { name: "Leader" },
                        { name: "Member 2" },
                        { name: "Member 3" },
                        { name: "Member 4" },
                        { name: "Member 5" },
                        { name: "Member 6" }
                      ]).map((m, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
                        >
                          <span className="font-medium text-slate-800">
                            Certificate_{(m.full_name || m.name || `Member_${idx + 1}`).replace(/\s+/g, "_")}_{currentTeam?.registrationId || "SIH"}.pdf
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">1.4 MB</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-end bg-white">
              <button
                onClick={() => setShowEmailPreviewModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}
