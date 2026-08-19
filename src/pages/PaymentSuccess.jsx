import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Copy, Crown, Download, Mail, Phone, Printer, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "../components/ui/Button";
import { PageLoader } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { WhatsAppCard } from "../components/WhatsAppCard";
import { verifyPayment } from "../services/paymentService";
import { fetchTeamBundle } from "../services/apiService";
import { getTeamSession } from "../lib/session";
import { PAYMENT_STATUS } from "../types";

export function PaymentVerify() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id") || params.get("orderId");
  const [status, setStatus] = useState("PROCESSING");
  const [payload, setPayload] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("Missing order id.");
      return;
    }
    verifyPayment({ orderId })
      .then((result) => {
        setStatus(result.status);
        setPayload({
          registrationId: result.registrationId || "",
          paymentId: result.paymentId || "",
          transactionId: result.transactionId || "",
          amount: String(result.amount || ""),
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Payment verification failed"));
  }, [orderId]);

  if (!orderId) {
    return <ErrorState title="Payment verification failed" message="The order id is missing from the return URL." actionTo="/register" />;
  }
  if (error) {
    return <ErrorState title="Payment verification failed" message={error} actionTo="/register" actionLabel="Return to Registration" />;
  }
  if (status === PAYMENT_STATUS.SUCCESS) {
    const query = new URLSearchParams(payload).toString();
    return <LinkReplacer to={`/payment/success?${query}`} />;
  }
  if (status === PAYMENT_STATUS.FAILED) {
    return <LinkReplacer to="/payment/failed" />;
  }
  return <PageLoader label="Verifying payment..." />;
}

function LinkReplacer({ to }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return <PageLoader label="Redirecting..." />;
}

export function PaymentSuccess() {
  const [params] = useSearchParams();
  const registrationId = params.get("registrationId") || getTeamSession().registrationId;
  const teamId = params.get("teamId") || getTeamSession().teamId;
  const [team, setTeam] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (teamId) {
      fetchTeamBundle(teamId)
        .then((data) => {
          if (data) setTeam(data);
        })
        .catch(() => undefined);
    }
  }, [teamId]);

  function copyRegId() {
    const textToCopy = registrationId || team?.registrationId;
    if (textToCopy && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:py-28">
      {/* Success Badge & Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-web bg-[#25D366] font-display text-4xl text-web shadow-[4px_4px_0_#071433] animate-bounce">
          ✓
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-web bg-gold/40 px-3.5 py-1 text-xs font-black tracking-widest text-web uppercase">
          <ShieldCheck size={14} /> REGISTRATION CONFIRMED
        </div>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl text-web comic-pop">
          Your Team is Officially Registered!
        </h1>
        <p className="mt-2 text-ink/75 text-sm sm:text-base max-w-xl mx-auto">
          Welcome to <strong>Smart India Hackathon 2026</strong>. Follow the next steps below to join the official communication channel & lock your problem statement.
        </p>
      </div>

      {/* 1. Official WhatsApp Group Card (Prominently Placed) */}
      <div className="mt-8">
        <WhatsAppCard />
      </div>

      {/* 2. Official Team Registration Slip */}
      <div className="mt-8 surface-card p-6 sm:p-8 border-4 border-web bg-white shadow-[8px_8px_0_#071433]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-ink/20 pb-5">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-spidey">
              SMART INDIA HACKATHON 2026 · REGISTRATION RECEIPT
            </span>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl text-web">
              {team?.teamName || "SIH 2026 Team"}
            </h2>
          </div>

          <div className="text-left sm:text-right">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-bold text-ink/50">REG ID:</span>
              <button
                type="button"
                onClick={copyRegId}
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-web bg-gold/40 px-3 py-1 text-xs font-mono font-black text-web shadow-[2px_2px_0_#071433] hover:bg-gold transition"
              >
                {registrationId || team?.registrationId || "SIH26-TEAM"}
                {copied ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-ink/50 mt-1">Status: <strong className="text-emerald-700">CONFIRMED / ACTIVE</strong></p>
          </div>
        </div>

        {/* Team Leader & Details */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm bg-cream/50 p-4 rounded-xl border-2 border-web/20">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink/50 font-bold">Team Leader (Primary Contact)</p>
            <p className="font-bold text-ink mt-1 flex items-center gap-1.5 text-base">
              <Crown size={16} className="text-gold" />
              {team?.leaderName || "Team Leader"}
            </p>
            <div className="mt-1.5 space-y-0.5 text-xs text-ink/75">
              <p className="flex items-center gap-1.5">
                <Phone size={13} className="text-emerald-700" />
                <span className="font-semibold">{team?.phone || "Phone number registered"}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail size={13} className="text-spidey" />
                <span>{team?.email || "Email registered"}</span>
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-ink/50 font-bold">Stream & Registration Info</p>
            <p className="font-medium text-ink mt-1">{team?.leaderCourse || team?.course || "Registered Stream"}</p>
            <p className="text-xs text-ink/50 mt-1">Date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>

        {/* 6 Members Roster List */}
        {team?.members?.length ? (
          <div className="mt-6">
            <h4 className="font-display text-lg text-web mb-2">Team Members ({team.members.length})</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {team.members.map((member, idx) => (
                <div
                  key={member.id || idx}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                    member.isLeader ? "border-gold bg-gold/15 font-bold" : "border-ink/15 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-ink/40">#{idx + 1}</span>
                    <span className="font-medium text-ink">{member.name}</span>
                    {member.isLeader ? <Crown size={12} className="text-gold" /> : null}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    member.gender === "Female" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {member.gender}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Actions within receipt */}
        <div className="mt-6 pt-4 border-t border-ink/10 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/70 hover:text-ink transition"
          >
            <Printer size={14} /> Print / Save Registration Slip
          </button>
          <span className="text-[11px] text-ink/50">Present this Registration ID at the hackathon venue</span>
        </div>
      </div>

      {/* 3. Next Steps & CTAs */}
      <div className="mt-8 surface-card p-6 border-3 border-web bg-gold/20 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[4px_4px_0_#071433]">
        <div>
          <h3 className="font-display text-2xl text-web flex items-center gap-2 justify-center sm:justify-start">
            <Sparkles className="text-spidey" size={20} /> Next Steps: Problem Statement & Dashboard
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-ink/75">
            View team status on your Team Dashboard or explore problem statements.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
          <Link to={`/dashboard?regId=${registrationId || team?.registrationId || ""}`}>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              🚀 Go to Dashboard
            </Button>
          </Link>
          <Link to="/problems">
            <Button size="lg" className="w-full sm:w-auto">
              Choose Problem →
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 flex justify-center items-center gap-4 text-xs font-bold text-ink/60">
        <Link to={`/dashboard?regId=${registrationId || team?.registrationId || ""}`} className="hover:text-spidey transition">
          View Dashboard
        </Link>
        <span className="text-ink/30">•</span>
        <Link to="/register" className="hover:text-spidey transition">
          + Register another team
        </Link>
        <span className="text-ink/30">•</span>
        <Link to="/" className="hover:text-spidey transition">
          Back to Homepage
        </Link>
      </div>
    </div>
  );
}

export function PaymentFailed() {
  return (
    <div className="mx-auto max-w-xl px-4 py-28 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-rose bg-rose-100 text-rose font-display text-3xl">
        ✕
      </div>
      <h1 className="font-display text-4xl text-ink">Payment Verification Failed</h1>
      <p className="mt-3 text-ink/60 text-sm">
        Your registration payment could not be verified by the organizers.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/register">
          <Button>Try Registration Again</Button>
        </Link>
        <Link to="/">
          <Button variant="secondary">Return to Home</Button>
        </Link>
      </div>
    </div>
  );
}

