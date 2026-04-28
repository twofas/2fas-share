// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import S from './TermsOfUse.module.scss';
import Decors from '../../components/Decors';

/**
 * Terms of Use legal page with hardcoded content.
 * @returns {import('preact').JSX.Element} The terms of use page.
 */
export default function TermsOfUse() {
  return (
    <main className={S.terms}>
      <Decors />

      <div className='page-header'>
        <h1>2FAS Share Terms of Use</h1>
        <p className={S.termsUpdated}>
          <strong>Last Updated:</strong> March 30th, 2026
        </p>
      </div>

      <article className={`${S.termsContent} page-box`}>
        <p>
          These 2FAS Share Terms of Use ("Agreement") is between you ("you" or
          "user") and Two Factor Authentication Service, Inc. ("Company", "2FAS",
          "we", "us") and governs your use of 2FAS Share service ("Service").
        </p>

        <p>
          By downloading, accessing or using the Service, you agree: that you
          have the legal capacity to enter into this Agreement; in the event you
          act on behalf of a company or other legal entity you have the authority
          to bind that legal entity to this Agreement; and that you have reviewed
          the terms of this Agreement and agree to be bound by the terms of this
          Agreement. If you do not agree to the terms and conditions of this
          Agreement, in whole or in part, please do not use the Service.
        </p>

        <h2>1. Description of the Service</h2>

        <p>
          2FAS Share is a tool that enables users to securely share data using
          end-to-end encryption. Data shared through the Service ("Shared Data")
          is encrypted locally on the user's device before being transmitted.
          Decryption keys are not transmitted to Company's servers. The
          decryption key is contained in the URL fragment (the portion after the
          "#") and is processed on the user side. Company does not have access to
          the decryption key. "Users" of the Service include the person or entity
          creating Shared Data and link ("Sender") and any person or entity that
          accesses the Shared Data through a shared link ("Recipient").
        </p>

        <h2>2. License Grant</h2>

        <p>
          Subject to the terms of this Agreement Company grants you during the
          Term a limited, personal, non-exclusive, non-transferable,
          non-sublicensable license to access and use the Service for your
          personal and internal business uses.
        </p>

        <h2>3. Restrictions</h2>

        <p>
          You agree that you will not, and will not permit any third party to:
        </p>

        <ul>
          <li>Reverse engineer, decompile, or disassemble the Service;</li>
          <li>Redistribute or resell the Service;</li>
          <li>
            Remove copyright or proprietary notices from the Service, or use any
            Company trademark or logo without Company's prior written consent;
          </li>
          <li>Infringe on the intellectual property rights of the Company;</li>
          <li>
            Use or access the Service to create competing products or service;
          </li>
          <li>
            Interfere with or disrupt the operation, integrity, or performance of
            the Service;
          </li>
          <li>
            Circumvent or attempt to circumvent Company's security features,
            access controls, or limitations of the Service;
          </li>
          <li>
            Permit any third party to access and/or use the Service, other than
            the Users authorized under this Agreement; or attempt to gain
            unauthorized access to the Shared Data, shared links, or the Service;
          </li>
          <li>
            Access or use the Service for phishing, fraud, or impersonation;
          </li>
          <li>Distribute any stolen data, or unauthorized credentials;</li>
          <li>
            Perform or publish any performance or benchmark tests or analyses
            relating to the Service or the use thereof;
          </li>
          <li>
            Using automated systems (including bots or scripts) to access,
            scrape, or abuse the Service;
          </li>
          <li>
            Transmit any worms, viruses, Trojan horses, or any other malware,
            disruptive or harmful software or data through your access to, and
            use of, the Service;
          </li>
          <li>
            Use or access the Service for any illegal purpose including, but not
            limited to, storing or managing credentials, data, or information
            that are illegal or related to illegal activities or services;
          </li>
          <li>
            Use the Service in manner that harasses, threats, or abuses others or
            in Company's sole discretion may do any of the foregoing or otherwise
            facilitate the storage or distribution of malicious or harmful
            content; or
          </li>
          <li>
            Share any content that violates applicable laws in your jurisdiction.
          </li>
        </ul>

        <p>
          In addition to its other rights and remedies under this Agreement and
          applicable law, if Company suspects, at its sole discretion, any breach
          of the foregoing, Company may without notice to a user, suspend or
          block access to the Service, remove or invalidate encrypted data or
          shared links, or take any other action it deems appropriate to stop or
          prevent such misuse.
        </p>

        <h2>4. Data Availability, Retention, and Access Controls</h2>

        <p>When creating an item of Shared Data, the Sender determines:</p>

        <ul>
          <li>The availability period, and</li>
          <li>Whether the shared link is single-use or multi-use</li>
        </ul>

        <h3>For single-use links:</h3>

        <ul>
          <li>
            The Shared Data remains available until the Recipient initiates
            retrieval of the Shared Data
          </li>
          <li>
            Initiating retrieval (for example, by clicking "Continue") causes the
            link to be invalidated
          </li>
          <li>
            Once retrieval is initiated, the link cannot be reused, regardless of
            whether the Recipient ultimately views or decrypts the Shared Data
          </li>
          <li>
            If password protection is enabled, failure to provide the correct
            password after retrieval is initiated may result in permanent loss of
            access to the Shared Data
          </li>
        </ul>

        <h3>For multi-use links:</h3>

        <ul>
          <li>Shared Data may be accessed multiple times by Recipient</li>
          <li>
            Access to the Shared Data from the Service remains available until
            the selected expiration time
          </li>
          <li>
            Once the Shared Data has been successfully retrieved and decrypted on
            the Recipient's device:
            <ul>
              <li>
                The Shared Data may remain available within the Recipient's
                browser or device environment
              </li>
              <li>
                The Service does not revoke or remove the Shared Data that has
                already been delivered to and processed by the Recipient.
              </li>
              <li>
                Continued visibility of the Shared Data after expiration may
                occur if the Recipient has not refreshed, closed, or otherwise
                cleared the local session
              </li>
            </ul>
          </li>
        </ul>

        <p>You acknowledge and agree that:</p>

        <ul>
          <li>
            Expiration limits access to the Shared Data from the Service, but
            does not guarantee removal of Shared Data already retrieved or stored
            on a Recipient's device.
          </li>
          <li>
            Recipients are responsible for securing their device and closing or
            clearing access to sensitive data after viewing.
          </li>
          <li>
            Shared Data may become permanently inaccessible due to expiration,
            single-use access, or loss of the decryption key.
          </li>
          <li>
            Due to the architecture of the Service, Company does not have access
            to the content of Shared Data. However, as part of normal Service
            operation, standard access logs ("Access Logs") are generated by
            Company's infrastructure, which may include your IP address,
            timestamp, browser user-agent string, and the requested URL path
            (however does not include the decryption key). Access Logs are
            retained for a maximum of 3 months and are used solely for security
            and abuse prevention purposes. Access Logs do not contain any Shared
            Data or decryption keys.
          </li>
        </ul>

        <h2>5. Security; Data Loss and Recovery</h2>

        <p>
          The Service is designed using a zero-knowledge architecture which
          means:
        </p>

        <ul>
          <li>
            Encryption and decryption are performed by the applicable user
            (Sender or Recipient)
          </li>
          <li>Company does not store or process decryption keys</li>
          <li>
            Access to the Shared Data depends on possession of the correct link
            (which contains the decryption key) and, if enabled, knowledge of the
            password.
          </li>
        </ul>

        <p>
          The security of Service relies on the URI fragment identifier mechanism
          as defined in RFC 3986, Section 3.5. The decryption key is placed after
          the "#" character in the URL, which per the RFC is processed
          exclusively by the user's browser and is not transmitted to the server
          in HTTP requests (as further confirmed by RFC 9110, Section 4.2.5).
        </p>

        <p>
          As an additional security measure, the Service allows the Sender to
          protect Shared Data with an optional password. When enabled, access to
          the Shared Data requires both possession of the link and knowledge of
          the password.
        </p>

        <p>
          This password is processed on the user side and is not accessible to
          Company. The Sender is responsible for securely sharing and protecting
          the password. Loss of the password will result in permanent loss of
          access to the Shared Data.
        </p>

        <p>
          Company relies on this standard behavior for the security model of the
          Service.
        </p>

        <p>
          However, Company does not control user devices, browsers, extensions,
          or third-party software, and cannot guarantee their correct
          implementation of such specifications. Accordingly, Company does not
          have access to the Shared Data.
        </p>

        <p>
          While the Service is designed using strong cryptographic principles no
          system is completely secure and security depends on proper use by users.
          Users should exercise caution when sharing sensitive data.
        </p>

        <p>You are SOLELY responsible for:</p>

        <ul>
          <li>The content you share, including all Shared Data</li>
          <li>Maintaining back-ups of Shared Data</li>
          <li>The Recipients that share Shared Data with</li>
          <li>
            Choosing appropriate security settings (including expiration and
            access type)
          </li>
          <li>Safeguarding passwords and access to shared links</li>
        </ul>

        <p>
          If you are the Sender, you represent and warrant that you have the
          authority, right, and all necessary consents to the Shared Data and
          right to share such Shared Data with the Recipient. If you are the
          Recipient you represent and warrant that you have the authority, right,
          and all necessary consents to receive, open, and utilize the Shared
          Data.
        </p>

        <p>You acknowledge and agree that:</p>

        <ul>
          <li>
            Sharing a link with an unintended Recipient may result in
            unauthorized access to the Shared Data. Anyone with access to the
            full link may access the Shared Data.
          </li>
          <li>Security depends on how a link is handled by users.</li>
          <li>
            Because of the zero-knowledge architecture, if a link or decryption
            key is lost, Company cannot recover any Shared Data lost or
            destroyed.
          </li>
          <li>
            By using the Service you understand the zero-knowledge nature of the
            Service and use of the Service is at your sole risk, and security
            depends in part on how you use and share access to the Service.
          </li>
        </ul>

        <h3>No Liability for Data Loss:</h3>

        <p>Company is NOT liable for any data loss resulting from:</p>

        <ul>
          <li>Forgotten passwords</li>
          <li>Shared Data sent to incorrect Recipient</li>
          <li>Shared Data not accessed in a timely manner</li>
          <li>Device loss, theft, or failure</li>
          <li>Corrupted local storage</li>
          <li>Failed synchronization</li>
          <li>User deletion of data</li>
          <li>Failure to maintain backups</li>
        </ul>

        <h3>Security Recommendations:</h3>

        <p>While not obligated, we recommend users:</p>

        <ul>
          <li>Store passwords securely offline</li>
          <li>Enable all available backup options</li>
          <li>Regularly export and backup data</li>
          <li>Test recovery procedures periodically</li>
        </ul>

        <h2>6. Fees</h2>

        <p>
          The Service operates on a freemium model with functionality available
          at no cost. Company reserves the right to, and has the sole authority,
          change this policy at any time.
        </p>

        <h2>7. Disclaimer of Warranties</h2>

        <p className={S.termsUppercase}>
          The Service is provided on an "as available" and "as is" basis without
          warranties of any kind, and Company and its licensors do not make any,
          and expressly disclaim all representations, warranties, or conditions
          of any kind, either express or implied, whether oral or written,
          including but not limited to warranties of merchantability, fitness for
          a particular purpose, quiet enjoyment, non-infringement, title, that
          the Service will be error-free or uninterrupted, or that Shared Data
          will be preserved, delivered, or retrievable.
        </p>

        <h2>8. Limitation of Liability</h2>

        <p className={S.termsUppercase}>
          To the maximum extent permitted by applicable law, in no event shall
          Company be liable for any indirect, incidental, special, consequential,
          punitive damages, or exemplary damages (however arising, including
          negligence) including but not limited to loss of data, loss of profits,
          business interruption, or misuse of links or Shared Data by any third
          party; arising out of or relating to this Agreement or your use of the
          Service, even if Company has been advised of the possibility of such
          damages.
        </p>

        <p className={S.termsUppercase}>
          To the maximum extent permitted by applicable law, in no event shall
          Company's total liability to you arising out of or related to this
          Agreement, including claims relating to the Service, exceed fifty U.S.
          dollars (US$50).
        </p>

        <h2>9. Sensitive Information</h2>

        <p>
          The Service is not intended for storing or transmitting regulated health
          information, highly regulated financial data, or any other data
          requiring guaranteed compliance frameworks. Moreover, the Service is
          NOT HIPAA-compliant and is not intended for use by covered entities or
          business associates under HIPAA.
        </p>

        <ul>
          <li>
            Do NOT use the Service to store Protected Health Information (PHI) if
            you are a covered entity
          </li>
          <li>Company does NOT sign Business Associate Agreements (BAAs)</li>
          <li>
            The Service is not designed to meet HIPAA security requirements
          </li>
          <li>
            Healthcare organizations requiring HIPAA compliance should seek
            specialized solutions
          </li>
          <li>
            Individual Users may share personal health information at their own
            risk, but the Service is not designed or warranted for healthcare
            industry use.
          </li>
        </ul>

        <p>
          You should evaluate whether the Service meets your specific security
          and compliance requirements prior to use. Company makes no guarantee or
          warranties that the Service will comply with industry specific
          requirements or with specific national security laws or regulations.
          Use of the Service with such information is at your sole risk and
          responsibility.
        </p>

        <h2>10. Updates and Support</h2>

        <p>
          We reserve the right to modify, suspend, or discontinue the Service or
          any features at any time, with or without notice. Continued use of the
          Service after modifications constitutes your acceptance of the changes.
        </p>

        <p>
          Technical support is available at{' '}
          <a href='mailto:help@2fas.com'>help@2fas.com</a>.
        </p>

        <h2>11. Indemnification</h2>

        <p>
          You agree to indemnify, defend, and hold harmless Company and its
          officers, directors, employees, and agents from any claims, suits,
          demands, damages, losses, or expenses (including reasonable attorneys'
          fees) arising from:
        </p>

        <ul>
          <li>Your use of the Service</li>
          <li>Your violation of this Agreement</li>
          <li>Your violation of any third-party rights</li>
          <li>Any Shared Data</li>
          <li>Any breach of applicable law</li>
        </ul>

        <h2>12. Term; Termination; Suspension</h2>

        <ul>
          <li>
            This Agreement becomes effective when you first access, install, or
            use the Service and remains in force until terminated by either party
            ("Term").
          </li>
          <li>
            You may terminate this Agreement by uninstalling or stop using the
            Service.
          </li>
          <li>
            You acknowledge and agree that Company in its sole discretion and
            without advance notice may immediately suspend or terminate this
            Agreement and your access to the Service if you have, or Company
            reasonably believes you have, breached any provision of this
            Agreement. Depending on the type of your breach, we may take any and
            all actions as we reasonably deem appropriate and/or required or
            permitted by law, including without limitation notifying the competent
            law enforcement, government or regulatory bodies.
          </li>
          <li>
            Upon termination, all rights granted to you under this Agreement
            immediately cease, you will immediately cease use of the Service, and
            you must uninstall and delete all copies of the Service from your
            devices, and will cause any of your users to do the same.
          </li>
          <li>
            Any termination of this Agreement (howsoever occasioned) shall not
            affect any accrued rights or liabilities of either party.
          </li>
        </ul>

        <h2>13. Changes to this Agreement</h2>

        <p>
          We may update this Agreement from time to time by posting an updated
          version on our website. Such modifications become effective upon the
          earlier of (a) your access or use of the Service after the date the
          revised Agreement has been posted and (b) 30 days' after the
          modifications are posted. Your continued access to or use of the
          Service after the modifications have become effective will be deemed
          conclusive acceptance of the updated Agreement.
        </p>

        <h2>14. Compliance with Law; Export Controls</h2>

        <p>
          You agree to comply with all applicable laws, including all United
          States export laws, in connection with your use of the Service. The
          Service may not be exported or re-exported to any embargoed country or
          to anyone on the U.S. Treasury Specially Designated Nationals or
          Commerce Denied Persons lists. You represent and warrant that you are
          not restricted under applicable law from accessing or using the
          Service.
        </p>

        <h2>15. Open-Source Software</h2>

        <p>
          The Service is released under the GNU General Public License v3.0
          ("GPLv3"). You acknowledge and agree that by using the Service you will
          comply with all applicable terms and restrictions of GPLv3. Certain
          aspects of the Service also may incorporate open-source components
          ("Open-Source Software") owned by third parties. Such Open-Source
          Software is not subject to the terms of this Agreement, and is instead
          licensed under the respective terms, associated with such Open-Source
          Software. Nothing in this Agreement limits your rights or obligations
          under GPLv3 or the licenses applicable to the Open-Source Software
          owned by third parties.
        </p>

        <h2>16. Accessibility</h2>

        <p>
          We strive to make our Service accessible to users with disabilities in
          accordance with applicable accessibility standards. If you encounter
          accessibility barriers, please contact us at{' '}
          <a href='mailto:ada@2fas.com'>ada@2fas.com</a> so we can work to
          address them. However, we do not warrant that the Service will meet all
          accessibility requirements or be compatible with all assistive
          technologies.
        </p>

        <h2>17. Ownership</h2>

        <p>
          As between the parties the Company owns all right, title, and interest
          in and to the Service, and all configurations of any part(s) of the
          Service (including its documentation), including all intellectual
          property and other proprietary rights in each of the foregoing. You
          acknowledge and agree that (a) you do not acquire any rights, express
          or implied, in or to the Service, except as specifically provided in
          this Agreement; and (b) any configuration or deployment of the Service
          will not affect or diminish Company rights, title, and interest in and
          to the Service as applicable. All brand, product, and service names and
          marks used in the Service which identify Company are proprietary names
          and marks of Company. Nothing in the Service will be deemed to confer
          on you or any third party any license or right with respect to any such
          name or mark. You may not publish, distribute, extract, reuse, or
          reproduce any content from the Service or Company's website in any form
          other than in accordance with this Agreement. You will not remove,
          alter, or obscure any proprietary notices (including copyright notices)
          of Company or its suppliers in the Service or its documentation.
        </p>

        <h2>18. Confidentiality</h2>

        <p>
          During your use of the Service, Company may provide you access to its
          Confidential Information. "Confidential Information" means all
          information of the Company discloses to you or a User that is marked or
          identified as confidential or disclosed in circumstances that would
          lead a reasonable person to believe such information is confidential.
          You agree to not use Confidential Information for any purpose not
          expressly permitted by this Agreement, and will not disclose the
          Confidential Information, except to your representatives who have a
          need to know such information for purposes of this Agreement and who
          are bound by confidentiality obligations no less restrictive than those
          contained herein, and you are responsible for any prohibited disclosure
          or use of Confidential Information disclosed to such recipients. You
          will protect the Confidential Information from unauthorized use, access,
          or disclosure in the same manner you protect your own confidential or
          proprietary information of a similar nature and with no less than
          reasonable care. Upon termination or expiration of this Agreement, or
          upon written request of Company, you will immediately return or destroy
          any and all materials containing any Confidential Information. Breach
          of this Section could cause irreparable harm and damage to the Company.
          Thus, in addition to all other remedies available at law or in equity,
          the Company will have the right to seek equitable and injunctive
          relief, and to recover the amount of damages (including reasonable
          attorneys' fees and expenses) incurred in connection with such
          unauthorized use or disclosure.
        </p>

        <h2>19. Dispute Resolution and Arbitration</h2>

        <p>
          <strong>
            Please read this section carefully. It affects your legal rights.
          </strong>
        </p>

        <h3>19.1 Informal Resolution</h3>

        <p>
          Before filing any formal proceedings, you agree to first contact us at{' '}
          <a href='mailto:legal@2fas.com'>legal@2fas.com</a> to attempt to
          resolve any dispute informally. We will attempt to resolve the dispute
          in good faith within sixty (60) days of receiving notice.
        </p>

        <h3>19.2 Binding Arbitration</h3>

        <p className={S.termsUppercase}>
          If we cannot resolve the dispute informally, you agree that any dispute
          arising out of or relating to this Agreement or relating to the Service
          shall be resolved through binding arbitration, except as set forth in
          Section 19.3 below, and not in front of judge or jury.
        </p>

        <p>
          The arbitration will be conducted by the American Arbitration
          Association ("AAA") under its Commercial Arbitration Rules (or if you
          are an individual and use the Service for personal use, or if the value
          of the dispute is less than $75,000 whether or not you are an
          individual or how you use the Service, its Consumer Arbitration Rules),
          as modified by this Agreement. The arbitration may be conducted
          virtually or at another mutually agreed location. The arbitrator's
          decision will be final and binding.
        </p>

        <h3>19.3 Exceptions</h3>

        <p>
          The following disputes are not subject to arbitration in Section 19.2:
        </p>

        <ul>
          <li>
            Disputes relating to the theft, piracy, or unauthorized use of
            intellectual property
          </li>
          <li>Claims for injunctive relief</li>
        </ul>

        <h3>19.4 Opt-Out Right</h3>

        <p>
          You have the right to opt out of this arbitration agreement by sending
          written notice to{' '}
          <a href='mailto:legal@2fas.com'>legal@2fas.com</a> within thirty (30)
          days of first accepting this Agreement. Your notice must include your
          name, address, and a clear statement that you want to opt out of
          arbitration.
        </p>

        <h3>19.5 Class Action Waiver</h3>

        <p className={S.termsUppercase}>
          You agree that you may only bring claims against the Company in your
          individual capacity, and not as a plaintiff or class member in any
          purported class or representative proceeding. The arbitrator may not
          consolidate more than one person's claims and may not preside over any
          form of representative or class proceeding.
        </p>

        <h3>19.6 Severability</h3>

        <p>
          If any part of this arbitration provision is found to be unenforceable,
          the remainder shall remain in effect. If the class action waiver is
          found to be unenforceable, then the entire arbitration provision shall
          be null and void.
        </p>

        <h2>20. Governing Law</h2>

        <p>
          This Agreement is governed by the laws of the State of Nevada, United
          States, without regard to conflict of law principles. You and we
          irrevocably consent to the exclusive jurisdiction and venue of the
          state or federal courts in Nevada, for all disputes arising out of or
          relating to this Agreement that are not heard in arbitration as
          described above.
        </p>

        <h2>21. Miscellaneous</h2>

        <p>
          <strong>Feedback.</strong> Any feedback, suggestions, or ideas you
          provide related to the Service may be used freely by the Company
          without compensation or obligation to you, and you hereby grant the
          Company a royalty-free, worldwide, transferable, sublicensable,
          irrevocable, and perpetual license to use such feedback for any lawful
          purpose.
        </p>

        <p>
          <strong>Entire Agreement.</strong> This Agreement constitutes the
          entire agreement between you and Company regarding the subject matter
          hereto and supersedes any and all oral or written agreements or
          understandings between the parties as to the subject matter of this
          Agreement.
        </p>

        <p>
          <strong>Severability.</strong> If any provision of this Agreement is
          held to be invalid or unenforceable for any reason, the remaining
          provisions will remain in full force.
        </p>

        <p>
          <strong>Waiver.</strong> Failure to enforce any right or provision shall
          not constitute a waiver of that right or provision. Any waiver of
          party's rights under this Agreement must be in the form of an explicit
          written waiver and signed by an authorized representative of the
          applicable party.
        </p>

        <p>
          <strong>Force Majeure.</strong> Company is not liable for any delay or
          failure to perform its obligations under this Agreement caused by
          events beyond its reasonable control, including acts of God, war, or
          Internet outages.
        </p>

        <p>
          <strong>Survival.</strong> Sections 3-5, 7, 8, 11-13 and 17-21 shall
          survive termination of this Agreement.
        </p>

        <p>
          <strong>Independent Contractors.</strong> The parties to this Agreement
          are independent contractors and no agency, partnership, joint venture,
          or employee-employer relationship is intended or created by this
          Agreement. Neither party will have the power to obligate or bind the
          other party.
        </p>

        <p>
          <strong>Assignment.</strong> You may not assign or transfer, by
          operation of law or otherwise, this Agreement, or any of your rights
          under this Agreement or delegate any of your duties under this
          Agreement to any third party without the Company's prior written
          consent. Company may freely assign or transfer this Agreement without
          your consent.
        </p>

        <p>
          <strong>Contact and Notice.</strong> For legal or licensing questions:{' '}
          <a href='mailto:legal@2fas.com'>legal@2fas.com</a> with the subject
          line "Legal".
        </p>

        <p>
          Any notices to Company required or permitted under this Agreement will
          be sent to Company at{' '}
          <a href='mailto:legal@2fas.com'>legal@2fas.com</a>, or at such other
          address as Company will specify in writing. Any notices to you required
          or permitted under this Agreement will be given at the email address
          provided by you, or at such other email address that you specify in
          writing. Such notice will be deemed given upon personal delivery; if
          sent by email, upon a confirmation response; or if sent by overnight
          courier, one (1) day after the date of delivery to the courier.
        </p>

      </article>
    </main>
  );
}
