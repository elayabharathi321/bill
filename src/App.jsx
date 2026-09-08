import { Sparkles, ShieldCheck } from "lucide-react";
import { Route, Routes } from "react-router-dom";
import AuthForm from "./components/AuthForm";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import InfoPage from "./pages/InfoPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<AuthForm />} />
      <Route path="/register" element={<AuthForm register />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route
        path="/about"
        element={
          <InfoPage
            eyebrow="About BillPro"
            title="Built for businesses that want smarter billing."
            body="BillPro brings invoices, payments, customer follow-ups, and cash flow tracking into one focused workspace."
            icon={<Sparkles />}
          />
        }
      />
      <Route
        path="/contact"
        element={
          <InfoPage
            eyebrow="Contact information"
            title="Let's build your next billing success."
            body="Have questions about BillPro or need help with your account? Reach our team at help@ilayanetwork.in and we will help you move faster."
          />
        }
      />
      <Route
        path="/terms"
        element={
          <InfoPage
            eyebrow="Terms of service"
            title="Simple, transparent terms for using BillPro."
            body="BillPro is designed to help businesses manage billing operations responsibly. Review the terms that guide account access, billing data, and platform use."
          />
        }
      />
      <Route
        path="/privacy"
        element={
          <InfoPage
            eyebrow="Privacy"
            title="Your business data deserves careful handling."
            body="We keep privacy and operational security at the center of the BillPro experience. This page explains the information we collect and how it supports the service."
            icon={<ShieldCheck />}
          />
        }
      />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
