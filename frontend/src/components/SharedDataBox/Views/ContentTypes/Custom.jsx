// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { SecretField } from '../../Parts';

/**
 * Custom content type view (notes from the web generator): the read-only
 * note field with the copy button, as Figma Recipient / window Revealed.
 * @param {object} props - Component props.
 * @param {object | string} props.content - The content object with text field, or a legacy string.
 * @param {string} [props.content.text] - The note text.
 * @param {string} [props.labelledBy] - Id of the window title labelling the field.
 * @returns {import('preact').JSX.Element} The custom content view.
 */
export default function ContentCustom ({ content, labelledBy }) {
  const text = typeof content === 'string' ? content : content.text;

  return <SecretField value={text || ''} labelledBy={labelledBy} />;
}
