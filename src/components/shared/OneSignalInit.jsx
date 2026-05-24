import { useEffect } from 'react';

function isRunningInCapacitor() {
  return window.Capacitor?.isNativePlatform?.() ?? false;
}

export default function OneSignalInit({ user }) {
  useEffect(() => {
    if (!isRunningInCapacitor() && !window.OneSignalDeferred) {
      window.OneSignalDeferred = [];
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const externalId = user.email?.includes('@')
      ? user.email
      : user.id ? `${user.id}@ledgera.app` : null;

    if (!externalId) return;

    if (isRunningInCapacitor()) {
      const NotifyBridge = window.Capacitor?.Plugins?.NotifyBridge;
      if (!NotifyBridge) return;

      NotifyBridge.requestPermission().catch(() => {});
      NotifyBridge.login({ externalId }).catch((err) =>
        console.warn('[OneSignal] login error:', err)
      );
    } else {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          await OneSignal.init({
            appId: 'f9bccfd2-7da8-475e-8091-d28ed41d7e14',
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: false },
          });
          await OneSignal.login(externalId);
        } catch (err) {
          console.warn('[OneSignal] web init error:', err);
        }
      });
    }
  }, [user]);

  return null;
}