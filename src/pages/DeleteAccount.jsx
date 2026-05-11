import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function DeleteAccount() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8 gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="prose dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8 dark:text-white">Delete Your Account</h1>

          <div className="space-y-8 dark:text-gray-200">
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white">How to Delete Your Account</h2>
              <p className="mb-4">
                You can delete your Ledgera AI account using either method below:
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 dark:text-white">Option 1: In-App Deletion</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Navigate to <strong>Settings</strong> from the main menu</li>
                <li>Scroll to the bottom of the Settings page</li>
                <li>Click the <strong>"Delete Account"</strong> button</li>
                <li>Confirm the deletion when prompted</li>
              </ol>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                This action is permanent and cannot be undone. All your data will be deleted immediately.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 dark:text-white">Option 2: Email Request</h3>
              <p className="mb-4">
                Send a request to delete your account directly:
              </p>
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg mb-4">
                <p className="font-mono text-sm">mediocreatbestdev@outlook.com</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Include "Delete Account" in the subject line. We'll process your request within 7 business days.
              </p>
            </section>

            <section className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 dark:text-white">What happens when you delete?</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ Your account and all associated data will be permanently deleted</li>
                <li>✓ All projects, transactions, and settings will be removed</li>
                <li>✓ You will no longer receive any communications from us</li>
                <li>✓ You can create a new account anytime after deletion</li>
              </ul>
            </section>

            <section className="border-t pt-8 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Need Help?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                If you have any questions or issues, contact us at{' '}
                <a href="mailto:mediocreatbestdev@outlook.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                  mediocreatbestdev@outlook.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}