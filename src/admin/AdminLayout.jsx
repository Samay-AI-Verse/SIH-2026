import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { BadgeCheck, CreditCard, LayoutDashboard, LogOut, Puzzle, Settings, Shield, Users, Wallet, IndianRupee, GraduationCap } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ColorMesh } from "../components/ColorMesh";
import { WebOverlay } from "../components/SpideyArt";
import { SihLogo } from "../components/ui/SihLogo";
import { cn } from "../utils/cn";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/registrations", label: "Registrations", icon: Shield },
  { to: "/admin/teams", label: "Teams & Roster", icon: Users },
  { to: "/admin/students", label: "Student Explorer", icon: GraduationCap },
  { to: "/admin/budget", label: "Budget & Ledger", icon: IndianRupee },
  { to: "/admin/payments", label: "Payment Verification", icon: Wallet },
  { to: "/admin/problems", label: "Problem Statements", icon: Puzzle },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  return (
    <div className="relative min-h-svh text-ink lg:grid lg:grid-cols-[270px_1fr]">
      <ColorMesh />
      <aside className="relative overflow-hidden web-bg p-5 text-white lg:min-h-svh">
        <WebOverlay />
        <Link to="/admin" className="relative block">
          <SihLogo variant="dark" size="md" />
        </Link>
        <p className="relative mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-gold">GTMC Nanded Organizer Portal</p>
        <nav className="relative mt-8 grid grid-cols-2 gap-2 lg:grid-cols-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide transition",
                  isActive ? "bg-gold text-ink shadow-[4px_4px_0_#e11d2e]" : "text-white/75 hover:bg-white/10 hover:text-gold"
                )
              }
            >
              <link.icon size={16} />
              {link.label}
            </NavLink>
          ))}
          <button
            className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-bold uppercase text-white/70 hover:bg-spidey/30"
            onClick={async () => {
              await signOut();
              navigate("/admin/login");
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </nav>
      </aside>
      <div className="min-w-0 p-4 md:p-8">
        <Outlet />
      </div>
    </div>
  );
}
