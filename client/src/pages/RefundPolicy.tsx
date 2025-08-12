import { Link } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { Card, CardContent } from '../components/ui/card';

const sections = [
  { id: 'summary', title: '1) Summary (TL;DR)' },
  { id: 'what-you-can-cancel', title: '2) What you can cancel' },
  { id: 'credits', title: '3) Credits (Top-ups / Wallet)' },
  { id: 'when-refunds', title: '4) When we do consider refunds' },
  { id: 'never-refundable', title: '5) What’s never refundable' },
  { id: 'how-to-request', title: '6) How to request a refund or dispute a bill' },
  { id: 'chargebacks', title: '7) Chargebacks' },
  { id: 'trials', title: '8) Trial accounts & closures' },
  { id: 'country-rights', title: '9) Country-specific rights' },
  { id: 'changes', title: '10) Changes to this policy' },
  { id: 'admin-checklist', title: 'Admin checklist (for your team)' },
];

export default function RefundPolicy() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-white">
        {/* Hero */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Refund & Cancellation Policy</h1>
                <p className="mt-2 text-gray-600">Prime SMS Technologies Pvt. Ltd.</p>
                <p className="mt-1 text-sm text-gray-500">Last updated: 12 Aug 2025</p>
                <div className="mt-4">
                  <Link to="/" className="inline-flex items-center text-emerald-700 hover:text-emerald-900">
                    ← Back to home
                  </Link>
                </div>
              </div>
              {/* TOC */}
              <Card className="md:w-[420px]">
                <CardContent className="p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-2">Jump to a section</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {sections.map((s) => (
                      <a key={s.id} href={`#${s.id}`} className="text-emerald-700 hover:text-emerald-900">{s.title.replace(/^[0-9)+ ]+/,'')}</a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="prose prose-gray max-w-none">
            <p>
              This policy applies to the Prime SMS dashboard, APIs, add-ons, WhatsApp messaging usage, and prepaid credits (“Credits”).
            </p>

            <details id="summary" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">1) Summary (TL;DR)</summary>
              <div className="mt-3 text-gray-700">
                <ul className="list-disc pl-6">
                  <li>Subscriptions: non‑cancellable and non‑refundable for the current term unless required by law; cancelling stops future renewals.</li>
                  <li>Credits/Top‑ups: non‑refundable and non‑transferable; used for per‑message/conversation charges and fees.</li>
                  <li>Goodwill window: We may refund only if the top‑up is completely unused and you request it in writing within 7 days of purchase. Otherwise, service credits may be issued at our discretion.</li>
                  <li>Processor fees are not returned on refunds. Billing disputes must be raised within 30 days of invoice date.</li>
                </ul>
              </div>
            </details>

            <details id="what-you-can-cancel" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">2) What you can cancel</summary>
              <div className="mt-3 text-gray-700">
                <ul className="list-disc pl-6">
                  <li>Auto‑renewing subscriptions: cancel anytime before the renewal date; access continues through the paid‑up period. No refunds for partial months/unused time.</li>
                  <li>Add‑ons: cancel at next renewal; amounts already paid are non‑refundable unless mandated by law.</li>
                </ul>
              </div>
            </details>

            <details id="credits" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">3) Credits (Top‑ups / Wallet)</summary>
              <div className="mt-3 text-gray-700">
                <ul className="list-disc pl-6">
                  <li><b>Non‑refundable</b>: All purchased Credits are non‑refundable, non‑transferable, and only usable for Prime SMS services (e.g., WhatsApp messages, Meta conversation charges, add‑ons).</li>
                  <li><b>Expiry (optional)</b>: Unused Credits may expire 12 months after purchase (if enabled).</li>
                  <li><b>Account actions</b>: If we suspend/disable service for AUP/policy breaches, remaining Credits are forfeited.</li>
                </ul>
                <p className="mt-2">Note: “If the amount is credit, it can’t be refunded.”</p>
              </div>
            </details>

            <details id="when-refunds" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">4) When we do consider refunds</summary>
              <div className="mt-3 text-gray-700">
                <ul className="list-disc pl-6">
                  <li>Duplicate charge or clear platform mis‑billing; or</li>
                  <li>Top‑up entirely unused and requested in writing within 7 days of payment (admin fee may apply; taxes and processor fees are not returned).</li>
                </ul>
                <p className="mt-2">No refunds if any account activity occurred in the current billing month on subscription plans.</p>
              </div>
            </details>

            <details id="never-refundable" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">5) What’s never refundable</summary>
              <div className="mt-3 text-gray-700">
                <ul className="list-disc pl-6">
                  <li>Partially used subscription periods; upgrade/downgrade differences; unused time after cancellation.</li>
                  <li>Promotional/bonus Credits and coupons.</li>
                  <li>Taxes, bank/processor/FX fees, chargeback fees.</li>
                  <li>Usage consumed by WhatsApp Cloud API (e.g., conversation charges) already passed through to Meta.</li>
                </ul>
              </div>
            </details>

            <details id="how-to-request" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">6) How to request a refund or dispute a bill</summary>
              <div className="mt-3 text-gray-700">
                <p>Email <a href="mailto:billing@primesms.app" className="text-emerald-700">billing@primesms.app</a> with subject “Refund/Dispute – [account id]”. Include invoice IDs, payment reference, screenshots, and a short description.</p>
                <p className="mt-2">Deadline: disputes within 30 days of invoice issuance; after that, charges are final. We usually resolve within 7–15 business days and confirm whether we’ll refund to the original method or issue service credits.</p>
              </div>
            </details>

            <details id="chargebacks" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">7) Chargebacks</summary>
              <div className="mt-3 text-gray-700">
                <p>Please contact us first. Filing a chargeback before contacting support may lead to account suspension and permanent loss of Credits.</p>
              </div>
            </details>

            <details id="trials" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">8) Trial accounts & closures</summary>
              <div className="mt-3 text-gray-700">
                <p>Trial/limited accounts typically have no user‑funded balance; any positive balance at closure isn’t refunded.</p>
              </div>
            </details>

            <details id="country-rights" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">9) Country-specific rights</summary>
              <div className="mt-3 text-gray-700">
                <p>Where consumer protection laws grant non‑waivable rights (e.g., EU/UK withdrawal rights for certain digital services, India DPDP notices, California CPRA rights), we honor those to the extent they apply. This policy targets B2B services.</p>
              </div>
            </details>

            <details id="changes" className="group border rounded-lg p-4 mb-8">
              <summary className="font-semibold cursor-pointer text-gray-900">10) Changes to this policy</summary>
              <div className="mt-3 text-gray-700">
                <p>We may update this policy; material changes will be posted with a new “Last updated” date.</p>
                <p className="mt-2">Contact: <a href="mailto:billing@primesms.app" className="text-emerald-700">billing@primesms.app</a></p>
              </div>
            </details>

            <details id="admin-checklist" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">Admin checklist (quick to implement)</summary>
              <div className="mt-3 text-gray-700">
                <ul className="list-disc pl-6">
                  <li>Add a “Non‑Refundable Credits” note to your Top‑Up screen and invoice footer.</li>
                  <li>In Cancel Subscription UI: “Cancelling stops future renewals; current term remains active; no partial refunds.”</li>
                  <li>Add the 7‑day unused‑top‑up exception (optional) and link to this page near the payment button.</li>
                  <li>Remind “dispute within 30 days” in billing emails.</li>
                  <li>Note in ToS that prepaid balances are non‑refundable and may expire (if you enable expiry).</li>
                </ul>
              </div>
            </details>

            <div className="mt-10 text-sm text-gray-600 flex items-center gap-4">
              <Link to="/" className="text-emerald-700">← Back to home</Link>
              <Link to="/privacy" className="text-emerald-700">View Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}


