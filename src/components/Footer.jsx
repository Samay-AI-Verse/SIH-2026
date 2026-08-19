import { Globe, Phone, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { WebOverlay } from "./SpideyArt";
import { SihLogo } from "./ui/SihLogo";

const groups = [
  {
    title: "Platform",
    links: [
      { to: "/#about", label: "About" },
      { to: "/problems", label: "Problems" },
      { to: "/#timeline", label: "Timeline" },
      { to: "/register", label: "Register Team" },
    ],
  },
  {
    title: "Support",
    links: [
      { to: "/#faq", label: "FAQ" },
      { to: "/#contact", label: "Contact" },
      { to: "/privacy", label: "Privacy" },
      { to: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden web-bg px-4 py-12 text-white md:px-6">
      <WebOverlay />
      <div className="relative mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/">
            <SihLogo variant="dark" size="lg" />
          </Link>
          <p className="mt-4 max-w-sm text-white/80">Code. Collaborate. Create Impact.</p>
          <div className="mt-5 flex gap-3 text-gold">
            <a href="https://x.com" aria-label="SIH on X"><Share2 /></a>
            <a href="https://linkedin.com" aria-label="SIH on LinkedIn"><Globe /></a>
            <a href="tel:9511841275" aria-label="Call organizers"><Phone /></a>
          </div>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <p className="font-display text-xl text-gold">{group.title}</p>
            <div className="mt-4 space-y-2">
              {group.links.map((link) => (
                <Link key={link.label} to={link.to} className="block text-sm text-white/85 hover:text-gold">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="relative mx-auto mt-10 flex max-w-7xl items-center justify-between border-t border-white/10 pt-6 text-[11px] text-white/45">
        <p>© 2026 GTMC Nanded · SIH 2026</p>
        <Link to="/admin/login" className="font-ui font-bold uppercase tracking-[0.18em] hover:text-gold">
          Admin
        </Link>
      </div>
    </footer>
  );
}
