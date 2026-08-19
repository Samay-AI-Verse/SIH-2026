import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./components/layout/PublicLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PageLoader } from "./components/ui/Skeleton";
import { Home } from "./pages/Home";
import { Register } from "./pages/Register";
import { Problems } from "./pages/Problems";
import { Privacy, Terms } from "./pages/Legal";
import { AdminLogin } from "./pages/AdminLogin";

const Payment = lazy(() => import("./pages/Payment").then((m) => ({ default: m.Payment })));
const PaymentVerify = lazy(() => import("./pages/PaymentSuccess").then((m) => ({ default: m.PaymentVerify })));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess").then((m) => ({ default: m.PaymentSuccess })));
const PaymentFailed = lazy(() => import("./pages/PaymentSuccess").then((m) => ({ default: m.PaymentFailed })));
import { ProblemDetailsPage } from "./pages/ProblemDetails";
import { TeamDashboard } from "./pages/TeamDashboard";
const AdminLayout = lazy(() => import("./admin/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const AdminRegistrations = lazy(() => import("./admin/AdminRegistrations").then((m) => ({ default: m.AdminRegistrations })));
const AdminTeams = lazy(() => import("./admin/AdminRegistrations").then((m) => ({ default: m.AdminTeams })));
const AdminPayments = lazy(() => import("./admin/AdminPayments").then((m) => ({ default: m.AdminPayments })));
const AdminDecisions = lazy(() => import("./admin/AdminDecisions").then((m) => ({ default: m.AdminDecisions })));
const AdminProblems = lazy(() => import("./admin/AdminProblems").then((m) => ({ default: m.AdminProblems })));
const AdminSelections = lazy(() => import("./admin/AdminSelections").then((m) => ({ default: m.AdminSelections })));
const AdminSettings = lazy(() => import("./admin/AdminSettings").then((m) => ({ default: m.AdminSettings })));
const AdminUsers = lazy(() => import("./admin/AdminSettings").then((m) => ({ default: m.AdminUsers })));
const AdminStudents = lazy(() => import("./admin/AdminStudents").then((m) => ({ default: m.AdminStudents })));
const AdminBudget = lazy(() => import("./admin/AdminBudget").then((m) => ({ default: m.AdminBudget })));

function FallBack() {
  return <PageLoader label="Loading..." />;
}

export default function App() {
  return (
    <Suspense fallback={<FallBack />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/problems/:problemId" element={<ProblemDetailsPage />} />
          <Route path="/login" element={<Navigate to="/register" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/payment/:teamId" element={<Payment />} />
          <Route path="/payment/verify" element={<PaymentVerify />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failed" element={<PaymentFailed />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/dashboard" element={<TeamDashboard />} />
          <Route path="/team-status" element={<TeamDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="registrations" element={<AdminRegistrations />} />
            <Route path="teams" element={<AdminTeams />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="budget" element={<AdminBudget />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="decisions" element={<AdminDecisions />} />
            <Route path="problems" element={<AdminProblems />} />
            <Route path="selections" element={<AdminSelections />} />
            <Route path="users" element={<AdminStudents />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
