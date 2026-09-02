import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./components/layout/PublicLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PageLoader } from "./components/ui/Skeleton";
import { Home } from "./pages/Home";
import { Register } from "./pages/Register";
import { Problems } from "./pages/Problems";
import { Privacy, Terms } from "./pages/Legal";
import { Login } from "./pages/Login";
import { AdminLogin } from "./pages/AdminLogin";

import { ProblemDetailsPage } from "./pages/ProblemDetails";
import { TeamDashboard } from "./pages/TeamDashboard";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminDashboard } from "./admin/AdminDashboard";
import { AdminRegistrations, AdminTeams } from "./admin/AdminRegistrations";
import { AdminPayments } from "./admin/AdminPayments";
import { AdminDecisions } from "./admin/AdminDecisions";
import { AdminProblems } from "./admin/AdminProblems";
import { AdminSelections } from "./admin/AdminSelections";
import { AdminSettings, AdminUsers } from "./admin/AdminSettings";
import { AdminStudents } from "./admin/AdminStudents";
import { AdminBudget } from "./admin/AdminBudget";
import { AdminFinalTeams } from "./admin/AdminFinalTeams";
import { AdminSecurity } from "./admin/AdminSecurity";
import { AdminAttendanceSheet } from "./admin/AdminAttendanceSheet";
import { AdminEvaluationSheets } from "./admin/AdminEvaluationSheets";
import { AdminCheckinDesk } from "./admin/AdminCheckinDesk";
import { AdminSeatingAndPlacards } from "./admin/AdminSeatingAndPlacards";
import { AdminTimeline } from "./admin/AdminTimeline";
import { AdminCertificates } from "./admin/AdminCertificates";


const Payment = lazy(() => import("./pages/Payment").then((m) => ({ default: m.Payment })));
const PaymentVerify = lazy(() => import("./pages/PaymentSuccess").then((m) => ({ default: m.PaymentVerify })));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess").then((m) => ({ default: m.PaymentSuccess })));
const PaymentFailed = lazy(() => import("./pages/PaymentSuccess").then((m) => ({ default: m.PaymentFailed })));


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
          <Route path="/login" element={<Login />} />
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
            <Route path="timeline" element={<AdminTimeline />} />
            <Route path="evaluation" element={<AdminEvaluationSheets />} />
            <Route path="eval" element={<AdminEvaluationSheets />} />
            <Route path="scores" element={<AdminEvaluationSheets />} />
            <Route path="checkin" element={<AdminCheckinDesk />} />
            <Route path="desk" element={<AdminCheckinDesk />} />
            <Route path="seating" element={<AdminSeatingAndPlacards />} />
            <Route path="tables" element={<AdminSeatingAndPlacards />} />
            <Route path="registrations" element={<AdminRegistrations />} />
            <Route path="teams" element={<AdminTeams />} />
            <Route path="final-teams" element={<AdminFinalTeams />} />
            <Route path="certificates" element={<AdminCertificates />} />
            <Route path="certs" element={<AdminCertificates />} />
            <Route path="attendance" element={<AdminAttendanceSheet />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="budget" element={<AdminBudget />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="decisions" element={<AdminDecisions />} />
            <Route path="problems" element={<AdminProblems />} />
            <Route path="selections" element={<AdminSelections />} />
            <Route path="users" element={<AdminStudents />} />
            <Route path="security" element={<AdminSecurity />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

