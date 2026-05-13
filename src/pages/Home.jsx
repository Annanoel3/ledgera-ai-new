import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      setIsAuthenticated(authed);
      setLoading(false);
      if (authed) {
        window.location.href = "/Dashboard";
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68eaceb5d712c1b62b8bd4d5/83975f5f2_Untitleddesign9.png" 
            alt="Ledgera AI"
            className="w-16 h-16 mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Ledgera AI</h1>
          <p className="text-lg text-slate-600">Smart bookkeeping for your business</p>
        </div>

        <p className="text-slate-700 leading-relaxed">
          Manage your projects, track income and expenses, sync with Google Calendar, and get AI-powered financial insights.
        </p>

        <Button
          onClick={() => base44.auth.redirectToLogin()}
          className="w-full bg-[#22A699] hover:bg-[#1d8d82] text-white py-3 rounded-lg font-medium text-lg"
        >
          Sign In
        </Button>

        <div className="pt-4 border-t border-slate-300">
          <Link to="/PrivacyPolicy" className="text-sm text-[#22A699] hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}