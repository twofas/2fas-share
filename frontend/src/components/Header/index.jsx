// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import S from './Header.module.scss';
import btn from '@/styles/ds/button.module.scss';
import lnk from '@/styles/ds/link.module.scss';
import PrefetchLink from '@/components/PrefetchLink';
import { useHashLocation } from 'wouter-preact/use-hash-location';
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '@/i18n';
import { useTheme } from '@/utils/theme';
import { scrollToSection } from '@/utils/scrollToSection';
import AboutDialog, { openAboutDialog } from '@/components/AboutDialog';
import Logo from '@/assets/logo-share.svg?react';
import SunIcon from '@/assets/icons/sun-line.svg?react';
import MoonIcon from '@/assets/icons/moon-clear-line.svg?react';
import ArrowIcon from '@/assets/icons/arrow-right-up-line.svg?react';
import { requestGeneratorFocus } from '@/utils/generatorFocus';

const GITHUB_URL = 'https://github.com/twofas/2fas-share';
const SCROLL_THRESHOLD = 24;
const SECTIONS = [
  { id: 'how-it-works', label: 'nav.howItWorks' },
  { id: 'security', label: 'nav.security' },
  { id: 'faq', label: 'nav.faq' }
];

/**
 * Whether the hash route is a shared-data link (/:id/:type/:nonce/:key).
 * @param {string} location Current wouter location.
 * @returns {boolean} True on the recipient page.
 */
const isRecipientRoute = location => location.split('/').filter(Boolean).length === 4;

/**
 * Menu glyph that morphs between the three bars (menu-line) and the cross
 * (close-line): the outer bars rotate into an X, the middle one fades out.
 * The state comes from aria-expanded on the button.
 * @returns {import('preact').JSX.Element} Animated icon.
 */
function MenuGlyph () {
  return (
    <svg className={S.menuGlyph} viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
      <rect className={S.barTop} x='3' y='4' width='18' height='2' />
      <rect className={S.barMiddle} x='3' y='11' width='18' height='2' />
      <rect className={S.barBottom} x='3' y='18' width='18' height='2' />
    </svg>
  );
}

/**
 * Light/dark switch. The name stays constant, aria-pressed carries the state,
 * the glyph shows the current theme (sun or moon).
 * @returns {import('preact').JSX.Element} Theme toggle button.
 */
function ThemeToggle () {
  const [theme, toggle] = useTheme();
  const dark = theme === 'dark';

  return (
    <button
      type='button'
      className={`${btn.navControl} ${btn.themeToggle}`}
      aria-pressed={dark ? 'true' : 'false'}
      aria-label={t('nav.darkMode')}
      onClick={toggle}
    >
      {dark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

/**
 * Sticky glass navigation bar. Home context (home, generator, documents):
 * section anchors, GitHub and the "create" CTA. Recipient context: only the
 * logo, the button opening Dialog / about and the theme toggle.
 * @returns {import('preact').JSX.Element} The header component.
 */
export default function Header () {
  const [location, navigate] = useHashLocation();
  const recipient = isRecipientRoute(location);
  const onGenerator = location === '/add';
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);

    update();
    window.addEventListener('scroll', update, { passive: true });

    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  // Scrollspy: the section in view gets aria-current="location" in the bar
  // (Link / nav, State=Active). Only on the home page.
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    if (location !== '/') {
      setActiveSection(null);
      return;
    }

    /** Pick the last section whose top has passed under the bar. */
    const update = () => {
      const line = (headerRef.current?.getBoundingClientRect().bottom ?? 0) + 8;
      let current = null;

      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);

        if (el && el.getBoundingClientRect().top <= line && el.getBoundingClientRect().bottom > line) {
          current = id;
        }
      }

      setActiveSection(current);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [location]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onKey = e => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const onPointer = e => {
      if (!headerRef.current?.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [menuOpen]);

  /**
   * Section anchor: scroll on the home page, otherwise go home first.
   * @param {Event} e Click event.
   * @param {string} id Target section id.
   */
  const goToSection = (e, id) => {
    e.preventDefault();
    setMenuOpen(false);

    if (location !== '/') {
      navigate('/');
    }

    scrollToSection(id);
  };

  const sectionLinks = SECTIONS.map(({ id, label }) => (
    <a
      key={id}
      className={lnk.navLink}
      href='#/'
      aria-current={activeSection === id ? 'location' : undefined}
      onClick={e => goToSection(e, id)}
    >
      {t(label)}
    </a>
  ));

  const githubLink = (
    <a className={lnk.navLink} href={GITHUB_URL} target='_blank' rel='noopener noreferrer'>
      {t('nav.github')}
      <ArrowIcon />
      <span className='visually-hidden'>{t('nav.newTab')}</span>
    </a>
  );

  const collapsed = scrolled && !menuOpen;

  return (
    <>
      {!recipient && (
        <div
          className={`${S.scrim} ${menuOpen ? S.scrimVisible : ''}`}
          aria-hidden='true'
        />
      )}

      <header
        ref={headerRef}
        className={`${S.header} ${collapsed ? S.scrolled : ''} ${menuOpen ? S.open : ''}`}
      >
        <div className={S.bar}>
          <PrefetchLink href='/' className={S.logo} aria-label={t('header.logoAlt')}>
            <Logo />
          </PrefetchLink>

          {recipient
            ? (
              <>
                <nav className={`${S.menu} ${S.recipientMenu}`} aria-label={t('nav.main')}>
                  <button type='button' className={`${lnk.navLink} ${S.aboutLink}`} onClick={openAboutDialog}>
                    {t('about.title')}
                  </button>
                </nav>
                <div className={S.actions}>
                  <ThemeToggle />
                </div>
              </>
            )
            : (
              <>
                <nav className={`${S.menu} ${S.desktopOnly}`} aria-label={t('nav.main')}>
                  {sectionLinks}
                  {githubLink}
                </nav>

                <div className={S.actions}>
                  <span className={S.desktopOnly}>
                    <ThemeToggle />
                  </span>

                  {!onGenerator && (
                    <PrefetchLink href='/add' className={`${btn.cta} ${btn.ctaSmall}`} onClick={requestGeneratorFocus}>
                      {t('v2.header.shareSecurely')}
                    </PrefetchLink>
                  )}

                  <button
                    ref={menuButtonRef}
                    type='button'
                    className={`${btn.navControl} ${S.mobileOnly}`}
                    aria-controls='mobile-menu'
                    aria-expanded={menuOpen ? 'true' : 'false'}
                    aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
                    onClick={() => setMenuOpen(open => !open)}
                  >
                    <MenuGlyph />
                  </button>
                </div>
              </>
            )}
        </div>

        {!recipient && (
          <div id='mobile-menu' className={S.panel} hidden={!menuOpen}>
            <nav className={S.panelLinks} aria-label={t('nav.main')}>
              {sectionLinks}
              {githubLink}
            </nav>
            <div className={S.themeRow}>
              <span>{t('nav.theme')}</span>
              <ThemeToggle />
            </div>
          </div>
        )}
      </header>

      {recipient && <AboutDialog />}
    </>
  );
}
