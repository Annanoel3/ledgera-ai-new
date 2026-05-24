import React from "react";
import { Link } from "react-router-dom";

export default function GoogleDataPolicy() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-sm text-blue-600 hover:underline">← Back to Ledgera AI</Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68eaceb5d712c1b62b8bd4d5/83975f5f2_Untitleddesign9.png"
            alt="Ledgera AI"
            className="w-10 h-10 object-contain"
          />
          <h1 className="text-2xl font-bold text-gray-900">Ledgera AI</h1>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6">Google API Limited Use Disclosure</h2>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <p>
            Ledgera AI's use and transfer of information received from Google APIs to any other app will adhere to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What Google Data We Access</h3>
            <p>
              Ledgera AI requests access to your Google Calendar data solely to enable the optional Google Calendar
              synchronization feature. Specifically, we access:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Calendar events (read and write) — to display your events within the app and optionally sync Ledgera events to your Google Calendar.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">How We Use Google Data</h3>
            <p>Data obtained from Google APIs is used <strong>only</strong> for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Displaying your Google Calendar events within the Ledgera AI app interface.</li>
              <li>Syncing events you create in Ledgera AI to your Google Calendar (only when you explicitly initiate the sync).</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What We Do Not Do With Google Data</h3>
            <p>We affirm that Google user data obtained via Google APIs is <strong>not</strong>:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Sold to third parties.</li>
              <li>Used for advertising or marketing purposes.</li>
              <li>Shared with third parties except as necessary to provide the in-app calendar feature.</li>
              <li>Used for any purpose that is not directly related to the features described above.</li>
              <li>Used to train AI or machine learning models.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Protection</h3>
            <p>
              We implement appropriate technical and organizational measures to protect your Google data against
              unauthorized access, loss, or misuse. Access tokens are used only at the time of the user-initiated
              sync and are not stored beyond what is needed for the OAuth session.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Control</h3>
            <p>
              The Google Calendar integration is entirely optional. You can connect or disconnect your Google account
              at any time from within the Calendar section of the app. Disconnecting will revoke our access to your
              Google Calendar data.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact</h3>
            <p>
              If you have questions about how we handle your Google data, please contact us at{" "}
              <a href="mailto:support@ledgera.ai" className="text-blue-600 hover:underline">
                support@ledgera.ai
              </a>
              .
            </p>
          </section>

          <p className="text-sm text-gray-500 pt-4 border-t border-gray-200">
            Last updated: May 2026
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4 text-sm text-blue-600">
          <Link to="/PrivacyPolicy" className="hover:underline">Privacy Policy</Link>
          <Link to="/Terms" className="hover:underline">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}