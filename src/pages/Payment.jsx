import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Check, Copy, Crown, Phone, ShieldCheck, Clock, Upload, Image as ImageIcon, FileText } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/Field";
import { PageLoader } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { WhatsAppCard } from "../components/WhatsAppCard";
import { useTeam } from "../hooks/useTeam";
import { useSettings } from "../hooks/useSettings";
import { fetchTeamBundle, submitPaymentUtr, uploadPaymentProof, subscribeTable } from "../services/apiService";
import { saveTeamSession } from "../lib/session";
import { formatINR } from "../utils/cn";
import { PAYMENT_STATUS, REGISTRATION_STATUS } from "../types";

export function Payment() {
  const { teamId } = useParams();
  const { team: loaded, loading } = useTeam(teamId);
  const { settings } = useSettings();
  const [team, setTeam] = useState(loaded);
  const [paymentMode, setPaymentMode] = useState("ONLINE"); // ONLINE or OFFLINE_CASH
  const [paidClicked, setPaidClicked] = useState(false);
  const [utr, setUtr] = useState("");
  const [collectorName, setCollectorName] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    setTeam(loaded);
  }, [loaded]);

  useEffect(() => {
    if (!teamId) return undefined;
    return subscribeTable("teams", () => {
      fetchTeamBundle(teamId)
        .then((next) => {
          if (next) setTeam(next);
        })
        .catch(() => undefined);
    });
  }, [teamId]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (PNG, JPG, JPEG).");
        return;
      }
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
      setError("");
    }
  }

  function copyRegId() {
    if (team?.registrationId && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(team.registrationId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  }

  if (loading && !team) return <PageLoader label="Loading payment..." />;
  if (!team) {
    return <ErrorState title="Registration not found" message="Start again from team registration." actionTo="/register" />;
  }
  if (team.paymentStatus === PAYMENT_STATUS.SUCCESS && team.registrationStatus === REGISTRATION_STATUS.CONFIRMED) {
    return <Navigate to={`/payment/success?registrationId=${team.registrationId}&teamId=${team.id}`} replace />;
  }

  const waiting = submitted || team.paymentStatus === PAYMENT_STATUS.PROCESSING;
  const rejected = team.paymentStatus === PAYMENT_STATUS.FAILED;

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:py-28">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-web bg-gold/30 px-3 py-1 text-xs font-black tracking-widest text-web">
          <ShieldCheck size={14} /> STEP 2: REGISTRATION FEE & VERIFICATION
        </div>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl text-web comic-pop">
          {formatINR(settings.fee, settings.currency)} / Team
        </h1>
        <p className="mt-2 text-ink/75 text-sm sm:text-base">
          Choose your payment method: Pay Online via UPI QR code or Offline in Cash to an Organizing Committee member.
        </p>
      </div>

      {/* Team Info Card */}
      <div className="mt-6 surface-card p-5 sm:p-6 border-2 border-web bg-white shadow-[4px_4px_0_#071433]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-xs font-black tracking-wider text-spidey uppercase">REGISTERED TEAM</span>
            <h2 className="font-display text-2xl text-web">{team.teamName}</h2>
          </div>

          <div className="text-left sm:text-right">
            <button
              type="button"
              onClick={copyRegId}
              className="inline-flex items-center gap-1 rounded bg-ink/5 px-2.5 py-1 text-xs font-mono font-bold text-ink border border-ink/15 hover:bg-ink/10 transition"
              title="Click to copy Registration ID"
            >
              {team.registrationId} {copiedId ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            </button>
            <div className="mt-2 text-xs text-ink/65">
              <span className="flex items-center gap-1 sm:justify-end font-semibold">
                <Crown size={13} className="text-gold" /> {team.leaderName}
              </span>
              <span className="flex items-center gap-1 sm:justify-end text-ink/60">
                <Phone size={12} /> {team.phone}
              </span>
            </div>
          </div>
        </div>
      </div>

      {waiting ? (
        <div className="mt-6 space-y-6">
          <div className="surface-card p-6 sm:p-8 border-3 border-web bg-amber-50/90 text-center shadow-[6px_6px_0_#071433]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-200 text-amber-900 mb-3 border-2 border-web">
              <Clock size={28} />
            </div>
            <p className="font-display text-3xl text-web">Payment Submitted — Awaiting Verification</p>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink/80 max-w-lg mx-auto font-medium">
              Your payment submission has been received by GTMC Hackathon organizers. Once cross-verified, your team status will become <strong>CONFIRMED</strong>!
            </p>

            {/* Go to Dashboard Action Button */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={`/dashboard?regId=${team.registrationId}&email=${encodeURIComponent(team.email || "")}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border-3 border-web bg-gold px-7 py-3.5 font-ui text-sm font-black uppercase text-web shadow-[4px_4px_0_#071433] hover:bg-gold/90 hover:-translate-y-0.5 active:translate-y-0 transition"
              >
                🚀 Go to Team Dashboard →
              </Link>
            </div>
          </div>

          {/* WhatsApp Community Card */}
          <WhatsAppCard />
        </div>
      ) : (
        <>
          {/* Payment Mode Selector Tabs */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setPaymentMode("ONLINE");
                setError("");
              }}
              className={`rounded-2xl border-3 p-3.5 text-center transition font-black text-xs sm:text-sm shadow-comic flex items-center justify-center gap-2 ${
                paymentMode === "ONLINE"
                  ? "border-web bg-gold text-web"
                  : "border-web/40 bg-white text-ink/70 hover:border-web"
              }`}
            >
              💳 Online UPI Payment
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentMode("OFFLINE_CASH");
                setError("");
              }}
              className={`rounded-2xl border-3 p-3.5 text-center transition font-black text-xs sm:text-sm shadow-comic flex items-center justify-center gap-2 ${
                paymentMode === "OFFLINE_CASH"
                  ? "border-web bg-gold text-web"
                  : "border-web/40 bg-white text-ink/70 hover:border-web"
              }`}
            >
              💵 Offline Cash Payment
            </button>
          </div>

          {paymentMode === "ONLINE" ? (
            <>
              {/* Online QR Box */}
              <div className="mt-6 overflow-hidden rounded-2xl border-4 border-web bg-white p-6 text-center shadow-[6px_6px_0_#071433]">
                <img
                  src="/Payment_QR.jpeg"
                  alt="Scan QR code to pay registration fee"
                  className="mx-auto w-full max-w-xs rounded-lg border-2 border-web object-contain"
                />
                <p className="mt-3 font-ui text-xs font-black uppercase tracking-wider text-ink/70">
                  UPI QR CODE · ₹300 PER TEAM
                </p>
                <p className="mt-1 text-xs text-ink/60">
                  Pay using Any UPI App (GPay / PhonePe / Paytm / BHIM)
                </p>
              </div>

              {rejected ? (
                <div className="mt-4 rounded-lg border-2 border-rose bg-rose-50 p-4 text-sm text-rose font-bold text-center">
                  The previous payment proof was not verified. Please submit a valid 12-digit UTR or clear payment screenshot.
                </div>
              ) : null}

              {!paidClicked ? (
                <Button size="lg" className="mt-6 w-full py-3.5 text-base" onClick={() => setPaidClicked(true)}>
                  Payment Done — Submit UTR or Screenshot →
                </Button>
              ) : (
                <form
                  className="mt-6 surface-card p-6 border-2 border-web bg-white space-y-5 text-left shadow-[4px_4px_0_#071433]"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setError("");
                    
                    if (!utr.trim() && !proofFile) {
                      setError("Please enter your 12-digit UTR / Reference Number OR upload a Payment Screenshot.");
                      return;
                    }

                    setBusy(true);
                    try {
                      let uploadedUrl = "";
                      let uploadedKey = "";
                      
                      if (proofFile) {
                        const uploadResult = await uploadPaymentProof(proofFile);
                        uploadedUrl = uploadResult.url || "";
                        uploadedKey = uploadResult.key || "";
                      }

                      await submitPaymentUtr(team.id, utr.trim(), uploadedUrl, uploadedKey, "ONLINE");
                      saveTeamSession(team.id, team.registrationId);
                      setSubmitted(true);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Could not submit payment proof.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <div>
                    <h3 className="font-display text-xl text-web flex items-center gap-2">
                      <ShieldCheck size={20} className="text-spidey" /> Submit Online Payment Proof
                    </h3>
                    <p className="text-xs text-ink/65 mt-1">
                      You can submit your <strong>12-digit UTR / UPI Reference Number</strong> OR <strong>Upload Payment Screenshot Image</strong> (or both).
                    </p>
                  </div>

                  <div className="rounded-xl border-2 border-web/30 bg-cream/30 p-4">
                    <Field label="Option 1: 12-digit UTR / UPI Reference Number" error={!proofFile && error ? error : ""}>
                      <TextInput
                        value={utr}
                        onChange={(event) => {
                          setUtr(event.target.value);
                          setError("");
                        }}
                        placeholder="e.g. 423589012345"
                        minLength={6}
                      />
                    </Field>
                  </div>

                  <div className="rounded-xl border-2 border-web/30 bg-cream/30 p-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/75 mb-2 flex items-center gap-1.5">
                      <ImageIcon size={15} className="text-spidey" /> Option 2: Upload Payment Receipt Screenshot
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-xs text-ink file:mr-3 file:rounded-md file:border-2 file:border-web file:bg-spidey file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-spidey/90 cursor-pointer"
                    />

                    {proofPreview ? (
                      <div className="mt-3 relative inline-block border-2 border-web rounded-lg overflow-hidden bg-black/5 p-1">
                        <img src={proofPreview} alt="Uploaded receipt preview" className="h-32 w-auto object-contain rounded" />
                        <button
                          type="button"
                          onClick={() => {
                            setProofFile(null);
                            setProofPreview("");
                          }}
                          className="absolute top-2 right-2 bg-rose-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {error ? (
                    <div className="rounded-lg border-2 border-rose bg-rose-50 p-3 text-xs text-rose font-bold">
                      {error}
                    </div>
                  ) : null}

                  <Button type="submit" size="lg" className="w-full" disabled={busy}>
                    {busy ? "Submitting Payment Proof..." : "Submit Online Proof & Complete →"}
                  </Button>
                </form>
              )}
            </>
          ) : (
            /* OFFLINE CASH PAYMENT FORM */
            <form
              className="mt-6 surface-card p-6 border-3 border-web bg-white space-y-5 text-left shadow-[6px_6px_0_#071433]"
              onSubmit={async (event) => {
                event.preventDefault();
                setError("");

                if (!collectorName.trim()) {
                  setError("Please enter the name of the person / committee member who collected your cash fee.");
                  return;
                }

                if (!receiptNo.trim()) {
                  setError("Please enter the Cash Receipt / Slip Number issued by the organizer.");
                  return;
                }

                setBusy(true);
                try {
                  let uploadedUrl = "";
                  let uploadedKey = "";

                  if (proofFile) {
                    const uploadResult = await uploadPaymentProof(proofFile);
                    uploadedUrl = uploadResult.url || "";
                    uploadedKey = uploadResult.key || "";
                  }

                  await submitPaymentUtr(
                    team.id,
                    `OFFLINE-${receiptNo.trim().toUpperCase()}`,
                    uploadedUrl,
                    uploadedKey,
                    "OFFLINE_CASH",
                    collectorName.trim(),
                    receiptNo.trim().toUpperCase()
                  );

                  saveTeamSession(team.id, team.registrationId);
                  setSubmitted(true);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not submit offline cash payment details.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div>
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-800 border border-amber-300">
                  💵 IN-PERSON CASH PAYMENT
                </span>
                <h3 className="mt-2 font-display text-2xl text-web">
                  Submit Offline Cash Payment Details
                </h3>
                <p className="text-xs text-ink/75 mt-1 leading-relaxed">
                  If your team paid ₹300 in cash directly to an official committee member, enter the details below. Organizers will cross-check with the cash register to confirm your registration.
                </p>
              </div>

              <div className="space-y-4">
                <Field label="Who collected your cash fee? *" error={!collectorName.trim() && error ? error : ""}>
                  <TextInput
                    placeholder="Enter name of person / committee member who collected cash"
                    value={collectorName}
                    onChange={(e) => {
                      setCollectorName(e.target.value);
                      setError("");
                    }}
                    required
                  />
                  <p className="text-[11px] text-ink/50 mt-1">
                    Enter the full name of the organizing committee member or person to whom you paid the cash fee.
                  </p>
                </Field>

                <Field label="Cash Receipt / Slip Number *" error={!receiptNo.trim() && error ? error : ""}>
                  <TextInput
                    placeholder="e.g. REC-1024 or CASH-042"
                    value={receiptNo}
                    onChange={(e) => {
                      setReceiptNo(e.target.value);
                      setError("");
                    }}
                    required
                  />
                  <p className="text-[11px] text-ink/50 mt-1">
                    Enter the receipt slip number or token code provided to you when paying cash.
                  </p>
                </Field>

                {/* Optional Slip Photo Upload */}
                <div className="rounded-xl border-2 border-web/30 bg-cream/30 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/75 mb-2 flex items-center gap-1.5">
                    <ImageIcon size={15} className="text-spidey" /> Upload Photo of Physical Cash Slip (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-xs text-ink file:mr-3 file:rounded-md file:border-2 file:border-web file:bg-spidey file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-spidey/90 cursor-pointer"
                  />

                  {proofPreview ? (
                    <div className="mt-3 relative inline-block border-2 border-web rounded-lg overflow-hidden bg-black/5 p-1">
                      <img src={proofPreview} alt="Receipt preview" className="h-32 w-auto object-contain rounded" />
                      <button
                        type="button"
                        onClick={() => {
                          setProofFile(null);
                          setProofPreview("");
                        }}
                        className="absolute top-2 right-2 bg-rose-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border-2 border-rose bg-rose-50 p-3 text-xs text-rose font-bold">
                  {error}
                </div>
              ) : null}

              <Button type="submit" size="lg" className="w-full bg-web text-white" disabled={busy}>
                {busy ? "Submitting Cash Details..." : "Submit Cash Receipt Details →"}
              </Button>
            </form>
          )}

          {/* WhatsApp Card Notice */}
          <div className="mt-8">
            <WhatsAppCard />
          </div>
        </>
      )}

      <div className="mt-6 text-center">
        <Link to="/register" className="inline-block text-xs font-bold text-ink/60 hover:text-spidey transition">
          ← Return to Team Registration
        </Link>
      </div>
    </div>
  );
}

