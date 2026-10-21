// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// Windows Phone UAs also contain "Android" and "iPhone" tokens, so they are ruled out first.
const WINDOWS_PHONE_RE = /Windows Phone|IEMobile|Windows Mobile/i;
const IOS_RE = /\b(iPhone|iPod|iPad)\b/;
const ANDROID_RE = /\bAndroid\b/i;
// Huawei HarmonyOS UAs carry an "Android" token but are not treated as Android.
const HARMONYOS_RE = /\bHarmonyOS\b/i;
// Android-based TVs, set-top boxes and Chromecasts are neither phones nor tablets.
const ANDROID_TV_RE = /\b(Android TV|Google ?TV|SMART-?TV|SmartTV|CrKey|BRAVIA|AFT[A-Z]\w*)\b/i;

/**
 * Detect an iPad running iPadOS 13+ that masquerades as a desktop Mac.
 *
 * Since iPadOS 13, Safari on iPad requests desktop sites by default and sends a
 * `Macintosh` user-agent string indistinguishable from a real Mac, so user-agent
 * parsing alone reports macOS with no device type. The reliable discriminator is
 * touch support: a Mac reports `navigator.maxTouchPoints === 0`, while an iPad
 * reports a value greater than 1.
 * @param {{ maxTouchPoints?: number, userAgent?: string }} [nav] - A navigator-like object.
 * @returns {boolean} True when the device is an iPad reporting a desktop Mac UA.
 */
export function isIPadOSLike (nav) {
  return !!nav &&
    nav.maxTouchPoints > 1 &&
    /Macintosh/.test(nav.userAgent || '');
}

/**
 * Compute device capability flags from a navigator-like object. Pure (no globals)
 * so it can be unit-tested.
 *
 * iOS covers iPhone, iPod and iPad (including iPadOS Safari reporting a Mac UA).
 * Android covers phones and tablets; Android TV devices are reported as Android
 * but not as mobile or tablet. HarmonyOS is neither Android nor mobile.
 * @param {{ maxTouchPoints?: number, userAgent?: string }} [nav] - A navigator-like object.
 * @returns {{ isMobileOrTablet: boolean, isIOS: boolean, isAndroid: boolean }} Device flags.
 */
export function computeDeviceFlags (nav) {
  const ua = nav?.userAgent || '';
  const isWindowsPhone = WINDOWS_PHONE_RE.test(ua);
  const isIOS = !isWindowsPhone && (IOS_RE.test(ua) || isIPadOSLike(nav));
  const isAndroid = !isWindowsPhone && !isIOS && ANDROID_RE.test(ua) && !HARMONYOS_RE.test(ua);

  return {
    isMobileOrTablet: isIOS || (isAndroid && !ANDROID_TV_RE.test(ua)),
    isIOS,
    isAndroid
  };
}
