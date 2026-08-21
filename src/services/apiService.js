import { api, getAdminToken, setAdminToken, API_BASE } from "../lib/api";

export async function createTeamRegistration(form) {
  const payload = {
    team_name: form.teamName?.trim(),
    college: form.college?.trim(),
    university: form.university?.trim() || form.college?.trim(),
    city: form.city?.trim(),
    state: form.state?.trim(),
    leader_name: form.leaderName?.trim(),
    leader_email: form.email?.trim(),
    leader_phone: form.phone?.trim(),
    leader_gender: form.leaderGender,
    leader_course: form.leaderCourse?.trim() || "B.Tech",
    leader_branch: form.leaderBranch?.trim() || "",
    leader_year: form.leaderYear?.trim() || "",
    leader_student_id: "",
    members: form.members.map((member, index) => ({
      full_name: member.name?.trim(),
      email: member.email?.trim() || (index === 0 ? form.email?.trim() : ""),
      phone: member.phone?.trim() || (index === 0 ? form.phone?.trim() : ""),
      gender: member.gender,
      college: member.college?.trim() || form.college?.trim() || "",
      course: member.course?.trim() || form.leaderCourse?.trim() || "B.Tech",
      branch: member.branch?.trim() || form.leaderBranch?.trim() || "",
      year: member.year?.trim() || form.leaderYear?.trim() || "",
      student_id: "",
    })),
  };
  const data = await api("/api/register", { method: "POST", body: JSON.stringify(payload) });
  return { teamId: data.team_id, registrationId: data.registration_id };
}

export async function fetchTeamBundle(teamId) {
  const data = await api(`/api/teams/${teamId}`);
  if (!data?.team) return null;
  return mapTeam(data.team, data.members || []);
}

export async function uploadPaymentProof(file) {
  const formData = new FormData();
  formData.append("file", file);
  return api("/api/payments/upload-direct", {
    method: "POST",
    body: formData,
  });
}


export async function submitPaymentUtr(teamId, utr, proofUrl = "", proofKey = "", paymentMode = "ONLINE", collectorName = "", receiptNo = "") {
  return api("/api/payments/utr", {
    method: "POST",
    body: JSON.stringify({
      team_id: teamId,
      utr: utr || "",
      proof_url: proofUrl,
      proof_key: proofKey,
      payment_mode: paymentMode,
      collector_name: collectorName,
      receipt_no: receiptNo,
    }),
  });
}

export async function selectProblem({ problemId, teamId, openInnovationTitle, openInnovationDescription, isOpenInnovation }) {
  return api("/api/problems/select", {
    method: "POST",
    body: JSON.stringify({
      team_id: teamId,
      problem_id: problemId,
      is_open_innovation: isOpenInnovation,
      open_innovation_title: openInnovationTitle,
      open_innovation_description: openInnovationDescription,
    }),
  });
}

export async function fetchSettings() {
  return api("/api/settings");
}

export async function lookupDashboard(email, teamName = "") {
  const data = await api("/api/dashboard/lookup", {
    method: "POST",
    body: JSON.stringify({ email, team_name: teamName }),
  });
  if (!data?.team) return null;
  return {
    team: mapTeam(data.team, data.members || []),
    members: data.members || [],
  };
}

export async function fetchProblems() {
  const data = await api("/api/problems");
  return (data || []).map(mapProblem);
}

export async function submitContact(payload) {
  await api("/api/contact", { method: "POST", body: JSON.stringify(payload) });
}

let sharedEventSource = null;
const tableListeners = new Set();
let sseErrorCount = 0;

function getSharedEventSource() {
  if (typeof window === "undefined" || !window.EventSource) return null;
  if (sseErrorCount >= 3) return null;

  if (!sharedEventSource || sharedEventSource.readyState === EventSource.CLOSED) {
    try {
      const baseUrl = API_BASE;
      sharedEventSource = new EventSource(`${baseUrl}/api/live`);

      sharedEventSource.addEventListener("change", (event) => {
        sseErrorCount = 0;
        tableListeners.forEach((fn) => {
          try {
            fn(event);
          } catch {
            // ignore callback error
          }
        });
      });

      sharedEventSource.onerror = () => {
        sseErrorCount++;
        if (sseErrorCount >= 3 && sharedEventSource) {
          try {
            sharedEventSource.close();
          } catch {
            // ignore close error
          }
          sharedEventSource = null;
        }
      };
    } catch {
      sharedEventSource = null;
    }
  }
  return sharedEventSource;
}

export function subscribeTable(_table, onChange) {
  tableListeners.add(onChange);
  getSharedEventSource();

  return () => {
    tableListeners.delete(onChange);
    if (tableListeners.size === 0 && sharedEventSource) {
      try {
        sharedEventSource.close();
      } catch {
        // ignore close error
      }
      sharedEventSource = null;
    }
  };
}



export async function adminFetchStats() {
  return api("/api/admin/stats");
}

export async function adminFetchTeams() {
  const data = await api("/api/admin/teams");
  return (data || []).map((row) => mapTeam(row, row.members || []));
}

export async function adminFetchRegistrations() {
  return adminFetchTeams();
}

export async function adminFetchPayments() {
  return api("/api/admin/payments");
}

export async function adminFetchMembers() {
  return api("/api/admin/members");
}

export async function adminUpdatePayment(paymentId, status) {
  await api(`/api/admin/payments/${paymentId}`, { method: "POST", body: JSON.stringify({ status }) });
}

export async function adminVerifyPayment(teamId, status = "SUCCESS", notes = "Approved by Admin") {
  return api("/api/admin/payments/verify", {
    method: "POST",
    body: JSON.stringify({ team_id: teamId, status, admin_notes: notes }),
  });
}

export async function adminCancelTeam(teamId, refund = false, notes = "") {
  return api(`/api/admin/teams/${teamId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ refund, admin_notes: notes }),
  });
}

export async function adminDeleteTeam(teamId) {
  return api(`/api/admin/teams/${teamId}`, { method: "DELETE" });
}



export async function adminUpdateSettings(patch) {
  await api("/api/admin/settings", { method: "POST", body: JSON.stringify(patch) });
}

export async function adminSetProblemStatus(problemId, status) {
  await api(`/api/admin/problems/${problemId}/status`, { method: "POST", body: JSON.stringify({ status }) });
}

export async function adminSignIn(email, password) {
  const data = await api("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) });
  setAdminToken(data.access_token || data.token);
  return data;
}

export async function adminSignOut() {
  setAdminToken("");
}

export async function adminSession() {
  if (!getAdminToken()) return null;
  try {
    const data = await api("/api/admin/me");
    return { user: data.admin, admin: data.admin };
  } catch {
    setAdminToken("");
    return null;
  }
}

function mapTeam(team, members) {
  const leaderCourse = team.leader_course || team.leaderCourse || team.course || "";
  const leaderBranch = team.leader_branch || team.leaderBranch || team.branch || "";
  const leaderYear = team.leader_year || team.leaderYear || team.year || "";
  const problemId = team.selected_problem_id || team.selectedProblemId || "";
  const problemTitle = team.selected_problem_title || team.selectedProblemTitle || "";
  const problemCode = team.selected_problem_code || team.selectedProblemCode || problemId;
  const isOpenInno = Boolean(team.is_open_innovation || team.isOpenInnovation);
  const openInnoTitle = team.open_innovation_title || team.openInnovationTitle || "";
  const openInnoDesc = team.open_innovation_description || team.openInnovationDescription || "";

  return {
    id: team.id,
    registrationId: team.registration_id || team.registrationId,
    registration_id: team.registration_id || team.registrationId,
    teamName: team.team_name || team.teamName,
    team_name: team.team_name || team.teamName,
    college: team.college,
    university: team.university,
    city: team.city,
    state: team.state,
    leaderName: team.leader_name || team.leaderName,
    leader_name: team.leader_name || team.leaderName,
    email: team.leader_email || team.leaderEmail || team.email,
    leader_email: team.leader_email || team.leaderEmail || team.email,
    phone: team.leader_phone || team.leaderPhone || team.phone,
    leader_phone: team.leader_phone || team.leaderPhone || team.phone,
    leaderGender: team.leader_gender || team.leaderGender,
    leader_gender: team.leader_gender || team.leaderGender,
    leaderCourse: leaderCourse,
    leader_course: leaderCourse,
    leaderBranch: leaderBranch,
    leader_branch: leaderBranch,
    leaderYear: leaderYear,
    leader_year: leaderYear,
    course: leaderCourse,
    stream: leaderCourse,
    branch: leaderBranch,
    year: leaderYear,
    registrationStatus: team.registration_status || team.registrationStatus,
    registration_status: team.registration_status || team.registrationStatus,
    paymentStatus: team.payment_status || team.paymentStatus,
    payment_status: team.payment_status || team.paymentStatus,
    selectedProblemId: problemId,
    selected_problem_id: problemId,
    selectedProblemTitle: problemTitle,
    selected_problem_title: problemTitle,
    selectedProblemCode: problemCode,
    selected_problem_code: problemCode,
    isOpenInnovation: isOpenInno,
    is_open_innovation: isOpenInno,
    openInnovationTitle: openInnoTitle,
    open_innovation_title: openInnoTitle,
    openInnovationDescription: openInnoDesc,
    open_innovation_description: openInnoDesc,
    registeredAt: team.registered_at || team.registeredAt,
    registered_at: team.registered_at || team.registeredAt,
    created_at: team.registered_at || team.registeredAt || team.created_at,
    members: (members || []).map((member) => ({
      id: member.id,
      name: member.full_name || member.name,
      full_name: member.full_name || member.name,
      email: member.email,
      phone: member.phone,
      gender: member.gender,
      college: member.college,
      course: member.course || leaderCourse,
      stream: member.course || leaderCourse,
      branch: member.branch || leaderBranch,
      year: member.year || leaderYear,
      studentId: member.student_id || member.studentId || "",
      student_id: member.student_id || member.studentId || "",
      isLeader: Boolean(member.is_leader),
      is_leader: Boolean(member.is_leader),
    })),
  };
}

function mapProblem(item) {
  return {
    id: item.id,
    code: item.code,
    title: item.title,
    organization: item.organization,
    category: item.category,
    theme: item.theme,
    difficulty: item.difficulty,
    description: item.description,
    background: item.background,
    expectedSolution: item.expected_solution,
    technicalRequirements: item.technical_requirements || [],
    technologies: item.technologies || [],
    constraints: item.constraint_items || [],
    evaluationCriteria: item.evaluation_criteria || [],
    selectedCount: item.selected_count || 0,
    maxSelections: item.max_selections || 2,
    status: item.status,
    sortOrder: item.sort_order,
  };
}

export async function adminFetchStudents() {
  return api("/api/admin/students");
}

export async function adminFetchBudget() {
  return api("/api/admin/budget");
}

export async function adminCreateExpense(data) {
  return api("/api/admin/expenses", { method: "POST", body: JSON.stringify(data) });
}

export async function adminDeleteExpense(expenseId) {
  return api(`/api/admin/expenses/${expenseId}`, { method: "DELETE" });
}

export async function adminFetchProblemsAnalytics() {
  return api("/api/admin/problems/analytics");
}

export async function updateTeamMember(teamId, memberId, payload) {
  return api(`/api/teams/${teamId}/members/${memberId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
