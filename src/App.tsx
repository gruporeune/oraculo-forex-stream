import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminWithdrawalsPage from "./pages/AdminWithdrawalsPage";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import UsersAdminProtectedRoute from "./components/UsersAdminProtectedRoute";
import AdminLoginPage from "./pages/AdminLoginPage";
import UsersAdminLoginPage from "./pages/UsersAdminLoginPage";
import UsersAdminPage from "./pages/UsersAdminPage";

const queryClient = new QueryClient();

// MAINTENANCE MODE - Only admin routes are accessible
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/withdrawals" element={
            <AdminProtectedRoute>
              <AdminWithdrawalsPage />
            </AdminProtectedRoute>
          } />
          <Route path="/users-admin/login" element={<UsersAdminLoginPage />} />
          <Route path="/users-admin" element={
            <UsersAdminProtectedRoute>
              <UsersAdminPage />
            </UsersAdminProtectedRoute>
          } />
          {/* All other routes redirect to maintenance page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
