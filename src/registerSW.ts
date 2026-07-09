// Service worker registration with forced reload-on-update.
//
// `vite-plugin-pwa`'s `registerType: 'autoUpdate'` only configures the
// generated service worker itself (skipWaiting + clientsClaim) to take over
// quickly — it does NOT, by itself, make an already-open tab reload to pick
// up the new JS/CSS. Without this file, a tab left open across a deploy can
// keep running the old bundle indefinitely while the (now-updated) service
// worker underneath it has already swapped its cache over to the new
// deploy's hashed asset filenames, which is a real, known source of
// "why is my UI stale/half-broken" reports on PWAs. Calling `updateSW(true)`
// the moment a new version is detected activates it and reloads the page,
// so users always land on a single consistent bundle.
import { registerSW } from 'virtual:pwa-register';

export function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSW(true);
    },
    onOfflineReady() {
      // No UI needed — this is a bonus of the PWA setup, not a feature we surface.
    },
  });
}
