// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import WelcomeSection from '../../components/WelcomeSection';
import HowToUse from '../../components/HowToUse';
import Banner from '../../components/Banner';
import SecurityPrivacy from '../../components/SecurityPrivacy';
import { t } from '@/i18n';

/**
 * Home landing page.
 * @returns {import('preact').JSX.Element} The home page.
 */
export default function Home() {
  return (
    <main>
      <WelcomeSection />
      <HowToUse />
      <Banner />
      <SecurityPrivacy />
    </main>
  );
}
