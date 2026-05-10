import { useEffect } from 'react';

// Helper function to detect if running in Capacitor mobile app
function isRunningInCapacitor() {
    return window.Capacitor?.isNativePlatform?.() ?? false;
}

export default function OneSignalInit({ user }) {
  useEffect(() => {
    const syncOneSignal = async () => {
      if (!user) {
        console.log('[OneSignal] No user provided to OneSignalInit');
        return;
      }

      const userEmail = user?.email;

      // Use real email, or construct fake email from user.id for phone-only login users
      // OneSignal requires email format for external ID
      let externalId;
      if (userEmail && userEmail.includes('@')) {
        externalId = userEmail;
        console.log('[OneSignal] ✅ Using real email as external ID:', externalId);
      } else if (user?.id) {
        externalId = `${user.id}@ledgera.app`;
        console.log('[OneSignal] ⚠️ No email found, using generated ID:', externalId);
      } else {
        console.error('[OneSignal] No email or user ID available, skipping');
        return;
      }

      if (isRunningInCapacitor()) {
        console.log('[OneSignal] Running in Capacitor mobile app');
        const NotifyBridge = window.Capacitor?.Plugins?.NotifyBridge;

        if (!NotifyBridge) {
          console.warn('[OneSignal] NotifyBridge plugin not found');
          return;
        }

        console.log('[OneSignal] ✅ Calling NotifyBridge.login() with:', externalId);
        await NotifyBridge.requestPermission();
        await NotifyBridge.login({ externalId: externalId });
      } else {
        console.log('[OneSignal] Running in web browser');
        if (externalId) {
          window.OneSignal = window.OneSignal || [];
          window.OneSignal.push(function() {
            window.OneSignal.init({
              appId: "f9bccfd2-7da8-475e-8091-d28ed41d7e14",
              allowLocalhostAsSecureOrigin: true
            });
            console.log('[OneSignal] ✅ Web SDK using login() with:', externalId);
            window.OneSignal.login(externalId);
          });
        } else {
          if (window.OneSignal) {
            window.OneSignal.push(function() {
              window.OneSignal.logout();
              console.log('[OneSignal] Web SDK logged out');
            });
          }
        }
      }
    };

    syncOneSignal();
  }, [user]);

  return null;
}
