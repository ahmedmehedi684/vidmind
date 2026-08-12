import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
import { ThemeProvider } from "@/components/ThemeProvider";
import UserLayout from "@/components/UserLayout";
import LandingPage from "./pages/LandingPage.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import History from "./pages/History.tsx";
import Settings from "./pages/Settings.tsx";
import Auth from "./pages/Auth.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import Channels from "./pages/Channels.tsx";
import Profile from "./pages/Profile.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import UserNotes from "./pages/UserNotes.tsx";
import UserLinks from "./pages/UserLinks.tsx";
import UserBooks from "./pages/UserBooks.tsx";
import UserSites from "./pages/UserSites.tsx";

import UserTasks from "./pages/UserTasks.tsx";
import UserGoals from "./pages/UserGoals.tsx";
import UserMoney from "./pages/UserMoney.tsx";
import UserSubscription from "./pages/UserSubscription.tsx";
import UserSupport from "./pages/UserSupport.tsx";
import AffiliateDashboard from "./pages/AffiliateDashboard.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsOfService from "./pages/TermsOfService.tsx";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <UserLayout>{children}</UserLayout>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  if (authLoading || adminLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user || !isAdmin) return <Navigate to="/admin-login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/affiliate" element={<AffiliateDashboard />} />

              {/* Protected user routes */}
              <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/app-summarizer" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/app-history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/app-settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/app-channels" element={<ProtectedRoute><Channels /></ProtectedRoute>} />
              <Route path="/app-profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/app-notes" element={<ProtectedRoute><UserNotes /></ProtectedRoute>} />
              <Route path="/app-links" element={<ProtectedRoute><UserLinks /></ProtectedRoute>} />
              <Route path="/app-books" element={<ProtectedRoute><UserBooks /></ProtectedRoute>} />

              <Route path="/app-tasks" element={<ProtectedRoute><UserTasks /></ProtectedRoute>} />
              <Route path="/app-goals" element={<ProtectedRoute><UserGoals /></ProtectedRoute>} />
              <Route path="/app-money" element={<ProtectedRoute><UserMoney /></ProtectedRoute>} />
              <Route path="/app-subscription" element={<ProtectedRoute><UserSubscription /></ProtectedRoute>} />
              <Route path="/app-support" element={<ProtectedRoute><UserSupport /></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-tasks" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-goals" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-money" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-summarize" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-users" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-summaries" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-history" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-channels" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-notes" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-showcase" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-profile" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-settings" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-payments" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-subscription-plans" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-payment-methods" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-support" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-team" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-analytics" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-user-mgmt" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-notifications" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-coupons" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin-affiliates" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

              {/* Legacy redirects */}
              <Route path="/dashboard" element={<Navigate to="/app" replace />} />
              <Route path="/notes" element={<Navigate to="/app-notes" replace />} />
              <Route path="/channels" element={<Navigate to="/app-channels" replace />} />
              <Route path="/history" element={<Navigate to="/app-history" replace />} />
              <Route path="/settings" element={<Navigate to="/app-settings" replace />} />
              <Route path="/profile" element={<Navigate to="/app-profile" replace />} />
              <Route path="/admin/login" element={<Navigate to="/admin-login" replace />} />
              <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
