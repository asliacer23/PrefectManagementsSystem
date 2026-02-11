import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";

import AuthPage from "@/features/auth/pages/AuthPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import DashboardRouter from "@/features/dashboard/pages/DashboardRouter";
import UserManagement from "@/features/users/pages/UserManagement";
import TrainingPage from "@/features/training/pages/TrainingPage";
import { ConversationsPage } from "@/features/conversations/pages";
import ComplaintsPage from "@/features/complaints/pages/ComplaintsPage";
import IncidentsPage from "@/features/incidents/pages/IncidentsPage";
import RecruitmentPage from "@/features/recruitment/pages/RecruitmentPage";
import DutiesPage from "@/features/duties/pages/DutiesPage";
import GateLogsPage from "@/features/gate-logs/pages/GateLogsPage";
import EventsPage from "@/features/events/pages/EventsPage";
import AttendancePage from "@/features/attendance/pages/AttendancePage";
import EvaluationsPage from "@/features/evaluations/pages/EvaluationsPage";
import ReportsPage from "@/features/reports/pages/ReportsPage";
import WeeklyReportsPage from "@/features/reports/pages/WeeklyReportsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { hasRole, loading } = useAuth();
  if (loading) return null;
  if (!hasRole('admin')) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><AdminRoute><UserManagement /></AdminRoute></ProtectedRoute>} />
              <Route path="/training" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
              <Route path="/conversations" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
              <Route path="/complaints" element={<ProtectedRoute><ComplaintsPage /></ProtectedRoute>} />
              <Route path="/incidents" element={<ProtectedRoute><IncidentsPage /></ProtectedRoute>} />
              <Route path="/recruitment" element={<ProtectedRoute><RecruitmentPage /></ProtectedRoute>} />
              <Route path="/duties" element={<ProtectedRoute><DutiesPage /></ProtectedRoute>} />
              <Route path="/gate-logs" element={<ProtectedRoute><GateLogsPage /></ProtectedRoute>} />
              <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
              <Route path="/evaluations" element={<ProtectedRoute><EvaluationsPage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
              <Route path="/weekly-reports" element={<ProtectedRoute><WeeklyReportsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
