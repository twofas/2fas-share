// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import validateShareParams from '../utils/validateShareParams';
import SharedData from '../pages/SharedData';
import SharedDataBroken from '../pages/SharedData/Broken';

/**
 * Route guard that validates shared data URL parameters.
 * Renders SharedData if params are valid, the Broken recipient state otherwise.
 * @param {object} props - Component props.
 * @param {object} props.params - Route parameters from wouter.
 * @returns {import('preact').JSX.Element} SharedData or the broken link page.
 */
export default function ValidatedRoute({ params }) {
  if (!validateShareParams(params)) {
    return <SharedDataBroken />;
  }

  const paramKey = `${params.id}/${params.type}/${params.nonce}/${params.key}`;

  return <SharedData key={paramKey} params={params} />;
}
