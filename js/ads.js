// ============================================
// VK Ads — rewarded + interstitial (native ads)
// Docs: VKWebAppCheckNativeAds / VKWebAppShowNativeAds
// ============================================

window.VKAds = {
  rewardReady: false,
  interstitialReady: false,
  lastInterstitialAt: 0,
  levelsSinceAd: 0,
  // Show interstitial every N completed levels (not at launch)
  INTERSTITIAL_EVERY: 3,
  MIN_MS_BETWEEN_INTERSTITIAL: 90000
};

function adsIsVK() {
  return typeof vkBridge !== 'undefined' && typeof vkBridge.send === 'function';
}

/** Preload both formats after VKWebAppInit. */
window.preloadVKAds = function () {
  if (!adsIsVK()) return Promise.resolve();
  return Promise.all([
    vkBridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
      .then((d) => { window.VKAds.rewardReady = !!(d && d.result); })
      .catch(() => { window.VKAds.rewardReady = false; }),
    vkBridge.send('VKWebAppCheckNativeAds', { ad_format: 'interstitial' })
      .then((d) => { window.VKAds.interstitialReady = !!(d && d.result); })
      .catch(() => { window.VKAds.interstitialReady = false; })
  ]);
};

/**
 * Show rewarded ad. User must intentionally request it.
 * Resolves true if ad was shown successfully.
 */
window.showRewardedAd = function () {
  if (!adsIsVK()) {
    return Promise.resolve(false);
  }

  return vkBridge.send('VKWebAppShowNativeAds', {
    ad_format: 'reward',
    use_waterfall: true
  })
    .then((data) => {
      const ok = !!(data && data.result);
      // Preload next
      vkBridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
        .then((d) => { window.VKAds.rewardReady = !!(d && d.result); })
        .catch(() => {});
      return ok;
    })
    .catch((err) => {
      console.warn('[ArrowPulse] rewarded ad failed:', err);
      return false;
    });
};

/**
 * Show interstitial between levels (not at app start).
 * Resolves true if shown.
 */
window.showInterstitialAd = function (force) {
  if (!adsIsVK()) return Promise.resolve(false);
  // Куплено «Без рекламы»
  if (window.hasNoAds && window.hasNoAds()) return Promise.resolve(false);

  const now = Date.now();
  if (!force) {
    window.VKAds.levelsSinceAd = (window.VKAds.levelsSinceAd || 0) + 1;
    if (window.VKAds.levelsSinceAd < window.VKAds.INTERSTITIAL_EVERY) {
      return Promise.resolve(false);
    }
    if (now - (window.VKAds.lastInterstitialAt || 0) < window.VKAds.MIN_MS_BETWEEN_INTERSTITIAL) {
      return Promise.resolve(false);
    }
  }

  return vkBridge.send('VKWebAppShowNativeAds', {
    ad_format: 'interstitial'
  })
    .then((data) => {
      const ok = !!(data && data.result);
      if (ok) {
        window.VKAds.lastInterstitialAt = Date.now();
        window.VKAds.levelsSinceAd = 0;
      }
      vkBridge.send('VKWebAppCheckNativeAds', { ad_format: 'interstitial' })
        .then((d) => { window.VKAds.interstitialReady = !!(d && d.result); })
        .catch(() => {});
      return ok;
    })
    .catch((err) => {
      console.warn('[ArrowPulse] interstitial failed:', err);
      return false;
    });
};
