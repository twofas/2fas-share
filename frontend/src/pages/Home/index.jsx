// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import WelcomeSection from '../../components/WelcomeSection';
import HowToUse from '../../components/HowToUse';
import EncryptionBand from '../../components/EncryptionBand';
import Features from '../../components/Features';
import Faq from '../../components/Faq';
import Banner from '../../components/Banner';

/**
 * Home landing page: hero with the generator, then sections 02–06
 * (how it works and the four steps, encryption band, features, FAQ, final CTA).
 * @returns {import('preact').JSX.Element} The home page.
 */
export default function Home () {
  return (
    <main id='content'>
      <WelcomeSection />
      <HowToUse />
      <EncryptionBand />
      <Features />
      <Faq />
      <Banner />
    </main>
  );
}
