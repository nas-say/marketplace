import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy — SideFlip",
  description: "SideFlip Refund Policy for Connects purchases",
};

const EFFECTIVE_DATE = "March 1, 2026";
const CONTACT_EMAIL = "sudnas11@gmail.com";

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-zinc-50">Refund Policy</h1>
      <p className="mt-2 text-sm text-zinc-500">Effective date: {EFFECTIVE_DATE}</p>

      <div className="mt-10 space-y-10 text-sm text-zinc-400 leading-relaxed">

        {/* TL;DR box */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="font-semibold text-amber-400 mb-1">Summary</p>
          <p>
            Connects are digital credits that are <strong className="text-zinc-200">non-refundable</strong> once purchased.
            Please read the full policy below before buying.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">1. What Are Connects?</h2>
          <p>
            Connects are SideFlip&apos;s digital credit currency. You purchase Connects with
            real money and spend them to unlock seller contact information on listings.
            They have no cash value and cannot be withdrawn.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">2. No Refunds on Connects Purchases</h2>
          <p className="mb-3">
            <strong className="text-zinc-200">All Connects purchases are final and non-refundable.</strong>{" "}
            Once a payment is processed and Connects are credited to your account, we do not
            issue refunds — regardless of whether you have spent the Connects.
          </p>
          <p>
            This applies to all purchase bundles and all payment methods available on the
            platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">3. Spent Connects</h2>
          <p>
            Connects spent to unlock a listing are consumed immediately upon unlocking.
            They are non-reversible. We do not refund Connects that have been spent,
            even if you were unable to contact the seller or if the project sale did not
            proceed. SideFlip connects buyers with sellers — we are not a party to any
            subsequent transaction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">4. Failed or Duplicate Payments</h2>
          <p>
            If your payment was charged but Connects were <em>not</em> credited to your
            account (e.g., due to a processing error), contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300">
              {CONTACT_EMAIL}
            </a>{" "}
            with your payment details. We will investigate and credit your account or
            arrange a refund for the failed transaction.
          </p>
          <p className="mt-3">
            If you were charged twice for the same bundle, please contact us with both
            payment IDs and we will refund the duplicate charge.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">5. Beta Test Reward Funding</h2>
          <p className="mb-3">
            <strong className="text-zinc-200">
              Cash reward pool funding for beta tests is final and non-refundable once paid.
            </strong>{" "}
            By funding a beta reward pool, you authorize SideFlip to earmark those funds for
            tester payouts under your beta test terms.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Funds remain allocated to that beta test and cannot be withdrawn back to your
              account.
            </li>
            <li>
              Payments to testers and any platform processing already completed are irreversible.
            </li>
            <li>
              If a payment fails technically before funding is recorded, contact{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300">
                {CONTACT_EMAIL}
              </a>{" "}
              with the order/payment IDs for investigation.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">6. Account Termination</h2>
          <p>
            If your account is terminated for violating our{" "}
            <Link href="/terms" className="text-indigo-400 hover:text-indigo-300">
              Terms of Service
            </Link>
            , any remaining Connects balance is forfeited and will not be refunded.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">7. Chargebacks</h2>
          <p>
            Initiating a chargeback or payment dispute for a valid Connects purchase without
            first contacting us may result in immediate account suspension and forfeiture
            of your Connects balance. Please reach out to us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300">
              {CONTACT_EMAIL}
            </a>{" "}
            before disputing a charge — we are happy to investigate any payment issues.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">8. Contact</h2>
          <p>
            For any payment-related queries, email us at:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-indigo-400 hover:text-indigo-300"
            >
              {CONTACT_EMAIL}
            </a>
            . Include your Razorpay order ID or payment ID for faster resolution.
          </p>
        </section>

      </div>
    </div>
  );
}
