import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, ExternalLink, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { WebOverlay } from "./SpideyArt";
import { WHATSAPP_GROUP_URL } from "../utils/constants";

const ORGANIZERS = [
  {
    name: "Samay Powade",
    role: "Organizer · SIH 2026",
    phone: "9764096358",
    formattedPhone: "+91 97640 96358",
    whatsappUrl: "https://wa.me/919764096358?text=Hello%20Samay,%20I%20have%20a%20query%20regarding%20SIH%202026%20GTMC",
    badge: "Organizer",
    avatarBg: "bg-spidey text-white",
  },
  {
    name: "Onkar Nagargoje",
    role: "Organizer · SIH 2026",
    phone: "9511841275",
    formattedPhone: "+91 95118 41275",
    whatsappUrl: "https://wa.me/919511841275?text=Hello%20Onkar,%20I%20have%20a%20query%20regarding%20SIH%202026%20GTMC",
    badge: "Organizer",
    avatarBg: "bg-[#128c7e] text-white",
  },
];

export function Contact() {
  const [copiedNumber, setCopiedNumber] = useState("");

  function copyPhone(phone) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(phone);
      setCopiedNumber(phone);
      setTimeout(() => setCopiedNumber(""), 2000);
    }
  }

  return (
    <section id="contact" className="relative overflow-hidden web-bg px-4 py-20 text-white md:px-6">
      <WebOverlay />
      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-gold bg-gold/20 px-3.5 py-1 text-xs font-black tracking-widest text-gold uppercase">
            <Sparkles size={14} /> INSTANT ORGANIZER SUPPORT
          </div>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl comic-pop text-white">
            Connect With Organizers
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed">
            Need help with team registration, problem statement selection, or venue details? Chat directly with our student organizers on WhatsApp or give a quick call!
          </p>
        </div>

        {/* Organizer Cards Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {ORGANIZERS.map((org) => (
            <div
              key={org.phone}
              className="relative overflow-hidden rounded-2xl border-4 border-[#071433] bg-white p-6 text-ink shadow-[8px_8px_0_#071433] transition hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-2xl border-2 border-[#071433] shadow-[2px_2px_0_#071433] ${org.avatarBg}`}>
                    {org.name.charAt(0)}
                  </div>
                  <div>
                    <span className="rounded-full bg-gold/40 border border-[#071433] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-web">
                      {org.badge}
                    </span>
                    <h3 className="mt-1 font-display text-2xl text-web">{org.name}</h3>
                    <p className="text-xs text-ink/65 font-medium">{org.role}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copyPhone(org.phone)}
                  title="Copy contact number"
                  className="inline-flex items-center gap-1 rounded-lg border border-ink/20 bg-ink/5 px-2.5 py-1 text-xs font-mono font-bold text-ink hover:bg-ink/10 transition"
                >
                  {copiedNumber === org.phone ? (
                    <>
                      <Check size={13} className="text-emerald-700" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copy
                    </>
                  )}
                </button>
              </div>

              {/* Phone & Status bar */}
              <div className="mt-5 rounded-xl border-2 border-dashed border-ink/20 bg-cream/60 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-spidey" />
                  <span className="font-mono text-sm sm:text-base font-black text-web tracking-wide">
                    {org.formattedPhone}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Available on WhatsApp
                </span>
              </div>

              {/* Action CTA Buttons */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <a
                  href={org.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shine inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#071433] bg-[#25D366] px-4 py-3 text-xs font-black uppercase tracking-wider text-[#071433] shadow-[3px_3px_0_#071433] hover:brightness-105 active:scale-95 transition"
                >
                  <MessageCircle size={17} className="fill-[#071433] stroke-[#25D366]" /> Chat on WhatsApp
                </a>

                <a
                  href={`tel:${org.phone}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#071433] bg-gold px-4 py-3 text-xs font-black uppercase tracking-wider text-web shadow-[3px_3px_0_#071433] hover:brightness-105 active:scale-95 transition"
                >
                  <Phone size={15} /> Direct Call
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Group Community Banner & Location/Email Strip */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Official WhatsApp Community Card */}
          <div className="md:col-span-2 rounded-2xl border-4 border-[#071433] bg-gradient-to-r from-[#0c8a44] to-[#128c7e] p-6 text-white shadow-[6px_6px_0_#071433] flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-0.5 text-xs font-bold text-emerald-200">
                <MessageCircle size={14} /> Official Hackathon Community
              </div>
              <h3 className="mt-2 font-display text-2xl sm:text-3xl text-white">
                SIH 2026 Participants WhatsApp Group
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-white/85">
                Join all team leaders and registered students for live problem statement lock alerts and mentor discussions.
              </p>
            </div>

            <div className="mt-5">
              <a
                href={WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shine inline-flex items-center gap-2 rounded-xl border-2 border-[#071433] bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#071433] shadow-[3px_3px_0_#071433] hover:bg-emerald-50 transition"
              >
                Join Official Community Group <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Email & Venue Details */}
          <div className="rounded-2xl border-4 border-[#071433] bg-white p-6 text-ink shadow-[6px_6px_0_#071433] flex flex-col justify-between">
            <div className="space-y-4 text-xs">
              <div>
                <p className="font-bold text-ink/50 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={14} className="text-spidey" /> Official Email
                </p>
                <a
                  href="mailto:sih@gtmcnanded.in"
                  className="mt-1 font-bold text-sm text-web hover:underline block"
                >
                  sih@gtmcnanded.in
                </a>
              </div>

              <div>
                <p className="font-bold text-ink/50 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} className="text-spidey" /> Venue Location
                </p>
                <p className="mt-1 text-ink/75 font-medium leading-relaxed">
                  Gramin Technical and Management Campus (GTMC), Vishnupuri, Nanded, Maharashtra
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-[11px] text-ink/50">
              <span>Host Institute</span>
              <span className="font-bold text-spidey">GTMC Nanded</span>
            </div>
          </div>
        </div>

        {/* Clean Bottom Copyright & Admin Access */}
        <div className="mt-12 flex flex-wrap items-center justify-between border-t border-white/15 pt-6 text-xs text-white/60">
          <p>© 2026 Smart India Hackathon · GTMC Nanded. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-gold transition">Privacy</Link>
            <Link to="/terms" className="hover:text-gold transition">Terms</Link>
            <Link to="/admin/login" className="font-bold text-gold hover:underline">
              Organizer Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

