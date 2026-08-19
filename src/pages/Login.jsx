import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginWithEmail, loginWithGoogle, registerWithEmail } from "../firebase/auth";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/Field";
import { isFirebaseConfigured } from "../firebase/config";
import { MaskBurst } from "../components/SpideyArt";

export function Login() {
    const navigate = useNavigate();
    const [mode, setMode] = useState("login");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    async function onSubmit(event) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const name = String(form.get("name") || "");
        const email = String(form.get("email") || "");
        const password = String(form.get("password") || "");
        setLoading(true);
        setError("");
        try {
            if (mode === "signup")
                await registerWithEmail(name, email, password);
            else
                await loginWithEmail(email, password);
            navigate("/register");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Authentication failed.");
        }
        finally {
            setLoading(false);
        }
    }
    return (
      <div className="relative mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-24">
        <MaskBurst className="pointer-events-none absolute -right-16 top-16 w-48 opacity-20" />
        <p className="text-xs font-black tracking-[0.28em] text-spidey">SIH 2026 · GTMC NANDED</p>
        <h1 className="mt-3 font-display text-5xl text-web comic-pop">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-3 text-ink/60">Only authenticated users can register a team of 6.</p>
        {!isFirebaseConfigured ? (
          <p className="mt-6 surface-card p-4 text-sm text-ink">
            Firebase is not configured yet. Add your keys to `.env` to enable secure authentication.
          </p>
        ) : null}
        <form onSubmit={onSubmit} className="relative mt-8 space-y-4 surface-card p-6">
          {mode === "signup" ? (
            <Field label="Full name">
              <TextInput name="name" required />
            </Field>
          ) : null}
          <Field label="Email">
            <TextInput name="email" type="email" required />
          </Field>
          <Field label="Password">
            <TextInput name="password" type="password" minLength={6} required />
          </Field>
          {error ? <p className="text-sm text-spidey">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading || !isFirebaseConfigured}>
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={!isFirebaseConfigured}
            onClick={async () => {
              try {
                await loginWithGoogle();
                navigate("/register");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Google sign-in failed.");
              }
            }}
          >
            Continue with Google
          </Button>
        </form>
        <button className="mt-6 text-sm font-bold text-spidey" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Need an account? Sign up" : "Already registered? Sign in"}
        </button>
        <Link to="/" className="mt-4 text-sm text-ink/50">
          Back to home
        </Link>
      </div>
    );
}
