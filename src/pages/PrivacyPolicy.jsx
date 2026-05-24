import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, ArrowLeft, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 min-h-screen bg-white">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2 text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-3xl font-bold mb-2 text-gray-900">Privacy Policy, Terms & Legal</h1>
        <p className="mb-8 text-gray-500">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Privacy Policy */}
        <Card className="mb-6 border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Shield className="w-5 h-5 text-[#22A699]" />
              Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">1. Your Data is Private and Secure</h3>
              <p className="mb-2">
                <strong>Your financial data belongs to you and only you.</strong> All information you enter into Ledgera AI—including income, expenses, projects, and uploaded documents—is:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-2">
                <li><strong>Visible only to you</strong> — No one else, including our team, can access your financial data</li>
                <li><strong>Encrypted at rest and in transit</strong> — Industry-standard encryption protects your data</li>
                <li><strong>Stored securely</strong> — Protected with enterprise-grade security measures</li>
                <li><strong>Never sold or shared for marketing</strong> — We will never sell or share your financial information</li>
              </ul>
              <p>We collect basic account information (name, email) solely to provide you with the service.</p>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">2. How We Use Your Information</h3>
              <p className="mb-2">We use your information only to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Provide and maintain the Ledgera AI service</li>
                <li>Generate your personal financial reports and insights</li>
                <li>Respond to your support requests</li>
                <li>Detect and prevent security threats or fraud</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">3. Data Sharing</h3>
              <p className="mb-2"><strong>We do not sell or share your personal or financial information.</strong> We may only disclose your information:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>When required by law (e.g., court order, subpoena)</li>
                <li>To protect our legal rights or prevent fraud</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">4. Your Rights</h3>
              <p className="mb-2">You have complete control over your data:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Access and export all your data at any time</li>
                <li>Correct or update your information</li>
                <li>Delete your account and all associated data permanently</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">5. Data Retention</h3>
              <p>Your data is retained for as long as you have an active account. When you delete your account, all your data is permanently removed from our systems within 30 days.</p>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">6. Third-Party Services</h3>
              <p>We use OpenAI to power our AI assistant. Your conversations are processed securely, and OpenAI does not use your data to train their models. We also use secure cloud storage providers that comply with industry security standards.</p>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">7. Children's Privacy</h3>
              <p>Ledgera AI is not intended for users under 18 years of age. We do not knowingly collect information from children.</p>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">8. Changes to This Policy</h3>
              <p>We may update this privacy policy from time to time. We will notify you of significant changes through the app.</p>
            </div>

            <div>
              <p>
                If you have questions about this policy, contact us at{' '}
                <a href="mailto:mediocreatbestdev@outlook.com" className="text-[#22A699] underline">
                  mediocreatbestdev@outlook.com
                </a>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Google API Disclosure - standalone card */}
        <Card className="mb-6 border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Globe className="w-5 h-5 text-[#22A699]" />
              Google API Limited Use Disclosure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p className="font-semibold text-gray-900 bg-green-50 border border-green-200 rounded-md px-4 py-3">
              ✅ Ledgera AI's use and transfer of information received from Google APIs adheres to the{" "}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#22A699] underline">
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. Ledgera AI does not use Google user data for any purpose that violates these restrictions.
            </p>
            <div>
              <p className="font-semibold text-gray-900 mb-1">What we access</p>
              <p>Google Calendar events (read and write) — solely to enable the optional calendar sync feature.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">How we use it</p>
              <p>Only to display your Google Calendar events within the app and to sync Ledgera events to your Google Calendar when you explicitly initiate it.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">What we do NOT do with Google data</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Sell or share it with third parties</li>
                <li>Use it for advertising or marketing</li>
                <li>Use it to train AI or machine learning models</li>
                <li>Use it for any purpose unrelated to the calendar feature</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Your control</p>
              <p>The Google Calendar integration is entirely optional. You can connect or disconnect at any time from within the Calendar section of the app.</p>
            </div>
            <p className="text-sm text-gray-500 border-t border-gray-100 pt-3">
              Questions? Contact us at{" "}
              <a href="mailto:mediocreatbestdev@outlook.com" className="text-[#22A699] underline">
                mediocreatbestdev@outlook.com
              </a>.
            </p>
          </CardContent>
        </Card>

        {/* Terms of Service */}
        <Card className="mb-6 border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <FileText className="w-5 h-5 text-[#22A699]" />
              Terms of Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">1. Acceptance of Terms</h3>
              <p>By accessing and using Ledgera AI, you accept and agree to be bound by these Terms of Service and our Privacy Policy.</p>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">2. Description of Service</h3>
              <p>Ledgera AI is an AI-powered bookkeeping and financial tracking tool designed for freelancers and small business owners. It helps you organize income, expenses, projects, and generate financial reports—but it is not a substitute for professional financial advice.</p>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">3. User Responsibilities</h3>
              <p className="mb-2">You agree to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account</li>
                <li>Use the service only for lawful purposes</li>
                <li>Not attempt to compromise the security of the service</li>
                <li>Verify all financial information with qualified professionals</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">4. Subscription and Billing</h3>
              <p>Ledgera AI offers a 7-day free trial, after which a subscription fee of $6/month applies. You can cancel at any time. Billing is handled securely through the Apple App Store or Google Play Store.</p>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">5. Limitation of Liability</h3>
              <p>Ledgera AI is provided "as is" without warranties of any kind. We are not liable for any financial decisions you make based on information from our service. Always consult with qualified professionals for important financial matters.</p>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">6. Termination</h3>
              <p>We reserve the right to suspend or terminate your account for violations of these terms or for any reason at our discretion. You may terminate your account at any time through the settings page.</p>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">7. Contact</h3>
              <p>
                For questions about these terms, contact us at{' '}
                <a href="mailto:mediocreatbestdev@outlook.com" className="text-[#22A699] underline">
                  mediocreatbestdev@outlook.com
                </a>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Copyright & IP */}
        <Card className="mb-6 border border-gray-200">
          <CardContent className="pt-6 space-y-6 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">© Copyright & Intellectual Property</h3>
              <p className="font-semibold mb-2 text-gray-900">© {new Date().getFullYear()} Ledgera AI. All rights reserved.</p>
              <p>The Ledgera AI application, including its design, code, branding, and user interface, is the intellectual property of Ledgera AI and is protected by applicable copyright, trademark, and intellectual property laws.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-900">Your Content</h3>
              <p>You retain full ownership of all content you upload to Ledgera AI, including financial documents and transaction data. By using the app, you grant Ledgera AI a limited, non-exclusive license to store, display, and process your content solely for the purpose of providing the service to you.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-900">Restrictions</h3>
              <p>You may not copy, reproduce, distribute, modify, or create derivative works from any part of the Ledgera AI application without prior written consent. Unauthorized use of Ledgera AI's proprietary materials may violate copyright, trademark, and other applicable laws.</p>
            </div>
            <div>
              <p>
                For licensing inquiries, contact{' '}
                <a href="mailto:mediocreatbestdev@outlook.com" className="text-[#22A699] underline">
                  mediocreatbestdev@outlook.com
                </a>.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center py-6 text-gray-400 text-sm">
          © {new Date().getFullYear()} Ledgera AI. Built for the future of freelance finance.
        </div>
      </div>
    </div>
  );
}