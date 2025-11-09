import { useEffect } from 'react';

export default function OneSignalInit({ user }) {
  useEffect(() => {
    console.log('[Ledgera OneSignal] Component mounted/updated with user:', user);
    
    if (!user) {
      console.log('[Ledgera OneSignal] No user object - skipping initialization');
      return;
    }
    
    if (!user.email) {
      console.error('[Ledgera OneSignal] WARNING: User object exists but email is missing!', user);
      return;
    }

    console.log('[Ledgera OneSignal] Valid user detected - email:', user.email);

    // Detect if running in Capacitor (mobile app)
    const isCapacitor = window.Capacitor !== undefined;
    console.log('[Ledgera OneSignal] Running in Capacitor:', isCapacitor);

    if (isCapacitor) {
      // Mobile: Send postMessage to native wrapper
      console.log('[Ledgera OneSignal] Sending postMessage to native wrapper...');
      window.parent.postMessage({
        type: 'setOneSignalExternalUserId',
        externalUserId: user.email
      }, '*');
      
      console.log('[Ledgera OneSignal] ✅ Sent external user ID to native wrapper:', user.email);
    } else {
      // Web: Use OneSignal Web SDK 5.x
      console.log('[Ledgera OneSignal] Checking for OneSignal Web SDK...');
      if (window.OneSignal) {
        console.log('[Ledgera OneSignal] OneSignal SDK found, logging in...');
        window.OneSignal.login(user.email);
        console.log('[Ledgera OneSignal] ✅ Web SDK logged in:', user.email);
      } else {
        console.warn('[Ledgera OneSignal] OneSignal SDK not found on window object');
      }
    }

    // Cleanup on unmount (logout)
    return () => {
      console.log('[Ledgera OneSignal] Component unmounting - logging out');
      if (isCapacitor) {
        window.parent.postMessage({
          type: 'oneSignalLogout'
        }, '*');
        console.log('[Ledgera OneSignal] Sent logout to native wrapper');
      } else {
        if (window.OneSignal) {
          window.OneSignal.logout();
          console.log('[Ledgera OneSignal] Web SDK logged out');
        }
      }
    };
  }, [user]);

  return null;
}