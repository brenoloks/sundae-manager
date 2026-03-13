import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import OwnerLayout from "@/components/layout/OwnerLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PDV from "@/pages/PDV";
import Products from "@/pages/Products";
import CashRegister from "@/pages/CashRegister";
import Sales from "@/pages/Sales";
import Reports from "@/pages/Reports";
import UsersPage from "@/pages/UsersPage";
import SettingsPage from "@/pages/SettingsPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminTenants from "@/pages/admin/AdminTenants";
import AdminPlans from "@/pages/admin/AdminPlans";
import AdminSubscriptions from "@/pages/admin/AdminSubscriptions";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminStores from "@/pages/admin/AdminStores";
import SetupAdmin from "@/pages/SetupAdmin";
import OwnerDashboard from "@/pages/owner/OwnerDashboard";
import OwnerStores from "@/pages/owner/OwnerStores";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />

            {/* Tenant management routes */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pdv" element={<PDV />} />
              <Route path="/products" element={<Products />} />
              <Route path="/cash-register" element={<CashRegister />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Admin SaaS routes */}
            <Route element={<ProtectedRoute requiredRole="super_admin"><AdminLayout /></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/tenants" element={<AdminTenants />} />
              <Route path="/admin/stores" element={<AdminStores />} />
              <Route path="/admin/plans" element={<AdminPlans />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>

            {/* Owner routes */}
            <Route element={<ProtectedRoute requiredRole="owner"><OwnerLayout /></ProtectedRoute>}>
              <Route path="/owner" element={<OwnerDashboard />} />
              <Route path="/owner/stores" element={<OwnerStores />} />
            </Route>

            <Route path="/setup" element={<SetupAdmin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
