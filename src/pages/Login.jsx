import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginWithEmail, loginWithGoogle, registerWithEmail, logout } from "../firebase/auth";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/Field";
import { isFirebaseConfigured, auth } from "../firebase/config";
import { MaskBurst } from "../components/SpideyArt";
import { ShieldCheck, UserCheck, LogOut, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentUser = auth?.currentUser;

  async function onSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        await registerWithEmail(name, email, password);
      } else {
        await loginWithEmail(email, password);
      }
      navigate("/register");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle();
      navigate("/register");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await logout();
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-24">
      <MaskBurst className="pointer-events-none absolute -top-2 right-0 w-36 sm:w-48 opacity-85 z-10" />
      <p className="text-xs font-black tracking-[0.28em] text-spidey">SIH 2026 · GTMC NANDED</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl text-web comic-pop">
        {currentUser ? "Verified Profile" : mode === "login" ? "User Login" : "Create Account"}
      </h1>
      <p className="mt-2 text-xs sm:text-sm font-bold text-ink/70">
        Authenticating allows your team leader details to be verified in real-time.
      </p>

      {currentUser ? (
        <div className="relative mt-8 space-y-4 rounded-3xl border-4 border-web bg-white p-6 shadow-comic">
          <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="h-14 w-14 rounded-full border-2 border-web object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-web bg-gold font-display text-2xl text-web">
                {(currentUser.displayName || currentUser.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={12} /> Google Verified User
              </div>
              <p className="mt-1 font-display text-xl text-web">{currentUser.displayName || "Participant"}</p>
              <p className="text-xs font-mono text-ink/70">{currentUser.email}</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              onClick={() => navigate("/register")}
              className="w-full py-3 text-xs font-black uppercase bg-web text-white hover:bg-spidey transition shadow-comic border-2 border-web"
            >
              Continue to Registration <ArrowRight size={14} className="ml-1" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/dashboard")}
              className="w-full py-2.5 text-xs font-black uppercase border-2 border-web"
            >
              Go to Team Dashboard
            </Button>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full text-center text-xs font-bold text-rose-600 hover:underline pt-2 flex items-center justify-center gap-1"
            >
              <LogOut size={12} /> Sign Out of this account
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="relative mt-8 space-y-4 rounded-3xl border-4 border-web bg-white p-6 shadow-comic">
          {!isFirebaseConfigured && (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900">
              ⚡ Guest Mode: You can register directly without prior login, or configure Google OAuth for automatic real-user profile sync.
            </div>
          )}

          {mode === "signup" && (
            <Field label="Full name">
              <TextInput name="name" required placeholder="e.g. Rahul Sharma" />
            </Field>
          )}

          <Field label="Email Address">
            <TextInput name="email" type="email" required placeholder="participant@example.com" />
          </Field>

          <Field label="Password">
            <TextInput name="password" type="password" minLength={6} required placeholder="••••••••••••" />
          </Field>

          {error && <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}

          <Button type="submit" className="w-full py-3 text-xs font-black uppercase bg-web text-white hover:bg-spidey transition shadow-comic border-2 border-web" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="w-full py-2.5 text-xs font-black uppercase border-2 border-web bg-white hover:bg-slate-50 transition"
            disabled={!isFirebaseConfigured || loading}
            onClick={handleGoogleSignIn}
          >
            <Sparkles size={14} className="mr-1 text-amber-500" /> Continue with Google
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              className="text-xs font-black text-spidey hover:underline"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Need an account? Sign up" : "Already registered? Sign in"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 text-center space-x-4">
        <Link to="/" className="text-xs font-black text-ink/60 hover:text-web">
          ← Back to home
        </Link>
        <span className="text-ink/30">·</span>
        <Link to="/register" className="text-xs font-black text-spidey hover:text-web">
          Go to Registration Form →
        </Link>
      </div>
    </div>
  );
}
