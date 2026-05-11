import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, AlertTriangle, FileText } from "lucide-react";
import { useNavigate, Link } from "react-router-dom"; // Added Link import
import { createPageUrl } from "@/utils";

export default function Terms() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return null;
      }
      return await base44.auth.me();
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user,
  });

  return (
    <div className="p-6 md:p-8 min-h-screen" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Settings"))}
          className="mb-4 gap-2"
          style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </Button>

        <h1 className="text-3xl font-bold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
          Terms & Privacy Policy
        </h1>
        <p className="mb-8" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Important Disclaimer */}
        <Card className="mb-6" style={{ 
          backgroundColor: profile?.darkMode ? '#1f2937' : '#fff3cd',
          border: `1px solid ${profile?.darkMode ? '#f59e0b' : '#ffc107'}`
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: profile?.darkMode ? '#fbbf24' : '#856404' }}>
              <AlertTriangle className="w-5 h-5" />
              Important Financial Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3" style={{ color: profile?.darkMode ? '#fde68a' : '#856404' }}>
              <strong>Ledgera AI is NOT a substitute for professional financial advice.</strong>
            </p>
            <p className="mb-2" style={{ color: profile?.darkMode ? '#fde68a' : '#856404' }}>
              While Ledgera AI is an advanced AI-powered bookkeeping tool designed to help you track income, expenses, and generate financial reports, it does not provide personalized financial, accounting, tax, or legal advice.
            </p>
            <p className="mb-2" style={{ color: profile?.darkMode ? '#fde68a' : '#856404' }}>
              You should always consult with a qualified Certified Public Accountant (CPA), tax professional, or financial advisor for matters specific to your situation, especially for:
            </p>
            <ul className="list-disc list-inside mb-2 space-y-1" style={{ color: profile?.darkMode ? '#fde68a' : '#856404' }}>
              <li>Tax filing and tax strategy</li>
              <li>Business structure decisions</li>
              <li>Complex financial situations</li>
              <li>Legal compliance matters</li>
              <li>Investment decisions</li>
            </ul>
            <p style={{ color: profile?.darkMode ? '#fde68a' : '#856404' }}>
              Ledgera AI is a tool of the future—built to make bookkeeping easier, faster, and more accessible for freelancers and small business owners. Use it to stay organized, but always verify important financial decisions with a licensed professional.
            </p>
          </CardContent>
        </Card>

        {/* Privacy Policy */}
        <Card className="mb-6" style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
              <Shield className="w-5 h-5" />
              Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                1. Your Data is Private and Secure
              </h3>
              <p className="mb-2" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                <strong>Your financial data belongs to you and only you.</strong> All information you enter into Ledgera AI—including income, expenses, projects, and uploaded documents—is:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-2" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                <li><strong>Visible only to you</strong> - No one else, including our team, can access your financial data</li>
                <li><strong>Encrypted at rest and in transit</strong> - Industry-standard encryption protects your data</li>
                <li><strong>Stored securely</strong> - Your data is protected with enterprise-grade security measures</li>
                <li><strong>Never sold or shared for marketing</strong> - We will never sell or share your financial information</li>
              </ul>
              <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                We collect basic account information (name, email) solely to provide you with the service.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                2. How We Use Your Information
              </h3>
              <p className="mb-2" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                We use your information only to:
              </p>
              <ul className="list-disc list-inside space-y-1" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                <li>Provide and maintain the Ledgera AI service</li>
                <li>Generate your personal financial reports and insights</li>
                <li>Respond to your support requests</li>
                <li>Detect and prevent security threats or fraud</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                3. Data Sharing
              </h3>
              <p className="mb-2" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                <strong>We do not sell or share your personal or financial information.</strong> We may only disclose your information:
              </p>
              <ul className="list-disc list-inside space-y-1" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                <li>When required by law (e.g., court order, subpoena)</li>
                <li>To protect our legal rights or prevent fraud</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                4. Your Rights
              </h3>
              <p className="mb-2" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                You have complete control over your data:
              </p>
              <ul className="list-disc list-inside space-y-1" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                <li>Access and export all your data at any time</li>
                <li>Correct or update your information</li>
                <li>Delete your account and all associated data permanently</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                5. Data Retention
              </h3>
              <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                Your data is retained for as long as you have an active account. When you delete your account, all your data is permanently removed from our systems within 30 days.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                6. Third-Party Services
              </h3>
              <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                We use OpenAI to power our AI assistant. Your conversations are processed securely, and OpenAI does not use your data to train their models. We also use secure cloud storage providers that comply with industry security standards.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                7. Children's Privacy
              </h3>
              <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                Ledgera AI is not intended for users under 18 years of age. We do not knowingly collect information from children.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                8. Changes to This Policy
              </h3>
              <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                We may update this privacy policy from time to time. We will notify you of significant changes through the app.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Terms of Service */}
        <Card className="mb-6" style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
              <FileText className="w-5 h-5" />
              Terms of Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                1. Acceptance of Terms
              </h3>
              <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                By accessing and using Ledgera AI, you accept and agree to be bound by these Terms of Service and our Privacy Policy.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                2. Description of Service
              </h3>
              <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                Ledgera AI is an AI-powered bookkeeping and financial tracking tool designed for freelancers and small business owners. It helps you organize income, expenses, projects, and generate financial reports—but it is not a substitute for professional financial advice.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                3. User Responsibilities
              </h3>
              <p className="mb-2" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                You agree to:
              </p>
              <ul className="list-disc list-inside space-y-1" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account</li>
                <li>Use the service only for lawful purposes</li>
                <li>Not attempt to compromise the security of the service</li>
                <li>Verify all financial information with qualified professionals</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                4. Subscription and Billing
              </h3>
              <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                Ledgera AI offers a 7-day free trial, after which a subscription fee of $6/month applies. You can cancel at any time. Billing is handled securely through the Apple App Store or Google Play Store.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                5. Limitation of Liability
              </h3>
              <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                Ledgera AI is provided "as is" without warranties of any kind. We are not liable for any financial decisions you make based on information from our service. Always consult with qualified professionals for important financial matters.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                6. Intellectual Property
              </h3>
              <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                All content and functionality of Ledgera AI, including but not limited to text, graphics, logos, and software, is owned by us and protected by copyright and trademark laws.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                7. Termination
              </h3>
              <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                We reserve the right to suspend or terminate your account for violations of these terms or for any reason at our discretion. You may terminate your account at any time through the settings page.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                8. Contact Us
              </h3>
              <p className="mb-2" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                If you have questions about these terms or our privacy practices, please contact us:
              </p>
              <Link to={createPageUrl("Contact")}>
                <Button className="bg-[#22A699] hover:bg-[#1d8d82]">
                  Contact Us
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Copyright Section */}
        <Card className="mb-6" style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
          <CardContent className="pt-6 space-y-6">
            <div>
              <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                If you have questions about this policy, contact us at{' '}
                <a href="mailto:annabairdballew@gmail.com" style={{ color: '#22A699', textDecoration: 'underline' }}>
                  annabairdballew@gmail.com
                </a>
              </p>
            </div>

            <hr style={{ borderColor: profile?.darkMode ? '#374151' : '#e5e7eb' }} />

            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                © Copyright & Intellectual Property
              </h3>
              <p className="font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                © {new Date().getFullYear()} Ledgera AI. All rights reserved.
              </p>
              <p className="mb-3" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                The Ledgera AI application, including its design, code, branding, and user interface, is the intellectual property of Ledgera AI and is protected by applicable copyright, trademark, and intellectual property laws.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                Your Content
              </h3>
              <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                You retain full ownership of all content you upload to Ledgera AI, including financial documents and transaction data. By using the app, you grant Ledgera AI a limited, non-exclusive license to store, display, and process your content solely for the purpose of providing the service to you.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                Restrictions
              </h3>
              <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                You may not copy, reproduce, distribute, modify, or create derivative works from any part of the Ledgera AI application without prior written consent. Unauthorized use of Ledgera AI's proprietary materials may violate copyright, trademark, and other applicable laws.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
          <p className="text-sm">
            © {new Date().getFullYear()} Ledgera AI. Built for the future of freelance finance.
          </p>
        </div>
      </div>
    </div>
  );
}