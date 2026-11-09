// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

/**
 * Fonts used by the frontend. Inter is self-hosted from public/fonts (src/styles/_fonts.scss): two Google Fonts
 * subsets of the variable font, matched there by their family name (see buildFontEntries). Everything else in the
 * license entry (version, copyright, designer, license, styles, axes) is read from the font files.
 */
const FONTS = Object.freeze([
  Object.freeze({
    name: 'Inter',
    family: 'Inter',
    release: '',
    repository: 'https://github.com/rsms/inter',
    usedBy: 'Frontend (src/styles/_fonts.scss, variable weights 400-800)',
    source: 'Google Fonts (inter v20), self-hosted in public/fonts',
    modifications: 'Google Fonts unicode-range subsets latin and latin-ext (both preloaded in index.html).',
    licenseFile: 'public/fonts/Inter-OFL.txt'
  })
]);

export default FONTS;
