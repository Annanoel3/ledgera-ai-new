import { Capacitor, registerPlugin } from '@capacitor/core';

const AD_UNIT_ID = 'ca-app-pub-7979856440890193/1210376593';
const SHOW_EVERY_N_OPENS = 3;  // Show ad every 3rd app open
const AD_DELAY_MS = 15000;     // Wait 15 seconds before showing
const STORAGE_KEY = 'app_open_count'; // must match App.jsx

let AdMob = null;

export async function initAdMob() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    AdMob = registerPlugin('AdMob');
    await AdMob.initialize({ initializeForTesting: false });
    console.log('[AdMob] initialized');
  } catch (e) {
    console.warn('[AdMob] init failed:', e);
    AdMob = null;
  }
}

export async function showInterstitialAd() {
  if (!AdMob) return false;
  try {
    await AdMob.prepareInterstitial({ adId: AD_UNIT_ID, isTesting: false });
    await AdMob.showInterstitial();
    return true;
  } catch (e) {
    console.warn('[AdMob] interstitial failed:', e);
    return false;
  }
}

function isUserActive() {
  const activeElement = document.activeElement;
  if (!activeElement) return false;
  return (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.contentEditable === 'true'
  );
}

// Also check if microphone is in use via a global flag
let _micActive = false;
export function setMicActive(val) { _micActive = val; }

function isBlocked() {
  return isUserActive() || _micActive;
}

async function waitUntilFree() {
  return new Promise(resolve => {
    if (!isBlocked()) { resolve(); return; }

    const interval = setInterval(() => {
      if (!isBlocked()) {
        clearInterval(interval);
        resolve();
      }
    }, 500);
  });
}

export async function maybeShowAdOnOpen() {
  // count is already incremented in App.jsx before calling this
  const count = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);

  if (count % SHOW_EVERY_N_OPENS === 0) {
    await new Promise(resolve => setTimeout(resolve, AD_DELAY_MS));
    await waitUntilFree();
    await showInterstitialAd();
  }
}