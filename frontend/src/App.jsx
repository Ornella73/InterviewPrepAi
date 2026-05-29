import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ui/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import OnboardingPage from "./pages/OnboardingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import CVPage from "./pages/CVPage";
import LetterPage from "./pages/LetterPage";
import InterviewPage from "./pages/InterviewPage";
import PracticalPage from "./pages/PracticalPage";
import HistoryPage from "./pages/HistoryPage";
import BillingSuccessPage from "./pages/BillingSuccessPage";
import BillingCancelPage from "./pages/BillingCancelPage";
import AdminPage from "./pages/AdminPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<OnboardingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="cv" element={<CVPage />} />
        <Route path="letter" element={<LetterPage />} />
        <Route path="interview" element={<InterviewPage />} />
        <Route path="practical" element={<PracticalPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="billing/success" element={<BillingSuccessPage />} />
        <Route path="billing/cancel" element={<BillingCancelPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
