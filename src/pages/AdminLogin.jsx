import { useState, useEffect } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { 
  ShieldCheck, Lock, Mail, AlertCircle, KeyRound, Eye, EyeOff, 
  Sparkles, CheckCircle2, UserCheck, ShieldAlert, ArrowRight, LogOut,
  ArrowLeft
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
  
  // Step 1 = Google Identity Verification
  // Step 2 = Organizer Admin ID & Password
  const [step, setStep] = useState(1);
  const [googleUser, setGoogleUser] = useState(null);

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
      console.error(err);
      if (!isFirebaseConfigured) {
        setError("Firebase configuration missing in .env. Please add VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID to enable real Google popup.");
      } else {
        setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleBusy(false);
    }
  }

  async function handleResetGoogle() {
    try {
      if (isFirebaseConfigured) {
        await firebaseLogout();
      }
    } catch (e) {
      console.error(e);
    }
    setGoogleUser(null);
    setStep(1);
    setError("");
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter your organizer admin ID and password.");
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
    <div className="relative flex min-h-screen items-center justify-center px-4 pt-16 pb-4 sm:pt-20 sm:pb-6 overflow-hidden">
      <div className="w-full max-w-md">
        {/* Header Badge */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-web bg-gold/30 px-3 py-0.5 text-[11px] font-black tracking-widest text-web">
            <ShieldCheck size={13} className="text-web" /> MASTER ORGANIZER PORTAL
          </div>
          <h1 className="mt-1.5 font-display text-3xl sm:text-4xl text-web comic-pop leading-tight">
            Admin Login
          </h1>
          <p className="mx-auto mt-1 max-w-xs text-xs font-bold text-ink/70 leading-snug">
            2-Factor Verification for GTMC Nanded Hackathon Coordinators & Reviewers.
          </p>
        </div>

        {/* STEP PROGRESS INDICATOR */}
        <div className="mt-3.5 flex items-center justify-center gap-2.5">
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border-2 transition ${
            step === 1 
              ? "border-web bg-web text-white shadow-xs" 
              : "border-emerald-600 bg-emerald-100 text-emerald-900"
          }`}>
            {googleUser ? <CheckCircle2 size={12} className="text-emerald-700" /> : "1"}
            <span>Google Identity</span>
          </div>

          <div className="h-0.5 w-5 bg-slate-300" />

          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border-2 transition ${
            step === 2 
              ? "border-web bg-web text-white shadow-xs" 
              : "border-slate-300 bg-slate-100 text-slate-400"
          }`}>
            <span>2</span>
            <span>Admin Password</span>
          </div>
        </div>

        {/* LOGIN CARD */}
        <div className="mt-3.5 rounded-3xl border-4 border-web bg-white p-5 sm:p-6 shadow-comic space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border-2 border-red-500 bg-red-50 p-2.5 text-xs font-bold text-red-700 animate-in fade-in duration-200">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: GOOGLE 2FA IDENTITY SCREEN ================= */}
          {step === 1 && (
            <div className="space-y-3.5">
              <div className="rounded-2xl border-2 border-web/20 bg-slate-50 p-4 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gold/30 border-2 border-web text-web">
                  <Sparkles size={20} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="font-display text-xl sm:text-2xl text-web">
                    Step 1: Authenticate Google Account
                  </h2>
                  <p className="text-[11px] sm:text-xs font-bold text-ink/70 mt-0.5 max-w-xs mx-auto leading-normal">
                    Verify your identity via Google OAuth before entering master organizer credentials.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleVerify}
                disabled={googleBusy}
                className="w-full py-3 text-xs font-black uppercase bg-white border-2 border-web text-web hover:bg-slate-50 shadow-comic flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                {googleBusy ? "Verifying with Google..." : "Continue with Google Account"}
              </Button>

              <div className="border-t border-slate-200 pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-[11px] font-black text-slate-500 hover:text-web underline inline-flex items-center gap-1"
                >
                  Direct ID & Password Login →
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: ORGANIZER PASSWORD FORM ================= */}
          {step === 2 && (
            <form onSubmit={onSubmit} className="space-y-3">
              {/* Verified Badge */}
              {googleUser ? (
                <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/80 p-2.5 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {googleUser.photoURL ? (
                      <img
                        src={googleUser.photoURL}
                        alt="Profile"
                        className="h-9 w-9 shrink-0 rounded-full border-2 border-emerald-600 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white text-xs">
                        {(googleUser.displayName || googleUser.email || "G")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="truncate">
                      <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-800 bg-emerald-200/80 px-1.5 py-0.2 rounded-full">
                        <CheckCircle2 size={10} /> Google Identity Verified
                      </div>
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {googleUser.displayName || "Verified User"}
                      </p>
                      <p className="text-[10px] font-mono text-slate-600 truncate">
                        {googleUser.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetGoogle}
                    title="Change Google Account"
                    className="shrink-0 text-slate-400 hover:text-rose-600 transition p-1"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Lock size={13} className="text-spidey" /> Organizer Credentials
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[10px] font-black text-spidey hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft size={11} /> Back to Step 1
                  </button>
                </div>
              )}

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
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>

              <Button
                type="submit"
                variant="primary"
                loading={busy}
                className="w-full py-2.5 text-xs font-black uppercase tracking-wider bg-web text-white hover:bg-spidey transition shadow-comic hover:shadow-none"
              >
                <KeyRound size={15} className="mr-1.5" /> Authorize & Enter Admin Panel
              </Button>
            </form>
          )}

          {/* Helper Link */}
          <div className="border-t-2 border-web/10 pt-2.5 text-center">
            <p className="text-[11px] font-bold text-ink/50">
              Students: Looking for your team status? Visit{" "}
              <Link to="/dashboard" className="text-spidey underline hover:text-web">
                Team Dashboard
              </Link>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-3 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[11px] font-black text-web hover:text-spidey transition"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
