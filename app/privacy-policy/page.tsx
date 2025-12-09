export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

        <div className="space-y-6 text-gray-700">
          <section>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Last Updated:</strong> December 9, 2024
            </p>
            <p className="mb-4">
              Welcome to SEO Kringle ("we," "our," or "us"). This Privacy Policy explains how we collect, use, and share information when you participate in our Secret Santa gift exchange program.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Important Notice About Public Information</h2>
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
              <p className="font-semibold text-yellow-900 mb-2">⚠️ Your Information Will Be Visible to Other Participants</p>
              <p className="text-yellow-800">
                By participating in SEO Kringle, you acknowledge and agree that your name, contact information (email, LinkedIn, website),
                expertise level, and wishlist will be visible to all other authenticated participants in the community directory and
                to your Secret Santa match.
              </p>
            </div>
            <p className="font-semibold text-red-600 mb-2">
              If you are not comfortable with other participants seeing your information, please DO NOT sign up for this program.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">1.1 Information You Provide</h3>
            <p className="mb-2">When you sign up and create your profile, we collect:</p>
            <ul className="list-disc list-inside space-y-1 mb-4 ml-4">
              <li>Name</li>
              <li>Email address (from LinkedIn authentication)</li>
              <li>LinkedIn profile URL</li>
              <li>Website URL (optional)</li>
              <li>SEO expertise level (Junior, Mid, Senior)</li>
              <li>Gift wishlist (preferences for gifts you'd like to receive)</li>
              <li>LinkedIn profile information (as provided by LinkedIn OAuth)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">1.2 Automatically Collected Information</h3>
            <p className="mb-2">We automatically collect:</p>
            <ul className="list-disc list-inside space-y-1 mb-4 ml-4">
              <li>Authentication data from LinkedIn OAuth</li>
              <li>Usage data (pages visited, features used)</li>
              <li>Device and browser information</li>
              <li>IP address and location data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc list-inside space-y-1 mb-4 ml-4">
              <li>Create and manage your participant account</li>
              <li>Match you with a Secret Santa giver and receiver</li>
              <li>Display your profile in the community directory (visible to all participants)</li>
              <li>Send you notifications about your Secret Santa match</li>
              <li>Facilitate the gift exchange process</li>
              <li>Improve our service and user experience</li>
              <li>Communicate with you about the program</li>
              <li>Generate anonymous statistics about participation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Information Sharing and Visibility</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">3.1 Public to All Participants</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="mb-2">The following information is visible to ALL authenticated participants:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Your full name</li>
                <li>Your email address</li>
                <li>Your LinkedIn profile URL</li>
                <li>Your website URL (if provided)</li>
                <li>Your expertise level</li>
                <li>Your complete wishlist</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">3.2 Secret Santa Matches</h3>
            <p className="mb-4">
              After the reveal date (December 29, 2025), you will be able to see who your Secret Santa is and who you are
              giving a gift to, including all their profile information.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">3.3 Third-Party Service Providers</h3>
            <p className="mb-2">We share information with:</p>
            <ul className="list-disc list-inside space-y-1 mb-4 ml-4">
              <li><strong>Supabase:</strong> Database and authentication services</li>
              <li><strong>Resend:</strong> Email delivery services</li>
              <li><strong>LinkedIn:</strong> OAuth authentication provider</li>
              <li><strong>Vercel:</strong> Hosting and infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Data Retention</h2>
            <p className="mb-4">
              We retain your information for the duration of the Secret Santa program and for a reasonable period afterward
              to facilitate gift exchanges and resolve any issues. You may request deletion of your account and associated
              data at any time by contacting us at <a href="mailto:team@seokringle.com" className="text-blue-600 hover:underline">team@seokringle.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Your Rights and Choices</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 mb-4 ml-4">
              <li>Access your personal information</li>
              <li>Update or correct your profile information</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of email notifications (except essential program communications)</li>
              <li>Withdraw from the Secret Santa program before matching occurs</li>
            </ul>
            <p className="mb-4">
              <strong>Important:</strong> Once you sign up, your information becomes visible to other participants.
              Deleting your account will remove your information from the system, but other participants may have
              already viewed or saved your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Security</h2>
            <p className="mb-4">
              We implement reasonable security measures to protect your information, including:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-4 ml-4">
              <li>Encrypted data transmission (HTTPS/SSL)</li>
              <li>Secure authentication via LinkedIn OAuth</li>
              <li>Access controls and authentication requirements</li>
              <li>Regular security updates and monitoring</li>
            </ul>
            <p className="mb-4">
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security
              of your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Children's Privacy</h2>
            <p className="mb-4">
              SEO Kringle is not intended for individuals under the age of 18. We do not knowingly collect information
              from children under 18. If you are under 18, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">8. International Users</h2>
            <p className="mb-4">
              SEO Kringle is operated from the United States. If you are accessing our service from outside the United States,
              please be aware that your information may be transferred to, stored, and processed in the United States and other
              countries where our service providers operate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
              the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the service
              after any changes constitutes your acceptance of the new Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Contact Us</h2>
            <p className="mb-2">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information,
              please contact us at:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="mb-1"><strong>Email:</strong> <a href="mailto:team@seokringle.com" className="text-blue-600 hover:underline">team@seokringle.com</a></p>
              <p><strong>Website:</strong> <a href="https://seokringle.com" className="text-blue-600 hover:underline">seokringle.com</a></p>
            </div>
          </section>

          <section className="border-t-2 border-gray-200 pt-6">
            <h2 className="text-2xl font-bold text-red-600 mb-3">Final Reminder</h2>
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="font-semibold text-red-900 mb-2">
                By signing up for SEO Kringle, you explicitly acknowledge and consent to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-red-800 ml-4">
                <li>Your name, email, LinkedIn, website, expertise, and wishlist being visible to all participants</li>
                <li>Other participants being able to contact you using your provided information</li>
                <li>Your information being used to facilitate the Secret Santa gift exchange</li>
                <li>Receiving email notifications about your Secret Santa match</li>
              </ul>
              <p className="font-semibold text-red-900 mt-4">
                If you do not agree to these terms, please do not sign up for this program.
              </p>
            </div>
          </section>

          <section className="text-center mt-8">
            <a
              href="/"
              className="inline-block px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Back to Home
            </a>
          </section>
        </div>
      </div>
    </div>
  )
}
