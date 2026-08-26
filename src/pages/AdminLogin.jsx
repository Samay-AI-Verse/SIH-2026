import { useState, useEffect } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { 
  ShieldCheck, Lock, Mail, AlertCircle, KeyRound, Eye, EyeOff, 
  Sparkles, CheckCircle2, UserCheck, ShieldAlert, ArrowRight, LogOut 
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/Field";
import { adminSignIn } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";
import { loginWithGoogle, logout as firebaseLogout } from "../firebase/auth";
import { isFirebaseConfigured, auth } from "../firebase/config";

export function AdminLogin() {
  const { isAdmin, loading, refresh } = useAuth();
  const navigate = useNavigate();
  
  // Step 1 (Google Auth) & Step 2 (Admin ID/Password)
  const [googleUser, setGoogleUser] = useState(null);
  const [step, setStep] = useState(1); // 1 = Google Auth verification, 2 = Admin credentials

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    // Detect existing Firebase Google sign-in if available
    const curr = auth?.currentUser;
    if (curr) {
      setGoogleUser({
        email: curr.email || "",
        displayName: curr.displayName || "",
        photoURL: curr.photoURL || "",
      });
      if (!email) setEmail(curr.email || "");
      setStep(2);
    }
  }, []);

  if (!loading && isAdmin) return <Navigate to="/admin" replace />;

  async function handleGoogleVerify() {
    setGoogleBusy(true);
    setError("");
    try {
      const res = await loginWithGoogle();
      const user = res.user;
      setGoogleUser({
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
      });
      if (!email) setEmail(user.email || "");
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google identity verification failed.");
    } finally {
      setGoogleBusy(false);
    }
  }

  function handleSkipGoogle() {
    setStep(2);
  }

  async function handleResetGoogle() {
    try {
      await firebaseLogout();
      setGoogleUser(null);
      setStep(1);
    } catch (e) {
      console.error(e);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in both organizer ID and password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await adminSignIn(
        email.trim(),
        password.trim(),
        googleUser?.email || "",
        googleUser?.displayName || ""
      );
      await refresh?.();
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid organizer credentials. Please check your admin ID and password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[90vh] items-center justify-center px-4 py-24 sm:py-28">
      <div className="w-full max-w-md">
        {/* Header Badge */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-web bg-gold/30 px-3.5 py-1 text-xs font-black tracking-widest text-web">
            <ShieldCheck size={14} className="text-web" /> MASTER ORGANIZER PORTAL
          </div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl text-web comic-pop">
            Admin Login
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-xs sm:text-sm font-bold text-ink/70">
            2-Factor Identity & Organizer Authorization for GTMC Nanded hackathon coordinators.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 rounded-3xl border-4 border-web bg-white p-6 sm:p-8 shadow-comic space-y-5">
          {/* STEP 1: GOOGLE 2FA IDENTITY BADGE */}
          {googleUser ? (
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt="Profile"
                    className="h-10 w-10 shrink-0 rounded-full border-2 border-emerald-600 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white text-sm">
                    {(googleUser.displayName || googleUser.email || "G")[0].toUpperCase()}
                  </div>
                )}
                <div className="truncate">
                  <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-800 bg-emerald-200/80 px-2 py-0.2 rounded-full">
                    <CheckCircle2 size={11} /> Step 1: Google Identity Verified
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                    {googleUser.displayName || "Verified User"}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 truncate">
                    {googleUser.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetGoogle}
                title="Switch Google Account"
                className="shrink-0 text-slate-400 hover:text-rose-600 transition p-1"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-web/20 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-web">
                <Sparkles size={14} className="text-amber-500" /> Step 1: Verify Google Identity (Recommended)
              </div>
              <p className="text-[11px] font-bold text-ink/70 leading-relaxed">
                Signing in with your Google account authenticates your organizer email with verified multi-factor audit logging.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  onClick={handleGoogleVerify}
                  disabled={googleBusy || !isFirebaseConfigured}
                  className="w-full py-2 text-xs font-black uppercase bg-white border-2 border-web text-web hover:bg-slate-100 shadow-xs"
                >
                  <Sparkles size={14} className="mr-1.5 text-amber-500" />
                  {googleBusy ? "Verifying..." : "Verify with Google OAuth"}
                </Button>
                {step === 1 && (
                  <button
                    type="button"
                    onClick={handleSkipGoogle}
                    className="shrink-0 text-[11px] font-black text-slate-500 hover:text-web underline px-2 py-1"
                  >
                    Direct ID Login →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: ORGANIZER CREDENTIALS FORM */}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-600">
              <Lock size={13} className="text-spidey" /> Step 2: Organizer Credentials
            </div>

            <Field label="Organizer Login ID / Email *" error={error && !email ? "Email is required" : ""}>
              <div className="relative">
                <TextInput
                  name="email"
                  type="email"
                  placeholder="admin@gtmcnanded.in"
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
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
              <KeyRound size={16} className="mr-2" /> Enter Organizer Panel
            </Button>
          </form>

          {/* Helper Link */}
          <div className="border-t-2 border-web/10 pt-3 text-center">
            <p className="text-[11px] font-bold text-ink/50">
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
