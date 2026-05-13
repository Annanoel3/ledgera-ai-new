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

        <div className="bg-slate-100 rounded-lg p-4 text-left space-y-3 text-sm text-slate-700">
          <div>
            <p className="font-semibold text-slate-900 mb-1">Why we need access to your data:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Google Calendar integration to sync your events with financial data</li>
              <li>Secure authentication to protect your financial information</li>
              <li>AI analysis to provide personalized financial insights</li>
            </ul>
          </div>
          <p className="text-xs text-slate-600">
            Your data is encrypted and never shared with third parties. We use it solely to improve your bookkeeping experience.
          </p>
        </div>

        <Button
          onClick={() => base44.auth.redirectToLogin()}
          className="w-full bg-[#22A699] hover:bg-[#1d8d82] text-white py-3 rounded-lg font-medium text-lg"
        >
          Sign In
        </Button>

        <div className="pt-6 border-t border-slate-300 space-y-3">
          <p className="text-xs text-slate-600">By signing in, you agree to our:</p>
          <div className="flex gap-4 justify-center text-sm">
            <Link to="/PrivacyPolicy" className="text-[#22A699] hover:underline font-medium">
              Privacy Policy
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/Terms" className="text-[#22A699] hover:underline font-medium">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}