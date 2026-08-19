import { Link, NavLink, Outlet } from "react-router-dom";
import { CreditCard, LayoutDashboard, LogOut, Puzzle, Star, Users, UserRound } from "lucide-react";
import { logout } from "../../firebase/auth";
import { useAuth } from "../../hooks/useAuth";
import { useTeam } from "../../hooks/useTeam";
import { ColorMesh } from "../ColorMesh";
import { WebOverlay } from "../SpideyArt";
import { SihLogo } from "../ui/SihLogo";
import { cn } from "../../utils/cn";

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/team", label: "Team", icon: Users },
  { to: "/dashboard/payment", label: "Payment", icon: CreditCard },
  { to: "/problems", label: "Problem Statements", icon: Puzzle },
  { to: "/dashboard/selection", label: "My Selection", icon: Star },
  { to: "/dashboard/profile", label: "Profile", icon: UserRound },
];

export function DashboardLayout() {
  const { profile } = useAuth();
  const { team } = useTeam();
  return (
    <div className="relative min-h-svh text-ink lg:grid lg:grid-cols-[270px_1fr]">
      <ColorMesh />
      <aside className="relative overflow-hidden web-bg p-5 text-white lg:min-h-svh">
        <WebOverlay />
        <Link to="/" className="relative block">
          <SihLogo variant="dark" size="sm" />
        </Link>
        <p className="relative mt-3 text-xs text-white/70">{team?.teamName || profile?.name || "Team dashboard"}</p>
        <nav className="relative mt-8 grid grid-cols-2 gap-2 lg:grid-cols-1" aria-label="Dashboard">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide transition",
                  isActive ? "bg-spidey text-white shadow-[4px_4px_0_#f5c518]" : "text-white/75 hover:bg-white/10 hover:text-gold"
                )
              }
            >
              <link.icon size={16} />
              {link.label}
            </NavLink>
          ))}
          <button
            className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-bold uppercase text-white/70 hover:bg-spidey/30 hover:text-gold"
            onClick={() => logout()}
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
