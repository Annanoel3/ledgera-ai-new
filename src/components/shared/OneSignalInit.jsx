import { useEffect, useRef } from 'react';
import { saveOneSignalPlayerId } from '@/functions/saveOneSignalPlayerId';

// Helper function to detect if running in Capacitor mobile app
function isRunningInCapacitor() {
    return window.Capacitor?.isNativePlatform?.() ?? false;
}

export default function OneSignalInit({ user }) {
  const savedIds = useRef(new Set());

  const persistPlayerId = async (playerId) => {
    if (!playerId || savedIds.current.has(playerId)) return;
    savedIds.current.add(playerId);
    console.log('[OneSignal] saving player ID to DB:', playerId);
    try {
      const res = await saveOneSignalPlayerId({ playerId });
      console.log('[OneSignal] ✅ player ID saved to DB:', res?.data);
    } catch (err) {
      console.error('[OneSignal] Failed to save player ID:', err);
      savedIds.current.delete(playerId); // allow retry
    }
  };

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

          // 1. Set up change listener BEFORE login so we don't miss the event
          try {
            window.OneSignal.User.pushSubscription.addEventListener('change', async (event) => {
              const id = event.current?.id;
              console.log('[OneSignal] Got player ID:', id);
              if (id) {
                await persistPlayerId(id);
              }
            });
          } catch (listenerErr) {
            console.warn('[OneSignal] Could not attach change listener:', listenerErr);
          }

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
          console.log('[OneSignal] login complete, checking pushSubscription.id immediately:', window.OneSignal?.User?.pushSubscription?.id);

          // 2. Retry loop: 20 attempts × 3 seconds = 60 seconds total
          const tryGetMobilePlayerId = async (attemptsLeft = 20) => {
            try {
              const playerIdResult = await NotifyBridge.getPlayerId?.();
              const id = playerIdResult?.value || playerIdResult?.id;
              console.log('[OneSignal] Mobile player ID attempt:', id, '(attempts left:', attemptsLeft, ')');
              if (id) {
                console.log('[OneSignal] Got player ID:', id);
                await persistPlayerId(id);
              } else if (attemptsLeft > 0) {
                console.log('[OneSignal] Mobile player ID not ready, retrying in 3s...');
                setTimeout(() => tryGetMobilePlayerId(attemptsLeft - 1), 3000);
              } else {
                console.warn('[OneSignal] Mobile player ID never became available after 60s');
              }
            } catch (err) {
              console.warn('[OneSignal] Could not get mobile player ID:', err);
            }
          };
          await tryGetMobilePlayerId();
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

              // Try immediately — may already be available
              const immediateId = OneSignal.User.pushSubscription.id;
              console.log('[OneSignal] pushSubscription.id after init:', immediateId);
              if (immediateId) {
                await persistPlayerId(immediateId);
              } else {
                console.log('[OneSignal] ID not ready yet, waiting for subscription change event...');
              }

              // Always listen for subscription changes (fires when ID becomes available or changes)
              OneSignal.User.pushSubscription.addEventListener('change', async (event) => {
                const newId = event.current?.id;
                console.log('[OneSignal] Subscription change event, new ID:', newId);
                if (newId) {
                  await persistPlayerId(newId);
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