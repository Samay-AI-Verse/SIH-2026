import { Link, Navigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PageLoader } from "../components/ui/Skeleton";
import { useAuth } from "../hooks/useAuth";
import { useTeam } from "../hooks/useTeam";
import { formatDate, formatINR } from "../utils/cn";
import { PAYMENT_STATUS, REGISTRATION_STATUS, ROLES } from "../types";
import { startCashfreeCheckout } from "../services/paymentService";
import { useSettings } from "../hooks/useSettings";
import { useState } from "react";
function toneFor(status) {
    if (status === "CONFIRMED" || status === "SUCCESS" || status === "PAID")
        return "green";
    if (status === "FULL" || status === "FAILED" || status === "CANCELLED")
        return "red";
    return "yellow";
}
export function Dashboard() {
    const { profile, loading: authLoading } = useAuth();
    const { team, loading } = useTeam();
    if (authLoading || loading)
        return <PageLoader label="Loading dashboard..."/>;
    if (profile?.role === ROLES.ADMIN)
        return <Navigate to="/admin" replace/>;
    if (!team) {
        return (<div className="surface-card p-8">
        <h1 className="font-display text-4xl text-web comic-pop">Welcome, {profile?.name || "builder"}</h1>
        <p className="mt-3 text-ink/60">You have not registered a team yet.</p>
        <Link to="/register" className="mt-6 inline-block">
          <Button>Register Your Team</Button>
        </Link>
      </div>);
    }
    const problemLabel = team.selectedProblemId ? team.selectedProblemTitle || team.selectedProblemId : "NOT SELECTED";
    return (<div>
      <p className="text-xs font-black tracking-[0.28em] text-spidey">TEAM DASHBOARD · GTMC NANDED</p>
      <h1 className="mt-3 font-display text-5xl text-web comic-pop">Welcome, {team.teamName}</h1>
      <div className="mt-5 flex flex-wrap gap-3">
        <StatusBadge tone={toneFor(team.registrationStatus)}>
          {team.registrationStatus === REGISTRATION_STATUS.CONFIRMED ? "CONFIRMED" : team.registrationStatus.replace("_", " ")}
        </StatusBadge>
        <StatusBadge tone={toneFor(team.paymentStatus)}>
          {team.paymentStatus === PAYMENT_STATUS.SUCCESS ? "PAID" : team.paymentStatus}
        </StatusBadge>
        <StatusBadge tone={team.selectedProblemId ? "green" : "yellow"}>{problemLabel}</StatusBadge>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashCard title="Registration" value={team.registrationStatus === "CONFIRMED" ? "Confirmed" : "Pending"}/>
        <DashCard title="Payment" value={team.paymentStatus === "SUCCESS" ? "Paid" : "Pending"}/>
        <DashCard title="Team Members" value={`${team.members?.length || 0} / 6`}/>
        <DashCard title="Problem Statement" value={team.selectedProblemId ? "Selected" : "Not Selected"}/>
      </div>
    </div>);
}
function DashCard({ title, value }) {
    return (<article className="shine surface-card p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{title}</p>
      <p className="mt-3 font-display text-2xl text-ink">{value}</p>
    </article>);
}
export function DashboardTeam() {
    const { team, loading } = useTeam();
    if (loading)
        return <PageLoader label="Loading dashboard..."/>;
    if (!team)
        return null;
    return (<div>
      <h1 className="font-display text-3xl text-ink">Team</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {team.members?.map((member) => (<article key={member.email} className="surface-card p-5">
            <p className="text-ink">{member.name}</p>
            <p className="text-sm text-ink/60">{member.email}</p>
            <p className="mt-2 text-xs text-ink/50">
              {member.course} · {member.branch} · {member.year}
            </p>
          </article>))}
      </div>
    </div>);
}
export function DashboardPayment() {
    const { team, loading } = useTeam();
    const { settings } = useSettings();
    const [busy, setBusy] = useState(false);
    if (loading)
        return <PageLoader label="Loading dashboard..."/>;
    if (!team)
        return null;
    const paid = team.paymentStatus === PAYMENT_STATUS.SUCCESS;
    const receiptTeam = team;
    function downloadReceipt() {
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>${receiptTeam.registrationId}</title>
      <style>body{font-family:Outfit,Arial,sans-serif;background:#071433;color:#fff;padding:48px} .card{max-width:560px;margin:auto;border:4px solid #f5c518;padding:32px;background:#0a1f5c} h1{letter-spacing:.2em;font-size:14px;color:#e11d2e} h2{font-size:28px;color:#f5c518}</style></head>
      <body><div class="card"><h1>SIH 2026</h1><h2>Registration Receipt</h2>
      <p>Registration ID: ${receiptTeam.registrationId}</p>
      <p>Team Name: ${receiptTeam.teamName}</p>
      <p>Amount Paid: ${formatINR(settings.fee, settings.currency)}</p>
      <p>Payment ID: ${receiptTeam.registrationId}</p>
      <p>Date: ${formatDate(receiptTeam.confirmedAt || receiptTeam.registeredAt)}</p>
      <p>Payment Status: ${receiptTeam.paymentStatus}</p></div></body></html>`;
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${receiptTeam.registrationId}-receipt.html`;
        link.click();
        URL.revokeObjectURL(url);
    }
    return (<div className="max-w-xl">
      <h1 className="font-display text-3xl text-ink">Payment</h1>
      <div className="mt-6 surface-card p-6">
        <p className="text-sm text-ink/60">Amount</p>
        <p className="font-display text-4xl text-ink">{formatINR(settings.fee, settings.currency)}</p>
        <p className="mt-4 text-sm text-ink/60">Status: {paid ? "PAID" : team.paymentStatus}</p>
        <p className="text-sm text-ink/50">{team.registrationId}</p>
      </div>
      <div className="mt-6 flex gap-3">
        {paid ? (<Button onClick={downloadReceipt}>Download Receipt</Button>) : (<Button disabled={busy} onClick={async () => {
                setBusy(true);
                try {
                    await startCashfreeCheckout(team.id);
                }
                finally {
                    setBusy(false);
                }
            }}>
            Try Again
          </Button>)}
      </div>
    </div>);
}
export function DashboardProfile() {
    const { profile } = useAuth();
    const { team } = useTeam();
    return (<div>
      <h1 className="font-display text-3xl text-ink">Profile</h1>
      <div className="mt-6 max-w-lg space-y-3 surface-card p-6">
        <p>{profile?.name}</p>
        <p className="text-ink/60">{profile?.email}</p>
        <p className="text-xs font-black tracking-[0.2em] text-spidey">{profile?.role}</p>
        {team ? <p className="text-sm text-ink/50">{team.registrationId}</p> : null}
      </div>
    </div>);
}
