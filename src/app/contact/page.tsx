import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/seo";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = publicPageMetadata({
  title: "Contact Us",
  description: "Get in touch with the SideFlip team for support, questions, or feedback.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-zinc-50">Contact Us</h1>
      <p className="mt-2 text-zinc-400">
        Have a question, need help, or want to report an issue? We&apos;ll get back to you within 24 hours.
      </p>

      <div className="mt-10 grid gap-8 sm:grid-cols-[1fr_200px]">
        <ContactForm />

        <div className="space-y-6 text-sm text-zinc-400">
          <div>
            <p className="font-medium text-zinc-300 mb-1">Email</p>
            <a href="mailto:sudnas11@gmail.com" className="text-indigo-400 hover:text-indigo-300">
              sudnas11@gmail.com
            </a>
          </div>
          <div>
            <p className="font-medium text-zinc-300 mb-1">Response time</p>
            <p>Within 24 hours on weekdays</p>
          </div>
          <div>
            <p className="font-medium text-zinc-300 mb-1">Common topics</p>
            <ul className="space-y-1 text-zinc-500">
              <li>Listing verification</li>
              <li>Connects &amp; billing</li>
              <li>Account issues</li>
              <li>Report a listing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
