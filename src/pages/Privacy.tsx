const Privacy = () => (
  <main className="min-h-screen bg-background text-surface-dark-fg">
    <section className="py-24 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="rounded-[2rem] border border-surface-dark-fg/10 bg-surface-dark p-10 shadow-[0_25px_100px_rgba(0,0,0,0.08)] backdrop-blur-xl">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.4em] text-primary font-semibold font-body">MOGG APP</p>
                <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight font-display">Privacy Policy</h1>
                <p className="text-sm text-surface-dark-fg/60 font-body">Effective Date: April 8, 2026</p>
              </div>

              <div className="space-y-8 text-sm leading-7 text-surface-dark-fg/85 font-body">
                <p>At MOGG APP, your privacy is important to us. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data. By using the App, you agree to the practices described in this policy.</p>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">1. Information We Collect</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">1.1 Information You Provide</h3>
                      <p>When you use MOGG APP, you may provide us with:</p>
                      <ul className="list-inside list-disc space-y-2 pl-5">
                        <li>Account information: name, email address, username, and password</li>
                        <li>Profile information: age, gender (optional)</li>
                        <li>Facial photos: images you upload for AI analysis and rating</li>
                        <li>Payment information: processed securely via third-party payment providers (we do not store card details)</li>
                        <li>Communications: messages or feedback you send to us</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">1.2 Information Collected Automatically</h3>
                      <p>When you use the App, we automatically collect:</p>
                      <ul className="list-inside list-disc space-y-2 pl-5">
                        <li>Device information: device type, operating system, unique device identifiers</li>
                        <li>Usage data: features used, session duration, clicks and interactions</li>
                        <li>Log data: IP address, app crashes, performance data</li>
                        <li>Analytics data: aggregated, anonymized usage statistics</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">1.3 Information from Third Parties</h3>
                      <p>If you sign in using a third-party service (e.g., Google, Apple), we may receive basic profile information such as your name and email address from that provider, subject to their own privacy policies.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">2. Facial Photo & Biometric Data</h2>
                  <p>Because MOGG APP processes photos of your face, we want to be fully transparent about how this sensitive data is handled.</p>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">2.1 How Your Photos Are Used</h3>
                      <ul className="list-inside list-disc space-y-2 pl-5">
                        <li>Your photo is sent to our AI processing system solely to generate your aesthetic rating and analysis</li>
                        <li>Photos are processed in real time and are not permanently stored on our servers after analysis is complete</li>
                        <li>We do not use your photos to build or train AI models without your explicit, separate consent</li>
                        <li>We do not share, sell, or transfer your facial photos to any third party</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">2.2 Biometric Data Compliance</h3>
                      <p>In jurisdictions where facial geometry or biometric identifiers derived from photos are protected by law (including but not limited to Illinois BIPA, Texas CUBI, and EU GDPR), we treat such data with the highest level of protection. We:</p>
                      <ul className="list-inside list-disc space-y-2 pl-5">
                        <li>Collect only the minimum data necessary for the service</li>
                        <li>Do not sell biometric data under any circumstances</li>
                        <li>Provide users the right to request deletion of their biometric data at any time</li>
                        <li>Retain biometric data only for the duration required to complete the analysis</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">3. How We Use Your Information</h2>
                  <p>We use the information we collect to:</p>
                  <ul className="list-inside list-disc space-y-2 pl-5">
                    <li>Provide, operate, and improve the App and its features</li>
                    <li>Process your photos and generate AI-powered ratings and feedback</li>
                    <li>Manage your account and process transactions</li>
                    <li>Send you service-related notifications and updates</li>
                    <li>Respond to your questions and support requests</li>
                    <li>Detect and prevent fraud, abuse, or violations of our Terms of Service</li>
                    <li>Comply with legal obligations</li>
                    <li>Conduct analytics to understand how users interact with the App</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">4. How We Share Your Information</h2>
                  <p>We do not sell your personal data. We may share your information only in the following limited circumstances:</p>
                  <div className="space-y-4 pl-5">
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">4.1 Service Providers</h3>
                      <p>We work with trusted third-party service providers who assist us in operating the App, including cloud hosting, payment processing, and analytics. These providers are contractually required to protect your data and may only use it to perform services on our behalf.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">4.2 Legal Requirements</h3>
                      <p>We may disclose your information if required to do so by law, court order, or government authority, or if we believe disclosure is necessary to protect the rights, property, or safety of MOGG APP, our users, or the public.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">4.3 Business Transfers</h3>
                      <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity. We will notify you before your data becomes subject to a different privacy policy.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">5. Data Retention</h2>
                  <p>We retain your personal data for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time by contacting us at mooggapp@gmail.com.</p>
                  <p>Facial photos uploaded for analysis are deleted from our servers upon completion of the analysis request. We do not maintain a library of user-submitted photos.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">6. Data Security</h2>
                  <p>We implement industry-standard security measures to protect your information, including:</p>
                  <ul className="list-inside list-disc space-y-2 pl-5">
                    <li>Encrypted data transmission (HTTPS/TLS)</li>
                    <li>Secure storage with access controls</li>
                    <li>Regular security reviews and monitoring</li>
                  </ul>
                  <p>However, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security, and you use the App at your own risk.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">7. Children&apos;s Privacy</h2>
                  <p>MOGG APP is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal data, we will delete it immediately. If you believe a child under 13 has used the App, please contact us at mooggapp@gmail.com.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">8. Your Privacy Rights</h2>
                  <div className="space-y-4 pl-5">
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">8.1 General Rights (All Users)</h3>
                      <ul className="list-inside list-disc space-y-2 pl-5">
                        <li>Access: request a copy of the personal data we hold about you</li>
                        <li>Correction: request correction of inaccurate or incomplete data</li>
                        <li>Deletion: request deletion of your personal data ("right to be forgotten")</li>
                        <li>Portability: request your data in a portable format</li>
                        <li>Objection: object to certain types of data processing</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">8.2 GDPR Rights (EU/EEA Users)</h3>
                      <p>If you are located in the European Union or European Economic Area, you have additional rights under the General Data Protection Regulation (GDPR), including the right to lodge a complaint with your local data protection authority.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">8.3 CCPA Rights (California Users)</h3>
                      <p>If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA), including the right to know what personal data is collected, the right to opt out of sale (we do not sell your data), and the right to non-discrimination for exercising your rights.</p>
                      <p>To exercise any of your rights, contact us at mooggapp@gmail.com. We will respond within 30 days.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">9. Cookies & Tracking Technologies</h2>
                  <p>The App may use cookies, pixels, and similar tracking technologies to enhance your experience and collect usage data. You can control cookie settings through your device or browser settings. Disabling cookies may affect some features of the App.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">10. Third-Party Links & Services</h2>
                  <p>The App may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties. We encourage you to review their privacy policies before providing any personal information.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">11. International Data Transfers</h2>
                  <p>Your information may be transferred to and processed in countries other than your own. We take appropriate safeguards to ensure your data is protected in accordance with this Privacy Policy regardless of where it is processed, including the use of standard contractual clauses where required.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">12. Changes to This Privacy Policy</h2>
                  <p>We may update this Privacy Policy from time to time. When we make significant changes, we will notify you via the App or by email. The effective date at the top of this policy will always reflect the most recent update. Your continued use of the App after changes constitutes acceptance of the updated policy.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">13. Contact Us</h2>
                  <p>If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:</p>
                  <p className="font-semibold">MOGG APP</p>
                  <p>Email: mooggapp@gmail.com</p>
                  <p>Instagram: @mogg_app</p>
                  <p className="mt-4 font-semibold">We are committed to resolving privacy concerns promptly and transparently.</p>
                  <p className="mt-4 font-semibold">MOGG AND GET MOGGED — The #1 Looksmaxxing App</p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
);

export default Privacy;
