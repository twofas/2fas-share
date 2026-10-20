// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import S from './Window.module.scss';
import Star from '@/assets/star.svg?react';

const cx = (...names) => names.filter(Boolean).join(' ');

/**
 * Window from the design system (Generator / dialog, Recipient / window):
 * a glass ring around a card of stacked sections, with a footer for the CTA.
 * @param {object} props - Component props.
 * @param {string} [props.as='section'] - Root element.
 * @param {string} [props.className] - Extra class on the ring.
 * @param {import('preact').ComponentChildren} props.children - Card and footer.
 * @returns {import('preact').JSX.Element} Window ring.
 */
export function Window ({ as: Tag = 'section', className, children, ...rest }) {
  return <Tag className={cx(S.window, className)} {...rest}>{children}</Tag>;
}

/**
 * Card inside the window; its direct children are separated sections.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Extra class.
 * @param {import('preact').ComponentChildren} props.children - Sections.
 * @returns {import('preact').JSX.Element} Window card.
 */
export function WindowCard ({ className, children, ...rest }) {
  return <div className={cx(S.card, className)} {...rest}>{children}</div>;
}

/**
 * One section of the card (dialog-row, option row, info row).
 * @param {object} props - Component props.
 * @param {boolean} [props.compact] - Option-row padding (16/24 instead of 24).
 * @param {string} [props.className] - Extra class.
 * @param {import('preact').ComponentChildren} props.children - Content.
 * @returns {import('preact').JSX.Element} Card section.
 */
export function WindowSection ({ compact, className, children, ...rest }) {
  return <div className={cx(S.section, compact && S.compact, className)} {...rest}>{children}</div>;
}

/**
 * Footer under the card: the CTA and the small print.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Extra class.
 * @param {import('preact').ComponentChildren} props.children - Content.
 * @returns {import('preact').JSX.Element} Window footer.
 */
export function WindowFooter ({ className, children, ...rest }) {
  return <div className={cx(S.footer, className)} {...rest}>{children}</div>;
}

/**
 * Field header: Label/strong title, Body/xs caption, optional star mark.
 * @param {object} props - Component props.
 * @param {string} [props.as='h2'] - Title element.
 * @param {string} [props.id] - Title id, for aria-labelledby.
 * @param {string} [props.htmlFor] - Renders the title as a <label> for a control.
 * @param {import('preact').ComponentChildren} props.title - Title.
 * @param {import('preact').ComponentChildren} [props.caption] - Caption under the title.
 * @param {string} [props.captionId] - Caption id, for aria-describedby.
 * @param {boolean} [props.star] - Show the star mark at the right edge.
 * @param {import('preact').ComponentChildren} [props.children] - Extra content at the right edge.
 * @returns {import('preact').JSX.Element} Field header.
 */
export function FieldHeader ({ as: Tag = 'h2', id, htmlFor, title, caption, captionId, star, children }) {
  const TitleTag = htmlFor ? 'label' : Tag;

  return (
    <div className={S.fieldHeader}>
      <div className={S.fieldText}>
        <TitleTag id={id} htmlFor={htmlFor} className={S.fieldTitle}>{title}</TitleTag>
        {caption && <p id={captionId} className={S.fieldCaption}>{caption}</p>}
      </div>
      {children}
      {star && <Star className={S.star} aria-hidden='true' />}
    </div>
  );
}
