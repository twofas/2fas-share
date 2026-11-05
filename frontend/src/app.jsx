// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { Suspense } from 'preact/compat';
import { Router, Switch, Route } from 'wouter-preact';
import { useHashLocation } from 'wouter-preact/use-hash-location';
import Header from './components/Header';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Footer from './components/Footer';
import {
  AddNew,
  ValidatedRoute,
  NotFound,
  TermsOfUse,
  PrivacyPolicy,
  OpenSourceLicenses
} from './lazyRoutes';

/**
 * Root application component with hash-based routing.
 * Non-home routes are lazy-loaded; Footer lives inside Suspense so it is
 * hidden during chunk loads (no Footer flashing under Header).
 * @returns {import('preact').JSX.Element} The routed application.
 */
export default function App() {
  return (
    <Router hook={useHashLocation}>
      <ScrollToTop />
      <Header />
      <Suspense fallback={<main aria-busy='true' />}>
        <Switch>
          <Route path='/' component={Home} />
          <Route path='/add' component={AddNew} />
          <Route path='/terms-of-use' component={TermsOfUse} />
          <Route path='/privacy-policy' component={PrivacyPolicy} />
          <Route path='/open-source-licenses' component={OpenSourceLicenses} />
          <Route path='/:id/:type/:nonce/:key' component={ValidatedRoute} />
          <Route component={NotFound} />
        </Switch>
        <Footer />
      </Suspense>
    </Router>
  );
}
