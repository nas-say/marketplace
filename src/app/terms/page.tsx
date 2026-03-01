import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — SideFlip",
  description: "SideFlip Terms of Service",
};

const EFFECTIVE_DATE = "March 1, 2026";
const CONTACT_EMAIL = "sudnas11@gmail.com";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-zinc-50">Terms of Service</h1>
      <p className="mt-2 text-sm text-zinc-500">Effective date: {EFFECTIVE_DATE}</p>

      <div className="mt-10 space-y-10 text-sm text-zinc-400 leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">1. About SideFlip</h2>
          <p>
            SideFlip is an online marketplace that connects independent software makers (sellers)
            with potential buyers and beta testers. We are not a registered company; SideFlip
            is operated as a personal project. By accessing or using SideFlip at{" "}
            <span className="text-zinc-300">sideflip.in</span>, you agree to these Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">2. Eligibility</h2>
          <p>
            You must be at least 18 years old to use SideFlip. By using the platform, you
            represent that you are of legal age and have the authority to enter into these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">3. Accounts</h2>
          <p>
            Account creation and authentication are handled by Clerk. You are responsible for
            maintaining the confidentiality of your credentials and for all activity that occurs
            under your account. Notify us immediately at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300">
              {CONTACT_EMAIL}
            </a>{" "}
            if you suspect unauthorised access.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">4. Listings &amp; Content</h2>
          <p className="mb-3">
            Sellers may list projects for sale or post beta-testing opportunities. By submitting a
            listing, you confirm that:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You own the project or have full authority to sell it.</li>
            <li>All stated metrics (MRR, traffic, users) are accurate to the best of your knowledge.</li>
            <li>The listing does not infringe any third-party intellectual property rights.</li>
            <li>The content complies with applicable laws and does not contain malware, spam, or illegal material.</li>
          </ul>
          <p className="mt-3">
            SideFlip reserves the right to remove any listing at its sole discretion, without
            prior notice or compensation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">5. Connects — Our Credit System</h2>
          <p className="mb-3">
            SideFlip uses a digital credit system called <strong className="text-zinc-300">Connects</strong>.
            Connects can be purchased with real money and are used to unlock seller contact
            information on listings. Key terms:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Connects have no cash value and cannot be transferred between accounts.</li>
            <li>Connects do not expire.</li>
            <li>
              <strong className="text-zinc-300">Connects purchases are non-refundable.</strong>{" "}
              See our <a href="/refund" className="text-indigo-400 hover:text-indigo-300">Refund Policy</a> for full details.
            </li>
            <li>SideFlip reserves the right to adjust Connects pricing at any time.</li>
            <li>
              SideFlip may grant free Connects (e.g., signup bonuses) which are subject to
              expiry or revocation at our discretion.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">6. Off-Platform Transactions</h2>
          <p className="mb-3">
            <strong className="text-zinc-300">SideFlip facilitates introductions, not transactions.</strong>{" "}
            When a buyer spends Connects to unlock a seller&apos;s contact information, any
            subsequent negotiation, agreement, payment, or transfer of the project takes place
            entirely off SideFlip — directly between buyer and seller.
          </p>
          <p className="mb-3">
            SideFlip is not a party to any project sale. We do not:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hold funds in escrow for project sales.</li>
            <li>Guarantee that any project sale will be completed.</li>
            <li>Verify the accuracy of seller claims beyond what is visible on the listing.</li>
            <li>Accept liability for losses arising from project transactions conducted off-platform.</li>
          </ul>
          <p className="mt-3">
            Buyers and sellers conduct off-platform transactions at their own risk and are
            solely responsible for due diligence, contracts, and payment arrangements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">7. Beta Testing</h2>
          <p className="mb-3">
            Beta test creators set the terms of their individual testing programmes, including
            rewards and requirements. SideFlip is not responsible for:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Failure of a creator to pay promised rewards.</li>
            <li>Quality, safety, or legality of any product being tested.</li>
            <li>Disputes between testers and creators.</li>
          </ul>
          <p className="mt-3">
            Where cash rewards are pre-funded by creators on-platform (via Razorpay), SideFlip
            holds those funds and disburses them to accepted testers. However, reward disbursement
            is controlled by the creator&apos;s actions on the platform; we cannot guarantee
            payment if a creator fails to approve testers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">8. Prohibited Conduct</h2>
          <p className="mb-3">You may not use SideFlip to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>List projects you do not own or have no right to sell.</li>
            <li>Post fraudulent metrics or misleading descriptions.</li>
            <li>Scrape, crawl, or automate access to the platform.</li>
            <li>Attempt to reverse-engineer or interfere with platform infrastructure.</li>
            <li>Harass, spam, or deceive other users.</li>
            <li>Use the platform for money laundering or other unlawful financial activity.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">9. Payments &amp; Third-Party Processors</h2>
          <p>
            Connects purchases within India are processed by Razorpay. By making a payment,
            you also agree to Razorpay&apos;s terms of service. SideFlip does not store your payment
            card details. All payment data is handled by the respective processor.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">10. Intellectual Property</h2>
          <p>
            SideFlip&apos;s branding, design, and software are the property of the operator.
            User-submitted listing content (text, screenshots, descriptions) remains the
            property of the submitting user. By submitting content, you grant SideFlip a
            non-exclusive, royalty-free licence to display that content on the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">11. Disclaimers</h2>
          <p className="mb-3">
            SideFlip is provided <strong className="text-zinc-300">&quot;as is&quot;</strong> without warranties
            of any kind, express or implied. We do not warrant that the platform will be
            uninterrupted, error-free, or free of viruses.
          </p>
          <p>
            To the maximum extent permitted by applicable law, SideFlip and its operator
            shall not be liable for any indirect, incidental, special, or consequential
            damages arising from your use of the platform or any off-platform transaction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">12. Termination</h2>
          <p>
            We may suspend or terminate your account at any time if you violate these terms
            or if we decide to discontinue the platform. Upon termination, your access to
            Connects balance and unlocked listings will be lost. Unused Connects are
            non-refundable.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">13. Changes to These Terms</h2>
          <p>
            We may update these Terms at any time. Continued use of SideFlip after changes
            are posted constitutes acceptance of the revised Terms. We will update the
            effective date at the top of this page when changes are made.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">14. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India. Any disputes shall be subject
            to the exclusive jurisdiction of the courts located in India.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">15. Contact</h2>
          <p>
            For any questions about these Terms, contact us at:{" "}
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
