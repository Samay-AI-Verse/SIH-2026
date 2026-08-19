import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, LayoutDashboard, UserPlus, ShieldCheck } from "lucide-react";
import { NAV_LINKS } from "../utils/constants";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../utils/cn";
import { SihLogo } from "./ui/SihLogo";

function linkIsActive(href, pathname, hash) {
  if (href === "/problems") return pathname.startsWith("/problems");
  if (href === "/dashboard") return pathname.startsWith("/dashboard") || pathname.startsWith("/team-status");
  if (href === "/#home") return pathname === "/" && (!hash || hash === "#home");
  if (href.startsWith("/#")) return pathname === "/" && hash === href.slice(1);
  return pathname === href;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  if (location.pathname.startsWith("/admin") && location.pathname !== "/admin/login") {
    return null;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 sm:px-4 md:px-6 pt-1.5 sm:pt-2 pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto w-full max-w-6xl transition-all duration-300",
          "rounded-2xl sm:rounded-full border-2 border-web/20 bg-white/95 px-3 py-1 sm:px-4 sm:py-1 shadow-[0_6px_25px_rgba(0,0,0,0.1)] backdrop-blur-xl",
          open ? "rounded-2xl shadow-2xl" : ""
        )}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo Section */}
          <Link to="/" className="shrink-0 flex items-center">
            <SihLogo variant="light" size="md" />
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden min-w-0 items-center gap-1 xl:gap-1.5 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const active = linkIsActive(link.href, location.pathname, location.hash);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "font-ui text-[11.5px] xl:text-xs font-bold uppercase tracking-[0.1em] transition-all px-2.5 xl:px-3 py-1.5 rounded-full",
                    active
                      ? "bg-spidey/10 text-spidey border border-spidey/30 font-black shadow-xs"
                      : "text-slate-700 hover:text-spidey hover:bg-slate-100"
                  )}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden lg:flex items-center gap-1.5 font-ui text-xs font-black uppercase text-web hover:text-spidey px-2.5 py-1.5 rounded-full border-2 border-web/20 bg-gold/20 transition"
              >
                <ShieldCheck size={14} className="text-web" /> Admin
              </Link>
            )}

            {/* Dashboard Button */}
            <Link
              to="/dashboard"
              className="font-ui inline-flex items-center gap-1 sm:gap-1.5 rounded-full border-2 border-spidey/70 bg-spidey/10 px-3 sm:px-3.5 py-1.5 text-xs md:text-sm font-bold uppercase tracking-[0.08em] text-spidey transition-all hover:bg-spidey hover:text-white shadow-xs"
            >
              <LayoutDashboard size={14} className="shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            {/* Register Now Button */}
            <Link
              to="/register"
              className="font-ui inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-spidey px-3.5 sm:px-4 md:px-5 py-1.5 md:py-2 text-xs md:text-sm font-black uppercase tracking-[0.1em] text-white transition-all hover:bg-[#b51221] shadow-[0_4px_14px_rgba(225,29,46,0.35)] hover:scale-[1.02] active:scale-95"
            >
              <UserPlus size={14} className="shrink-0" />
              <span>Register</span>
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              className="rounded-full border-2 border-web/30 bg-slate-100 p-2 text-web transition hover:bg-spidey hover:text-white hover:border-spidey lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden lg:hidden pt-3 border-t-2 border-web/10 mt-3"
            >
              <div className="flex flex-col gap-1 pb-3 max-h-[60vh] overflow-y-auto">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="font-ui rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-[0.14em] text-ink hover:bg-spidey/10 hover:text-spidey transition flex items-center justify-between"
                  >
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-web/10 pb-2">
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="font-ui flex items-center justify-center gap-2 rounded-xl border-2 border-spidey bg-spidey/10 py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-spidey hover:bg-spidey hover:text-white transition"
                >
                  <LayoutDashboard size={16} /> Team Dashboard
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="font-ui flex items-center justify-center gap-2 rounded-xl bg-spidey py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-md hover:bg-[#b51221] transition"
                >
                  <UserPlus size={16} /> Register Team Now
                </Link>
                <Link
                  to="/admin/login"
                  onClick={() => setOpen(false)}
                  className="font-ui text-center text-xs font-bold text-ink/60 hover:text-spidey py-1 transition"
                >
                  Organizer / Admin Portal
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
