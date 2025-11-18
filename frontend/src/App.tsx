import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { authAPI } from './services/api';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CallsPage from './pages/CallsPage';
import CalendarPage from './pages/CalendarPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TeamPage from './pages/TeamPage';
import BillingPage from './pages/BillingPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import AgentSettingsPage from './pages/AgentSettingsPage';
import OnboardingPage from './pages/Onboarding/OnboardingPage';
import WelcomePage from './pages/WelcomePage';
import PricingPage from './pages/PricingPage';
import PaymentPage from './pages/PaymentPage';

// Layout
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('access_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, [setUser, setLoading]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Pricing & Payment Flow - Protected */}
        <Route
          path="/pricing"
          element={
            <ProtectedRoute>
              <PricingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />

        {/* Onboarding - Protected but outside main layout */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Welcome Page - After agent creation */}
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <WelcomePage />
            </ProtectedRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calls" element={<CallsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="agent-settings" element={<AgentSettingsPage />} />
          <Route path="help" element={<HelpPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
