// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useRef, useEffect, useId } from 'preact/hooks';
import FieldRow from './FieldRow';
import { CopyButton, CopyFailedMessage } from '../../Parts';
import useCopy from '../../Parts/useCopy';
import { selectContent } from '../../Parts/selectContent';
import link from '@/styles/ds/link.module.scss';
import S from './ContentTypes.module.scss';
import normalizeUrl from '@/utils/normalizeUrl';
import { t } from '@/i18n';

/**
 * One address of a login: a link (new tab) or plain text, and its copy
 * button; when the clipboard refuses, the address is focused and selected
 * and the Copy failed message stands under it.
 * @param {object} props - Component props.
 * @param {string} props.text - The address as stored.
 * @returns {import('preact').JSX.Element} The list item.
 */
function UriItem ({ text }) {
  const ref = useRef(null);
  const textRef = useRef(null);
  const messageId = useId();
  const [copied, copy, failures] = useCopy(text, t('common.copied'));
  let href;

  try {
    href = normalizeUrl(text);
  } catch {
    href = null;
  }

  useEffect(() => {
    if (failures) {
      selectContent(ref.current, textRef.current);
    }
  }, [failures]);

  return (
    <li>
      <div className={S.box}>
        {href ? (
          <a
            ref={ref}
            href={href}
            title={text}
            target='_blank'
            rel='noopener noreferrer'
            className={`${link.link} ${link.linkAccent} ${S.rowValue} ${S.uriLink}`}
            aria-describedby={failures ? messageId : undefined}
          >
            <span ref={textRef}>{text}</span>
            <span className='visually-hidden'> {t('nav.newTab')}</span>
          </a>
        ) : (
          <span
            ref={ref}
            className={`${S.rowValue} ${S.uriLink}`}
            title={text}
            tabIndex={failures ? -1 : undefined}
            aria-describedby={failures ? messageId : undefined}
          >
            <span ref={textRef}>{text}</span>
          </span>
        )}
        <div className={S.rowActions}>
          <CopyButton
            value={text}
            kind='adornment'
            label={t('recipient.copyField', { field: text })}
            shared={{ copied, copy }}
          />
        </div>
      </div>

      <CopyFailedMessage id={messageId} open={failures > 0} />
    </li>
  );
}

/**
 * Login content type view - displays login credentials as field rows.
 * @param {object} props - Component props.
 * @param {object} props.content - Login data.
 * @param {string} [props.content.name] - Service name.
 * @param {string} [props.content.username] - Username or email.
 * @param {string} [props.content.password] - Password.
 * @param {Array<{text: string, matcher: number}>} [props.content.uris] - Associated URIs.
 * @param {string} [props.content.notes] - Additional notes.
 * @returns {import('preact').JSX.Element} The login content view.
 */
export default function ContentLogin ({ content }) {
  const uris = (content.uris || []).filter((entry) => entry && entry.text);

  return (
    <div className={S.fields}>
      <FieldRow label={t('content.name')} value={content.name} />
      <FieldRow label={t('content.username')} value={content.username} />
      <FieldRow
        label={t('content.password')}
        value={content.password}
        sensitive
        maskedValue={'●'.repeat(8)}
      />

      {uris.length > 0 && (
        <div className={S.row}>
          <span className={S.rowLabel}>{t('content.urls')}</span>
          <ul className={S.uriList}>
            {uris.map((entry, index) => (
              <UriItem key={`${entry.text}-${index}`} text={entry.text} />
            ))}
          </ul>
        </div>
      )}

      <FieldRow label={t('content.notes')} value={content.notes} multiline />
    </div>
  );
}
