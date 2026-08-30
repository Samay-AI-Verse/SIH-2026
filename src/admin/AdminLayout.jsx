import { useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { BadgeCheck, LayoutDashboard, LogOut, Puzzle, Settings, Shield, Wallet, IndianRupee, GraduationCap, Menu, X, Trophy, ClipboardCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ColorMesh } from "../components/ColorMesh";
import { WebOverlay } from "../components/SpideyArt";
import { SihLogo } from "../components/ui/SihLogo";
import { cn } from "../utils/cn";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/registrations", label: "Registrations & Teams", icon: Shield },
  { to: "/admin/selections", label: "Selections & Approvals", icon: BadgeCheck },
  { to: "/admin/final-teams", label: "Final Approved Teams 🏆", icon: Trophy },
  { to: "/admin/attendance", label: "Entry & Attendance Sheet 📄", icon: ClipboardCheck },
  { to: "/admin/students", label: "Student Explorer", icon: GraduationCap },
  { to: "/admin/budget", label: "Budget & Ledger", icon: IndianRupee },
  { to: "/admin/payments", label: "Payment Verification", icon: Wallet },
  { to: "/admin/problems", label: "Problem Statements", icon: Puzzle },
  { to: "/admin/security", label: "Security & Admin Audit 🔒", icon: Shield },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];


export function AdminLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-svh text-ink lg:grid lg:grid-cols-[270px_1fr] bg-slate-100/95">
      <ColorMesh />

      {/* Top Navigation Bar for Small Screens (Mobile / Tablet) */}
      <header className="relative z-30 flex items-center justify-between overflow-hidden web-bg px-4 py-3 text-white lg:hidden">
        <WebOverlay />
        <Link to="/admin" className="relative flex items-center gap-2">
          <SihLogo variant="dark" size="sm" />
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="relative rounded-xl border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20 transition"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Slide-Over Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 web-bg p-5 text-white shadow-2xl flex flex-col justify-between overflow-y-auto">
            <WebOverlay />
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <SihLogo variant="dark" size="sm" />
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-1 text-white/70 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <nav className="mt-6 space-y-1.5">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-black uppercase tracking-wider transition",
                        isActive ? "bg-gold text-ink shadow-comic" : "text-white/80 hover:bg-white/10 hover:text-gold"
                      )
                    }
                  >
                    <link.icon size={16} />
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-white/10">
              <button
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-black uppercase tracking-wider text-white/80 hover:bg-rose-600/30 hover:text-white transition"
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await signOut();
                  navigate("/admin/login");
                }}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar (>= lg) */}
      <aside className="hidden lg:relative lg:flex lg:flex-col lg:justify-between overflow-hidden web-bg p-4 sm:p-5 text-white lg:min-h-svh border-r-2 border-web/20">
        <WebOverlay />
        <div className="relative">
          <Link to="/admin" className="flex items-center justify-center py-1 text-center w-full">
            <SihLogo variant="dark" size="lg" />
          </Link>

          <nav className="mt-3 space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-black uppercase tracking-wider transition",
                    isActive ? "bg-gold text-ink shadow-[4px_4px_0_#e11d2e]" : "text-white/75 hover:bg-white/10 hover:text-gold"
                  )
                }
              >
                <link.icon size={16} />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="relative pt-6 border-t border-white/10">
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-black uppercase tracking-wider text-white/70 hover:bg-spidey/30 hover:text-white transition"
            onClick={async () => {
              await signOut();
              navigate("/admin/login");
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="min-w-0 p-4 sm:p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}

