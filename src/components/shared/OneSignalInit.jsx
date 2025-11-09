import { useEffect } from 'react';

export default function OneSignalInit({ user }) {
  useEffect(() => {
    if (!user || !user.email) return;

    // Detect if running in Capacitor (mobile app)
    const isCapacitor = window.Capacitor !== undefined;

    if (isCapacitor) {
      // Mobile: Send postMessage to native wrapper
      window.parent.postMessage({
        type: 'setOneSignalExternalUserId',
        externalUserId: user.email  // ALWAYS email, NEVER user.id
      }, '*');
      
      console.log('[Ledgera OneSignal] Sent external user ID to native wrapper:', user.email);
    } else {
      // Web: Use OneSignal Web SDK 5.x
      if (window.OneSignal) {
        window.OneSignal.login(user.email);
        console.log('[Ledgera OneSignal] Web SDK logged in:', user.email);
      }
    }

    // Cleanup on unmount (logout)
    return () => {
      if (isCapacitor) {
        window.parent.postMessage({
          type: 'oneSignalLogout'
        }, '*');
      } else {
        if (window.OneSignal) {
          window.OneSignal.logout();
        }
      }
    };
  }, [user]);

  return null;
}