import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles, KeyRound } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/Field";
import { adminSignIn } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

export function AdminLogin() {
  const { isAdmin, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && isAdmin) return <Navigate to="/admin" replace />;

  async function onSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await adminSignIn(email.trim(), password.trim());
      await refresh?.();
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials. Please check and try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleQuickFill() {
    setEmail("sih@gtmcnanded.in");
    setPassword("SihGtmc2026!");
    setError("");
  }

  return (
    <div className="relative flex min-h-[90vh] items-center justify-center px-4 py-24 sm:py-28">
      <div className="w-full max-w-md">
        {/* Header Badge */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-web bg-gold/30 px-3.5 py-1 text-xs font-black tracking-widest text-web">
            <ShieldCheck size={14} className="text-web" /> ORGANIZER PORTAL
          </div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl text-web comic-pop">
            Admin Login
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-xs sm:text-sm font-bold text-ink/70">
            Authorized access for GTMC Nanded hackathon coordinators and reviewers.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 rounded-3xl border-4 border-web bg-white p-6 sm:p-8 shadow-comic">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Organizer Email *" error={error && !email ? "Email is required" : ""}>
              <div className="relative">
                <TextInput
                  name="email"
                  type="email"
                  placeholder="sih@gtmcnanded.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </Field>

            <Field label="Password *" error={error && !password ? "Password is required" : ""}>
              <div className="relative">
                <TextInput
                  name="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </Field>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border-2 border-red-500 bg-red-50 p-3 text-xs font-bold text-red-700 animate-in fade-in duration-200">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={busy}
              className="w-full py-3 text-sm font-black uppercase tracking-wider bg-web text-white hover:bg-spidey transition shadow-comic hover:shadow-none"
            >
              <KeyRound size={16} className="mr-2" /> Enter Admin Panel
            </Button>
          </form>

          {/* Quick Demo Fill Helper */}
          <div className="mt-6 border-t-2 border-web/10 pt-4 text-center">
            <button
              type="button"
              onClick={handleQuickFill}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-web/40 bg-gold/15 px-3 py-1.5 text-xs font-black text-web hover:bg-gold/30 transition"
            >
              <Sparkles size={13} className="text-amber-600" /> Auto-fill Default Admin Credentials
            </button>
            <p className="mt-2 text-[11px] font-bold text-ink/50">
              Students: Looking for your team status? Visit{" "}
              <Link to="/dashboard" className="text-spidey underline hover:text-web">
                Team Dashboard
              </Link>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-black text-web hover:text-spidey transition"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
