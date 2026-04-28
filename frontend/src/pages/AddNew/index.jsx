// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useEffect } from 'preact/hooks';
import AddNewBox from '../../components/AddNewBox';
import Decors from '../../components/Decors';
import { t } from '@/i18n';

/**
 * Page for creating a new secure share.
 * @returns {import('preact').JSX.Element} The add new page.
 */
export default function AddNew() {
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const handler = () => setResetKey(k => k + 1);
    window.addEventListener('resetAddForm', handler);

    return () => window.removeEventListener('resetAddForm', handler);
  }, []);

  return (
    <main>
      <Decors />
      
      <div className='page-header'>
        <h1>{t('addNew.title')}</h1>
        <p>{t('addNew.subtitle')}</p>
      </div>

      <AddNewBox key={resetKey} />
    </main>
  );
}
