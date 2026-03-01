import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — SideFlip",
  description: "SideFlip Privacy Policy",
};

const EFFECTIVE_DATE = "March 1, 2026";
const CONTACT_EMAIL = "sudnas11@gmail.com";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-zinc-50">Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-500">Effective date: {EFFECTIVE_DATE}</p>

      <div className="mt-10 space-y-10 text-sm text-zinc-400 leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">1. Overview</h2>
          <p>
            SideFlip (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) takes your privacy seriously. This policy explains
            what personal data we collect, why we collect it, how it is stored, and your
            rights regarding that data. SideFlip is operated as a personal project, not a
            registered company.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">2. Data We Collect</h2>

          <h3 className="font-medium text-zinc-300 mt-4 mb-2">2.1 Account &amp; Authentication Data</h3>
          <p className="mb-3">
            Authentication is handled by <strong className="text-zinc-300">Clerk</strong>. When
            you sign up, Clerk collects your email address and (optionally) your name and
            profile photo. Clerk may also use cookies and device identifiers for session
            management. Clerk&apos;s own{" "}
            <a
              href="https://clerk.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300"
            >
              Privacy Policy
            </a>{" "}
            governs how Clerk processes your data.
          </p>

          <h3 className="font-medium text-zinc-300 mt-4 mb-2">2.2 Profile Data</h3>
          <p>
            Information you voluntarily enter into your SideFlip profile: display name, bio,
            location, website URL, Twitter handle, and GitHub username. This data is stored
            in our Supabase database and is publicly visible on your seller profile page.
          </p>

          <h3 className="font-medium text-zinc-300 mt-4 mb-2">2.3 Listing Data</h3>
          <p>
            Content you submit when creating a listing or beta test: title, description,
            metrics, pricing, tech stack, and assets included. This content is publicly
            visible to all visitors.
          </p>

          <h3 className="font-medium text-zinc-500 mt-4 mb-2">2.4 Activity Data</h3>
          <p>
            Your watchlist, Connects balance, transaction history, unlocked listings, and
            beta test applications are stored in our database. This data is private and
            visible only to you.
          </p>

          <h3 className="font-medium text-zinc-300 mt-4 mb-2">2.5 Payment Data</h3>
          <p>
            Connects purchases within India are processed by <strong className="text-zinc-300">Razorpay</strong>.
            SideFlip does not store your card number, CVV, or bank account details.
            We store only the Razorpay order ID, payment ID, amount, and currency to
            credit your Connects balance and maintain transaction records. Razorpay&apos;s{" "}
            <a
              href="https://razorpay.com/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300"
            >
              Privacy Policy
            </a>{" "}
            governs how they handle payment data.
          </p>

          <h3 className="font-medium text-zinc-300 mt-4 mb-2">2.6 Location / Country Detection</h3>
          <p>
            SideFlip detects your country from the{" "}
            <code className="font-mono text-xs bg-zinc-800 px-1 py-0.5 rounded">x-vercel-ip-country</code>{" "}
            request header provided by Vercel (our hosting platform). This is used solely to
            show you the appropriate currency. We do not store your IP address.
          </p>

          <h3 className="font-medium text-zinc-300 mt-4 mb-2">2.7 Server Logs</h3>
          <p>
            Our server (Vercel) may log request metadata such as IP address, timestamp, and
            URL for error monitoring and debugging. These logs are retained in accordance
            with Vercel&apos;s own data retention policies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">3. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To create and manage your account.</li>
            <li>To display your public profile and listings to other users.</li>
            <li>To process Connects purchases and maintain your balance.</li>
            <li>To prevent fraud and enforce our Terms of Service.</li>
            <li>To improve platform functionality and fix errors.</li>
          </ul>
          <p className="mt-3">
            We do not sell your personal data. We do not use your data for advertising.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">4. Data Storage &amp; Security</h2>
          <p>
            Your data is stored in a Supabase (PostgreSQL) database with row-level security
            (RLS) policies that ensure users can only access their own private data. Database
            connections use TLS encryption. Supabase is hosted on AWS infrastructure.
          </p>
          <p className="mt-3">
            Despite our security measures, no system is completely secure. We cannot
            guarantee absolute security of your data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">5. Cookies</h2>
          <p>
            SideFlip uses cookies solely for authentication (managed by Clerk). We do not
            use advertising or third-party tracking cookies. Session cookies expire when you
            close your browser or sign out; persistent cookies are used by Clerk to maintain
            your signed-in state across sessions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">6. Third-Party Services</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse mt-2">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 pr-4 font-medium text-zinc-300">Service</th>
                  <th className="text-left py-2 pr-4 font-medium text-zinc-300">Purpose</th>
                  <th className="text-left py-2 font-medium text-zinc-300">Data shared</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                <tr>
                  <td className="py-2 pr-4 text-zinc-300">Clerk</td>
                  <td className="py-2 pr-4">Authentication</td>
                  <td className="py-2">Email, name, profile photo</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-zinc-300">Supabase</td>
                  <td className="py-2 pr-4">Database storage</td>
                  <td className="py-2">Profile, listings, activity data</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-zinc-300">Razorpay</td>
                  <td className="py-2 pr-4">Payment processing (India)</td>
                  <td className="py-2">Payment details, user ID</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-zinc-300">Vercel</td>
                  <td className="py-2 pr-4">Hosting &amp; CDN</td>
                  <td className="py-2">IP address (request logs), country</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">7. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. If you request
            account deletion, we will delete your profile and private activity data within 30
            days. Payment transaction records may be retained for up to 7 years for legal and
            accounting purposes. Public listing content you submitted may remain visible
            briefly after deletion until caches are cleared.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">8. Your Rights</h2>
          <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your account and associated data.</li>
            <li>Object to processing of your data.</li>
          </ul>
          <p className="mt-3">
            Users in India may also exercise rights under the{" "}
            <strong className="text-zinc-300">Digital Personal Data Protection Act, 2023 (DPDPA)</strong>,
            including the right to access, correct, and erase personal data processed by SideFlip,
            and the right to nominate a representative for data-related requests.
          </p>
          <p className="mt-3">
            To exercise any of these rights, email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300">
              {CONTACT_EMAIL}
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">9. Children&apos;s Privacy</h2>
          <p>
            SideFlip is not directed at children under 18. We do not knowingly collect
            personal data from minors. If you believe a minor has provided us with their
            data, please contact us and we will delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The effective date at the
            top of this page will reflect the latest revision. Continued use of SideFlip
            after changes are posted constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">11. Contact</h2>
          <p>
            For any privacy-related questions or requests, contact us at:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-indigo-400 hover:text-indigo-300"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>

      </div>
    </div>
  );
}
