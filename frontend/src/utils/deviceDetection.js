// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

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
 * Compute device capability flags from parsed user-agent data plus the
 * iPad-as-Mac override. Pure (no globals) so it can be unit-tested.
 * @param {{ name?: string }} os - Parsed OS result (e.g. from UAParser#getOS).
 * @param {{ type?: string }} device - Parsed device result (e.g. from UAParser#getDevice).
 * @param {boolean} iPadOSLike - Whether the device is an iPad masquerading as a Mac.
 * @returns {{ isMobileOrTablet: boolean, isIOS: boolean, isAndroid: boolean }} Device flags.
 */
export function computeDeviceFlags (os, device, iPadOSLike) {
  const isMobileOS = os.name === 'iOS' || os.name === 'Android' || iPadOSLike;
  const isMobileDevice = device.type === 'mobile' || device.type === 'tablet' || iPadOSLike;

  return {
    isMobileOrTablet: isMobileOS && isMobileDevice,
    isIOS: os.name === 'iOS' || iPadOSLike,
    isAndroid: os.name === 'Android'
  };
}
