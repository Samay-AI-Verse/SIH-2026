import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { PageLoader } from "./ui/Skeleton";

export function ProtectedRoute() {
  const { isAdmin, loading, configured } = useAuth();
  if (!configured) return <Navigate to="/admin/login" replace />;
  if (loading) return <PageLoader label="Checking admin access..." />;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
