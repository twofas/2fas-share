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
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t } from '@/i18n';
import { useTheme } from '@/utils/theme';
import { scrollToSection, scrollToTop } from '@/utils/scrollToSection';
import { parseDuration } from '@/utils/scrollMotion';
import { prefersReducedMotion } from '@/utils/reducedMotion';
import AboutDialog, { openAboutDialog } from '@/components/AboutDialog';
import Logo from '@/assets/logo-share.svg?react';
import SunIcon from '@/assets/icons/sun-line.svg?react';
import MoonIcon from '@/assets/icons/moon-clear-line.svg?react';
import ArrowIcon from '@/assets/icons/arrow-right-up-line.svg?react';
import MenuIcon from '@/assets/icons/menu-line.svg?react';
import CloseIcon from '@/assets/icons/close-line.svg?react';
import { requestGeneratorFocus } from '@/utils/generatorFocus';
import { isRecipientLayout } from '@/utils/validateShareParams';

const GITHUB_URL = 'https://github.com/twofas/2fas-share';
const SCROLL_THRESHOLD = 340;
const LOCK_MS = 1600;
const SECTIONS = [
  { id: 'how-it-works', label: 'nav.howItWorks' },
  // The features section follows the encryption band and counts as part of it for the scrollspy.
  { id: 'security', label: 'nav.security', spans: ['security', 'features'] },
  { id: 'faq', label: 'nav.faq' }
];

/**
 * Elements of the page that make a nav section current.
 * @param {{ id: string, spans?: string[] }} section Entry of SECTIONS.
 * @returns {HTMLElement[]} Elements present in the document.
 */
const sectionElements = ({ id, spans = [id] }) =>
  spans.map(span => document.getElementById(span)).filter(Boolean);

/**
 * Whether a click should stay with the browser: another button or a modifier
 * key (new tab, new window, download).
 * @param {MouseEvent} e Click event.
 * @returns {boolean} True when the script must not take over the link.
 */
const isModifiedClick = e => e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

/**
 * Button / nav icon: Icon=Menu (menu-line, 16 px) and Icon=Close (close-line,
 * 20 px) cross-fade with a small scale (MOTION M-16); the stylesheet picks the
 * icon from aria-expanded on the button.
 * @returns {import('preact').JSX.Element} Both icons.
 */
function MenuGlyph () {
  return (
    <>
      <MenuIcon className={S.iconMenu} />
      <CloseIcon className={S.iconClose} />
    </>
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
 * section anchors, GitHub and the "create" CTA; below 1024 px (or a bar
 * narrower than 43.25 rem) the links sit in the menu panel (MOBILE-MENU.md).
 * Recipient context: only the logo, the button opening Dialog / about and the
 * theme toggle.
 * @returns {import('preact').JSX.Element} The header component.
 */
export default function Header () {
  const [location, navigate] = useHashLocation();
  const recipient = isRecipientLayout(location);
  const onGenerator = location === '/add';
  const [scrolled, setScrolled] = useState(false);
  // menuOpen is the state of the button (aria-expanded, the page inert);
  // panelOpen paints the panel and the backdrop. They differ only while a
  // collapsed bar expands before the panel opens (BEHAVIOR-SPEC 59.8).
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const headerRef = useRef(null);
  const barRef = useRef(null);
  const panelRef = useRef(null);
  const scrimRef = useRef(null);
  const menuButtonRef = useRef(null);
  const menuOpenRef = useRef(false);
  const scrolledRef = useRef(false);

  menuOpenRef.current = menuOpen;
  scrolledRef.current = scrolled;

  useEffect(() => {
    /**
     * Collapse the bar once the page scrolls past SCROLL_THRESHOLD.
     * @returns {void}
     */
    const update = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);

    update();
    window.addEventListener('scroll', update, { passive: true });

    return () => window.removeEventListener('scroll', update);
  }, []);

  // The measured row height feeds --nav-bottom below 1024 px (scroll-padding,
  // the panel height, the space above the focus views), so enlarged text
  // moves them too (MOBILE-MENU.md, "anchors below the bar").
  useEffect(() => {
    const bar = barRef.current;
    const root = document.documentElement;

    if (!bar || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      root.style.setProperty('--navbar-row', `${bar.offsetHeight}px`);
    });

    observer.observe(bar);

    return () => {
      observer.disconnect();
      root.style.removeProperty('--navbar-row');
    };
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  // Scrollspy: the section in view gets aria-current="location" in the bar
  // (Link / nav, State=Active). Only on the home page.
  const [activeSection, setActiveSection] = useState(null);
  // After a click the clicked section stays active while the page scrolls to it, so the bar does not flash
  // through the sections on the way.
  const lockRef = useRef(null);
  const lockCancelRef = useRef(null);

  // Drop a pending lock when the header unmounts.
  useEffect(() => () => lockCancelRef.current?.(), []);

  useEffect(() => {
    if (location !== '/') {
      setActiveSection(null);
      return;
    }

    /** Pick the section that spans the line under the bar (BEHAVIOR-SPEC 54.3). */
    const update = () => {
      // The line is the bottom of the bar plus 8 px, and never above the
      // place where an anchor jump puts the section (scroll-padding-top plus
      // 1 px): otherwise the section a link has just scrolled to would not
      // count as current once the click lock is released.
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const line = Math.max((barRef.current?.getBoundingClientRect().bottom ?? 0) + 8, padding + 1);
      let current = null;

      for (const section of SECTIONS) {
        for (const el of sectionElements(section)) {
          const rect = el.getBoundingClientRect();

          if (rect.top <= line && rect.bottom > line) {
            current = section.id;
          }
        }
      }

      // At the very bottom of the page the last section still on screen is current (the footer is short).
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;

      if (atBottom) {
        for (const section of SECTIONS) {
          if (sectionElements(section).some(el => el.getBoundingClientRect().top < window.innerHeight)) {
            current = section.id;
          }
        }
      }

      if (lockRef.current) {
        current = lockRef.current;
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

  // Opening on a collapsed bar: the bar first expands to its rest state (the
  // `collapsed` class goes at once, its tracks take motion/duration/layout),
  // then the panel opens. Closing: the panel goes at once.
  useEffect(() => {
    if (!menuOpen) {
      setPanelOpen(false);
      return;
    }

    if (!scrolledRef.current || prefersReducedMotion()) {
      setPanelOpen(true);
      return;
    }

    const wait = parseDuration(getComputedStyle(document.documentElement).getPropertyValue('--motion-duration-layout'));
    const timer = setTimeout(() => setPanelOpen(true), wait);

    return () => clearTimeout(timer);
  }, [menuOpen]);

  // Focus moves to the first link once the panel is shown.
  useEffect(() => {
    if (panelOpen) {
      panelRef.current?.querySelector('a[href], button')?.focus();
    }
  }, [panelOpen]);

  // While the menu is open the rest of the page is inert: the siblings of the
  // bar at every level of the tree up to <body>, "Skip to content" included,
  // except the backdrop, which takes the click outside. The earlier state of
  // each element comes back on close, in the same commit, so the next Tab
  // after Escape already reaches the page.
  useLayoutEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previous = new Map();

    for (let el = headerRef.current; el && el.parentElement && el !== document.body; el = el.parentElement) {
      for (const sibling of el.parentElement.children) {
        if (sibling !== el && sibling !== scrimRef.current) {
          previous.set(sibling, sibling.inert);
          sibling.inert = true;
        }
      }
    }

    /**
     * Escape closes the menu and returns focus to the menu button.
     * @param {KeyboardEvent} e - Key event.
     */
    const onKey = e => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      previous.forEach((wasInert, el) => { el.inert = wasInert; });
    };
  }, [menuOpen]);

  // One condition for the bar links and the menu button (MOBILE-MENU.md, "One
  // condition"): the stylesheet hides the menu button from 1024 px when the bar
  // is at least 43.25 rem wide, and the script reads whether the button is
  // displayed. When it disappears an open menu closes, and focus that was in
  // the panel or on the button moves to "Create link" (the logo on /add). The
  // browser can drop focus from the hidden button before the observer runs,
  // so the last focused element is remembered.
  useEffect(() => {
    const button = menuButtonRef.current;

    if (!button) {
      return;
    }

    let lastFocus = null;
    let menuMode = button.getClientRects().length > 0;

    /**
     * Remember the last focused element.
     * @param {FocusEvent} e - Focus event.
     */
    const onFocusIn = e => { lastFocus = e.target; };

    /** React to the menu button appearing or disappearing. */
    const sync = () => {
      const shown = button.getClientRects().length > 0;

      if (shown === menuMode) {
        return;
      }

      menuMode = shown;

      if (shown) {
        return;
      }

      const active = document.activeElement;
      /**
       * Whether an element is the menu button or sits in the panel.
       * @param {Element|null} el - Element to test.
       * @returns {boolean} True for the button or a panel descendant.
       */
      const inMenu = el => !!el && (el === button || !!panelRef.current?.contains(el));
      const noFocus = !active || active === document.body;
      const moveFocus = inMenu(active) || (noFocus && (menuOpenRef.current || inMenu(lastFocus)));

      setMenuOpen(false);

      if (moveFocus) {
        const target = headerRef.current?.querySelector('[data-nav-cta]') ?? headerRef.current?.querySelector('[data-nav-logo]');

        target?.focus();
      }
    };

    document.addEventListener('focusin', onFocusIn);
    window.addEventListener('resize', sync);

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(sync);

    observer?.observe(button);
    observer?.observe(headerRef.current);

    return () => {
      document.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('resize', sync);
      observer?.disconnect();
    };
  }, [recipient]);

  /** Close the menu from the backdrop: a click outside the bar; focus returns to the menu button. */
  const closeFromBackdrop = () => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  /**
   * Section anchor: on the home page the page scrolls to the section (MOTION
   * M-24), from another route the home page opens at the section. A click with
   * a modifier key stays with the browser.
   * @param {MouseEvent} e Click event.
   * @param {string} id Target section id.
   */
  const goToSection = (e, id) => {
    if (isModifiedClick(e)) {
      return;
    }

    e.preventDefault();
    setMenuOpen(false);

    const fromOtherRoute = location !== '/';

    if (fromOtherRoute) {
      navigate('/');
    }

    // One lock per click: a newer click cancels the timer of the previous one, so an old release can never free
    // the newest lock. Released when the scroll ends (the scroll runs in JavaScript, so its end is reported by
    // scrollToSection, not by scrollend), or after 1.6 s; then the section in view is computed again.
    lockCancelRef.current?.();
    lockRef.current = id;
    setActiveSection(id);

    let timer = 0;
    /**
     * Drop the pending lock release.
     * @returns {void}
     */
    const cancel = () => clearTimeout(timer);

    /** Release this click's lock, unless a newer click owns the lock. */
    function release () {
      cancel();

      if (lockCancelRef.current !== cancel) {
        return;
      }

      lockCancelRef.current = null;
      lockRef.current = null;
      window.dispatchEvent(new Event('scroll'));
    }

    lockCancelRef.current = cancel;
    timer = setTimeout(release, LOCK_MS);
    scrollToSection(id, { onEnd: release, instant: fromOtherRoute });
  };

  /**
   * The logo on the home page scrolls to the top (BEHAVIOR-SPEC 59.4); the
   * address and the focus stay. From any other page it opens the home page.
   * @param {MouseEvent} e Click event.
   */
  const onLogoClick = e => {
    if (location !== '/' || isModifiedClick(e)) {
      return;
    }

    e.preventDefault();
    setMenuOpen(false);
    scrollToTop();
  };

  /** "GitHub" in the panel opens the repository in a new tab and closes the panel (BEHAVIOR-SPEC 59.7). */
  const onGithubClick = () => {
    if (menuOpenRef.current) {
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    }
  };

  const sectionLinks = SECTIONS.map(({ id, label }) => (
    <a
      key={id}
      className={`${lnk.navLink} ${lnk.navSection}`}
      href='#/'
      aria-current={activeSection === id ? 'location' : undefined}
      onClick={e => goToSection(e, id)}
    >
      {t(label)}
    </a>
  ));

  const githubLink = (
    <a className={lnk.navLink} href={GITHUB_URL} target='_blank' rel='noopener noreferrer' onClick={onGithubClick}>
      {t('nav.github')}
      <ArrowIcon />
      <span className='visually-hidden'>{t('nav.newTab')}</span>
    </a>
  );

  const collapsed = scrolled && !menuOpen;
  // A closing panel goes (and turns inert) in the same render as the button.
  const shown = menuOpen && panelOpen;

  return (
    <>
      {!recipient && (
        <div
          ref={scrimRef}
          id='menu-backdrop'
          className={`${S.scrim} ${shown ? S.scrimVisible : ''}`}
          aria-hidden='true'
          onClick={closeFromBackdrop}
        />
      )}

      <header
        ref={headerRef}
        className={`${S.header} ${collapsed ? S.scrolled : ''} ${recipient ? S.recipient : ''}`}
      >
        <div ref={barRef} className={S.bar}>
          <PrefetchLink href='/' className={S.logo} aria-label={t('header.logoAlt')} data-nav-logo onClick={onLogoClick}>
            <Logo />
          </PrefetchLink>

          {recipient
            ? (
              <>
                <nav className={`${S.menu} ${S.recipientMenu}`} aria-label={t('nav.main')}>
                  <button type='button' className={lnk.navLink} onClick={openAboutDialog}>
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
                    <PrefetchLink href='/add' className={`${btn.cta} ${btn.ctaSmall}`} data-nav-cta onClick={requestGeneratorFocus}>
                      {t('v2.header.shareSecurely')}
                    </PrefetchLink>
                  )}

                  <button
                    ref={menuButtonRef}
                    type='button'
                    className={`${btn.navControl} ${S.menuButton} ${S.mobileOnly}`}
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
          <div
            ref={panelRef}
            id='mobile-menu'
            className={`${S.panel} ${S.mobileOnly} ${shown ? S.panelOpen : ''}`}
            inert={!shown}
          >
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
