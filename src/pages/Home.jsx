import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate("/Dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  if (isLoadingAuth || isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col p-4">
      {/* Main centered content */}
      <div className="flex-1 flex items-center justify-center">
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

          <div className="bg-slate-100 rounded-lg p-4 text-left space-y-4 text-sm text-slate-700">
            <div>
              <p className="font-semibold text-slate-900 mb-2">How Ledgera AI uses your Google account:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#22A699] font-bold mt-0.5">•</span>
                  <span><strong>Google Sign-In:</strong> We use Google OAuth solely to securely authenticate your identity. We do not access your Gmail, Google Drive, or any other Google services through sign-in.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#22A699] font-bold mt-0.5">•</span>
                  <span><strong>Google Calendar (optional):</strong> If you choose to connect Google Calendar, we request read/write access to import your existing events into Ledgera and export Ledgera events back to your Google Calendar. This connection is entirely optional and can be disconnected at any time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#22A699] font-bold mt-0.5">•</span>
                  <span><strong>No data sharing:</strong> We never sell, share, or use your Google data for advertising. Your data is encrypted and used solely to power your bookkeeping experience.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#22A699] font-bold mt-0.5">•</span>
                  <span><strong>Revoke access anytime:</strong> You can disconnect Google Calendar or revoke app permissions at any time from your Google account settings or within Ledgera AI settings.</span>
                </li>
              </ul>
            </div>
            <p className="text-xs text-slate-500 border-t border-slate-200 pt-3">
              Ledgera AI's use of Google user data complies with the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#22A699] hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
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
              <a href="/PrivacyPolicy" className="text-[#22A699] hover:underline font-medium">
                Privacy Policy
              </a>
              <span className="text-slate-300">•</span>
              <a href="/Terms" className="text-[#22A699] hover:underline font-medium">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-500">
        <span>🌐 English</span>
        <div className="flex gap-4">
          <a href="/PrivacyPolicy" className="hover:underline">Privacy</a>
          <a href="/Terms" className="hover:underline">Terms</a>
        </div>
      </div>
    </div>
  );
}