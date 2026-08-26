import { useEffect, useState, useMemo } from "react";
import { 
  Shield, UserPlus, Key, Lock, Laptop, CheckCircle2, AlertTriangle, 
  Trash2, RefreshCw, Search, Eye, EyeOff, LogOut, ShieldAlert, 
  UserCheck, KeyRound, Sparkles
} from "lucide-react";
import { 
  adminFetchAdmins, adminCreateAdmin, adminRevokeAdmin, 
  adminFetchLoginLogs, adminUpdateProfile, adminForceLogoutAll, 
  subscribeTable 
} from "../services/apiService";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../utils/cn";
import { Button } from "../components/ui/Button";

export function AdminSecurity() {
  const { user: currentAdmin, refresh, signOut } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logSearch, setLogSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, SUCCESS, FAILED

  // Personal Profile & Password Update State
  const [myEmail, setMyEmail] = useState("");
  const [myName, setMyName] = useState("");
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // Create Admin Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN"); // SUPER_ADMIN or ADMIN
  const [creatingBusy, setCreatingBusy] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  // Force Logout State
  const [forceLogoutBusy, setForceLogoutBusy] = useState(false);

  useEffect(() => {
    if (currentAdmin) {
      setMyEmail(currentAdmin.email || "");
      setMyName(currentAdmin.name || "");
    }
  }, [currentAdmin]);

  async function loadData() {
    setLoading(true);
    try {
      const [adminList, logList] = await Promise.all([
        adminFetchAdmins().catch(() => []),
        adminFetchLoginLogs().catch(() => [])
      ]);
      setAdmins(adminList || []);
      setLogs(logList || []);
    } catch (err) {
      console.error("Failed to load security audit data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    return subscribeTable("all", () => loadData().catch(() => undefined));
  }, []);

  async function handleUpdateMyProfile(e) {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });

    if (newPassword && newPassword.length < 6) {
      setProfileMsg({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setProfileMsg({ type: "error", text: "New password and confirmation password do not match." });
      return;
    }

    if ((newPassword || (myEmail !== currentAdmin?.email)) && !currPassword) {
      setProfileMsg({ type: "error", text: "Current password is required to change password or login email." });
      return;
    }

    setProfileBusy(true);
    try {
      const res = await adminUpdateProfile({
        name: myName.trim(),
        email: myEmail.trim().toLowerCase(),
        current_password: currPassword || undefined,
        new_password: newPassword || undefined
      });

      setProfileMsg({ type: "success", text: res.message || "Admin credentials updated successfully!" });
      setCurrPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await refresh?.();
      await loadData();
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setProfileBusy(false);
    }
  }

  async function handleForceLogoutAll() {
    const ok = window.confirm(
      "⚠️ FORCE LOGOUT ALL DEVICES & SESSIONS:\n\n" +
      "This will immediately revoke all active JWT tokens across all phones, computers, and tablets.\n" +
      "All logged-in administrators and sessions will be kicked out to the home screen.\n\n" +
      "Are you sure you want to proceed?"
    );

    if (!ok) return;

    setForceLogoutBusy(true);
    try {
      await adminForceLogoutAll();
      alert("✅ All active devices and sessions have been terminated. You will now be redirected to the home page.");
      window.location.href = "/";
    } catch (err) {
      alert("Failed to force logout all devices: " + (err?.message || "Unknown error"));
      setForceLogoutBusy(false);
    }
  }

  async function handleCreateAdmin(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Please fill in all required fields (Name, Email, Password).");
      return;
    }
    setCreatingBusy(true);
    try {
      const res = await adminCreateAdmin({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role: role
      });
      alert(res.message || "Admin privilege granted successfully!");
      setName("");
      setEmail("");
      setPassword("");
      setRole("ADMIN");
      await loadData();
    } catch (err) {
      alert("Failed to grant admin privilege: " + (err?.message || "Unknown error"));
    } finally {
      setCreatingBusy(false);
    }
  }

  async function handleRevokeAdmin(targetAdmin) {
    if (!window.confirm(`Are you sure you want to revoke Admin access for '${targetAdmin.name}' (${targetAdmin.email})?`)) {
      return;
    }
    setRevokingId(targetAdmin.id);
    try {
      const res = await adminRevokeAdmin(targetAdmin.id);
      alert(res.message || "Admin access revoked.");
      await loadData();
    } catch (err) {
      alert("Failed to revoke admin access: " + (err?.message || "Unknown error"));
    } finally {
      setRevokingId(null);
    }
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = logSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (log.email || "").toLowerCase().includes(q) ||
        (log.name || "").toLowerCase().includes(q) ||
        (log.ip_address || "").toLowerCase().includes(q) ||
        (log.user_agent || "").toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter === "SUCCESS") matchesStatus = log.status === "SUCCESS";
      else if (statusFilter === "FAILED") matchesStatus = log.status === "FAILED";

      return matchesSearch && matchesStatus;
    });
  }, [logs, logSearch, statusFilter]);

  const isSuperAdmin = currentAdmin?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-web flex items-center gap-3">
            <Shield className="text-spidey" size={36} /> Admin Security, Credentials & Device Control
          </h1>
          <p className="text-xs sm:text-sm font-bold text-ink/70 mt-1">
            Update your Admin Login ID & Password, invalidate sessions on all devices, grant organizer roles, and inspect login security audit logs.
          </p>
        </div>

        <button
          onClick={loadData}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border-2 border-web/20 bg-white px-4 py-2 text-xs font-black text-web hover:bg-gold transition shadow-xs"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Logs
        </button>
      </div>

      {/* EMERGENCY FORCE LOGOUT BANNER */}
      <div className="rounded-3xl border-3 border-rose-500 bg-rose-50/70 p-5 shadow-[6px_6px_0_#b91c1c] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-rose-600 p-2.5 text-white shadow-xs">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2 className="font-display text-2xl text-rose-900 leading-tight">
              Emergency Force Logout (All Devices & Users)
            </h2>
            <p className="text-xs font-bold text-rose-800/80 mt-1 max-w-2xl">
              Suspect unauthorized access or left logged in on public/shared devices? One click immediately invalidates all JWT tokens and sessions across all phones and browsers, kicking all sessions to the homepage.
            </p>
          </div>
        </div>

        <button
          onClick={handleForceLogoutAll}
          disabled={forceLogoutBusy}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-rose-700 bg-rose-600 px-5 py-3 text-xs font-black uppercase text-white shadow-comic hover:bg-rose-700 active:scale-95 transition disabled:opacity-50"
        >
          <LogOut size={16} />
          {forceLogoutBusy ? "Revoking All Devices..." : "🚨 Force Logout All Devices"}
        </button>
      </div>

      {/* SECTION 1: MY ADMIN CREDENTIALS & CHANGE PASSWORD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Update My ID & Password Form */}
        <div className="lg:col-span-1 rounded-3xl border-3 border-web bg-white p-5 shadow-[6px_6px_0_#071433] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="text-spidey" size={22} />
              <h2 className="font-display text-2xl text-web">My Admin Credentials</h2>
            </div>
            <span className="text-[10px] font-black uppercase bg-web/10 text-web px-2 py-0.5 rounded">
              Active Admin
            </span>
          </div>

          <form onSubmit={handleUpdateMyProfile} className="space-y-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Admin Display Name
              </label>
              <input
                type="text"
                required
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                className="w-full rounded-xl border-2 border-web/20 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Admin Login ID / Email
              </label>
              <input
                type="email"
                required
                value={myEmail}
                onChange={(e) => setMyEmail(e.target.value)}
                className="w-full rounded-xl border-2 border-web/20 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
              />
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                  Current Password (To Save Changes)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-bold text-spidey hover:underline inline-flex items-center gap-1"
                >
                  {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter current password..."
                value={currPassword}
                onChange={(e) => setCurrPassword(e.target.value)}
                className="w-full rounded-xl border-2 border-web/20 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
              />
            </div>

            <div className="border-t border-dashed border-slate-200 pt-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                New Password (Optional)
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                className="w-full rounded-xl border-2 border-web/20 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
              />
            </div>

            {newPassword && (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat new password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  className="w-full rounded-xl border-2 border-web/20 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                />
              </div>
            )}

            {profileMsg.text && (
              <div
                className={`flex items-start gap-2 rounded-xl border-2 p-2.5 text-xs font-bold ${
                  profileMsg.type === "success"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-rose-500 bg-rose-50 text-rose-800"
                }`}
              >
                {profileMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={profileBusy}
              className="w-full py-2.5 text-xs font-black uppercase bg-web text-white hover:bg-spidey transition shadow-comic border-2 border-web"
            >
              {profileBusy ? "Saving Updates..." : "Save ID & Password Updates"}
            </Button>
          </form>
        </div>

        {/* Grant Privilege & Active Roster */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grant Admin Form */}
          <div className="rounded-3xl border-3 border-web bg-white p-5 shadow-[6px_6px_0_#071433] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="text-spidey" size={22} />
                <h2 className="font-display text-2xl text-web">Grant Organizer Privilege</h2>
              </div>
              <span className="text-[10px] font-black uppercase bg-gold text-web px-2.5 py-0.5 rounded-full">
                Super Admin Only
              </span>
            </div>

            {!isSuperAdmin ? (
              <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-3.5 text-xs font-bold text-amber-900 leading-relaxed">
                🔒 Only Chief Super Admins can grant or revoke admin privileges. You are currently logged in as Sub-Admin.
              </div>
            ) : (
              <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Organizer Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border-2 border-web/20 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="organizer@gtmc.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border-2 border-web/20 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border-2 border-web/20 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Role Level
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border-2 border-web/20 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                  >
                    <option value="ADMIN">Sub-Admin / Event Organizer</option>
                    <option value="SUPER_ADMIN">Chief Super Admin</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    disabled={creatingBusy}
                    className="w-full py-2.5 text-xs font-black uppercase bg-spidey text-white hover:bg-web transition shadow-comic border-2 border-web"
                  >
                    {creatingBusy ? "Granting Privilege..." : "+ Grant Admin Privilege"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Active Admins Roster List */}
          <div className="rounded-3xl border-3 border-web bg-white p-5 shadow-[6px_6px_0_#071433] space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-display text-2xl text-web flex items-center gap-2">
                <Key className="text-gold" size={22} /> Authorized Admin Accounts ({admins.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-ui text-[10px] font-black uppercase tracking-wider text-slate-700 border-b-2 border-web/20">
                  <tr>
                    <th className="px-3 py-2.5">Admin ID & Name</th>
                    <th className="px-3 py-2.5">Role Level</th>
                    <th className="px-3 py-2.5">Google 2FA Account</th>
                    <th className="px-3 py-2.5">Approved / Added By</th>
                    <th className="px-3 py-2.5">Last Login Activity</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold">
                  {admins.map((adm) => {
                    const isCurrent = adm.id === currentAdmin?.id || adm.email === currentAdmin?.email;
                    return (
                      <tr key={adm.id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2.5">
                          <div className="font-bold text-web flex items-center gap-1.5">
                            {adm.name} {isCurrent && <span className="text-[9px] font-black bg-gold text-web px-1.5 py-0.2 rounded">YOU</span>}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">{adm.email}</div>
                        </td>

                        <td className="px-3 py-2.5">
                          {adm.role === "SUPER_ADMIN" ? (
                            <span className="inline-flex items-center gap-1 rounded bg-spidey text-white px-2 py-0.5 text-[9px] font-black uppercase">
                              👑 Master Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-web/10 text-web px-2 py-0.5 text-[9px] font-black uppercase border border-web/20">
                              🛡️ Sub-Admin
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2.5">
                          {adm.google_email ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                              <CheckCircle2 size={10} className="shrink-0 text-emerald-600" /> {adm.google_email}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Not Linked</span>
                          )}
                        </td>

                        <td className="px-3 py-2.5">
                          <span className="text-[11px] font-mono text-slate-700">
                            {adm.created_by || "MASTER_ADMIN"}
                          </span>
                        </td>

                        <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600">
                          {adm.last_login_at ? formatDate(adm.last_login_at) : "Never Logged In"}
                        </td>

                        <td className="px-3 py-2.5 text-right">
                          {isSuperAdmin && !isCurrent ? (
                            <button
                              disabled={revokingId === adm.id}
                              onClick={() => handleRevokeAdmin(adm)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500 bg-red-50 text-red-700 px-2 py-1 text-[10px] font-black uppercase hover:bg-red-700 hover:text-white transition disabled:opacity-50"
                              title="Revoke Admin Access"
                            >
                              <Trash2 size={12} /> Revoke
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Protected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: LOGIN SECURITY AUDIT LOG TRAIL */}
      <div className="rounded-3xl border-3 border-web bg-white p-5 shadow-[6px_6px_0_#071433] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="font-display text-2xl text-web flex items-center gap-2">
              <Lock className="text-spidey" size={22} /> Admin Login Security Audit Trail ({filteredLogs.length})
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              Every login attempt to the organizer panel is logged with timestamp, IP address, and browser fingerprint.
            </p>
          </div>

          {/* Search & Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Email, IP, Browser..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="rounded-xl border-2 border-web/20 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none w-48 sm:w-60"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border-2 border-web/20 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-web focus:outline-none"
            >
              <option value="ALL">Status: All Attempts</option>
              <option value="SUCCESS">Successful Logins</option>
              <option value="FAILED">Failed / Invalid Attempts</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto rounded-2xl border-2 border-web/20">
          <table className="w-full text-left text-xs">
            <thead className="bg-web text-white font-black uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Admin Email & Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Google 2FA Account</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Browser / Device Info</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-semibold">
              {filteredLogs.map((log) => {
                const isSuccess = log.status === "SUCCESS";
                return (
                  <tr key={log.id} className={isSuccess ? "hover:bg-slate-50 transition" : "bg-red-50/50 hover:bg-red-50 transition"}>
                    <td className="p-3 font-mono text-[11px] font-bold text-slate-700 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-web">{log.name || "Organizer"}</div>
                      <div className="font-mono text-[11px] text-slate-500">{log.email}</div>
                    </td>

                    <td className="p-3">
                      <span className="font-mono text-[10px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {log.role || "ADMIN"}
                      </span>
                    </td>

                    <td className="p-3">
                      {log.google_email ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                          <CheckCircle2 size={10} className="shrink-0 text-emerald-600" /> {log.google_email}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Direct Login</span>
                      )}
                    </td>

                    <td className="p-3 font-mono text-xs font-bold text-spidey">
                      {log.ip_address || "127.0.0.1"}
                    </td>

                    <td className="p-3 max-w-xs truncate text-[11px] font-mono text-slate-500" title={log.user_agent}>
                      <Laptop size={12} className="inline mr-1 text-slate-400" />
                      {log.user_agent || "Web Browser"}
                    </td>

                    <td className="p-3 text-right">
                      {isSuccess ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-black uppercase">
                          <CheckCircle2 size={11} /> SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-600 text-white px-2 py-0.5 text-[10px] font-black uppercase">
                          <AlertTriangle size={11} /> FAILED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!filteredLogs.length && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">
                    No login security logs found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
