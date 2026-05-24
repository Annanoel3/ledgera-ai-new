import { useEffect } from 'react';
import { saveOneSignalPlayerId } from '@/functions/saveOneSignalPlayerId';

// Helper function to detect if running in Capacitor mobile app
function isRunningInCapacitor() {
    return window.Capacitor?.isNativePlatform?.() ?? false;
}

export default function OneSignalInit({ user }) {
  useEffect(() => {
    // Load OneSignal SDK for web if not in Capacitor
    if (!isRunningInCapacitor() && !window.OneSignalDeferred) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      document.head.appendChild(script);
      console.log('[OneSignal] Loading web SDK...');
    }
  }, []);

  useEffect(() => {
    const syncOneSignal = async () => {
      if (!user) {
        console.log('[OneSignal] No user provided to OneSignalInit');
        return;
      }

      const userEmail = user?.email;

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

        if (externalId) {
          console.log('[OneSignal] ✅ Calling NotifyBridge.login() with:', externalId);
          // requestPermission can throw if already granted or dialog is dismissed — that's OK, we still need to login
          try {
            await NotifyBridge.requestPermission();
            console.log('[OneSignal] ✅ Permission granted/already set');
          } catch (permErr) {
            console.warn('[OneSignal] requestPermission threw (may already be granted):', permErr);
          }
          // Always call login regardless of permission result
          await NotifyBridge.login({ externalId: externalId });
          console.log('[OneSignal] ✅ login() sent for:', externalId);

          // Save push subscription ID for mobile
          try {
            const playerIdResult = await NotifyBridge.getPlayerId?.();
            const playerId = playerIdResult?.value || playerIdResult?.id;
            console.log('[OneSignal] Mobile player ID:', playerId);
            if (playerId) {
              const res = await saveOneSignalPlayerId({ playerId });
              console.log('[OneSignal] ✅ Mobile player ID saved to DB:', res?.data);
            } else {
              console.warn('[OneSignal] No mobile player ID returned from NotifyBridge');
            }
          } catch (err) {
            console.warn('[OneSignal] Could not get mobile player ID:', err);
          }
        } else {
          console.log('[OneSignal] Calling NotifyBridge.logout()');
          await NotifyBridge.logout();
        }
      } else {
        console.log('[OneSignal] Running in web browser');

        const initOneSignal = () => {
          if (!window.OneSignalDeferred) {
            console.log('[OneSignal] ⏳ Waiting for SDK to load...');
            setTimeout(initOneSignal, 500);
            return;
          }

          window.OneSignalDeferred.push(async function(OneSignal) {
            try {
              await OneSignal.init({
                appId: "f9bccfd2-7da8-475e-8091-d28ed41d7e14",
                allowLocalhostAsSecureOrigin: true,
                notifyButton: {
                  enable: false
                }
              });

              console.log('[OneSignal] ✅ SDK initialized');

              if (externalId) {
                await OneSignal.login(externalId);
                console.log('[OneSignal] ✅ User logged in with:', externalId);
              }

              // Save push subscription ID to DB
              const savePlayerId = async () => {
                try {
                  const playerId = OneSignal.User.pushSubscription.id;
                  console.log('[OneSignal] pushSubscription.id after init:', playerId);
                  if (playerId) {
                    const res = await saveOneSignalPlayerId({ playerId });
                    console.log('[OneSignal] ✅ Player ID saved to DB:', res?.data);
                  } else {
                    console.warn('[OneSignal] No pushSubscription.id available yet');
                  }
                } catch (err) {
                  console.error('[OneSignal] Failed to save player ID:', err);
                }
              };

              await savePlayerId();

              // Also listen for subscription changes
              OneSignal.User.pushSubscription.addEventListener('change', async (event) => {
                const newId = event.current?.id;
                console.log('[OneSignal] Subscription change event, new ID:', newId);
                if (newId) {
                  try {
                    const res = await saveOneSignalPlayerId({ playerId: newId });
                    console.log('[OneSignal] ✅ Updated player ID saved to DB:', res?.data);
                  } catch (err) {
                    console.error('[OneSignal] Failed to save updated player ID:', err);
                  }
                }
              });
            } catch (error) {
              console.error('[OneSignal] Initialization error:', error);
            }
          });
        };

        initOneSignal();
      }
    };

    syncOneSignal();
  }, [user]);

  return null;
}