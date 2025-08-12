import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Card, CardContent } from '../components/ui/card';

const sections = [
  { id: 'scope', title: '1) What this Policy covers (Scope)' },
  { id: 'data-we-collect', title: '2) Data we collect' },
  { id: 'purposes', title: '3) Why we use data (Purposes & legal bases)' },
  { id: 'whatsapp-processing', title: '4) How WhatsApp processing works' },
  { id: 'sharing', title: '5) Sharing & subprocessors' },
  { id: 'transfers', title: '6) International transfers' },
  { id: 'security', title: '7) Security' },
  { id: 'retention', title: '8) Retention' },
  { id: 'rights', title: '9) Your choices & rights' },
  { id: 'cookies', title: '10) Cookies & similar technologies' },
  { id: 'children', title: '11) Children' },
  { id: 'links', title: '12) Third‑party links' },
  { id: 'changes', title: '13) Changes to this Policy' },
  { id: 'contact', title: '14) Contact us' },
  { id: 'jurisdiction', title: 'Jurisdictional Addendum (summary)' },
  { id: 'product-notes', title: 'Product‑specific notes (Prime SMS)' },
];

export default function Privacy() {
  return (
    <Layout>
      <div className="min-h-screen bg-white">
        {/* Hero */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Privacy Policy</h1>
                <p className="mt-2 text-gray-600">Prime SMS Technologies Pvt. Ltd. ("Prime SMS", "we", "us")</p>
                <p className="mt-1 text-sm text-gray-500">Last updated: 12 Aug 2025</p>
                <div className="mt-4">
                  <Link to="/" className="inline-flex items-center text-emerald-700 hover:text-emerald-900">
                    ← Back to home
                  </Link>
                </div>
              </div>
              {/* Table of contents */}
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
              This Privacy Policy explains what we collect, why we collect it, and how we use, share, secure and retain personal data when you use Prime SMS — a WhatsApp Business Platform SaaS for sending/receiving WhatsApp messages, managing templates, campaigns and webhooks. By using our Services, you agree to this Policy.
            </p>

            <details id="scope" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">1) What this Policy covers (Scope)</summary>
              <div className="mt-3 text-gray-700">
                <ul>
                  <li><b>Web properties</b>: sites under primesms.app and subdomains.</li>
                  <li><b>App & APIs</b>: Prime SMS dashboard, bulk send, template manager, reporting, webhooks, and integrations (e.g., n8n).</li>
                  <li><b>End‑user messaging</b>: data we process on your behalf when your customers message your WhatsApp numbers connected to Prime SMS.</li>
                </ul>
                <p className="mt-2">We act as a <b>processor/service provider</b> for message content you process through our Services and as a <b>controller/business</b> for your account/admin data.</p>
              </div>
            </details>

            <details id="data-we-collect" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">2) Data we collect</summary>
              <div className="mt-3 text-gray-700">
                <p className="font-medium">A. Account & billing data (Controller)</p>
                <p>Contact name, email, phone, company, role, login events, plan, invoices, and support tickets.</p>
                <p className="font-medium mt-3">B. WhatsApp Business data (Processor)</p>
                <ul>
                  <li>Message content & metadata via WhatsApp Cloud API (sender/recipient numbers, timestamps, IDs, delivery/read status, attachment links).</li>
                  <li>Template data: names, languages, categories, approval status & reasons.</li>
                  <li>Webhook events: inbound messages, status updates, template status updates.</li>
                </ul>
                <p className="font-medium mt-3">C. Technical data</p>
                <p>IPs, device/user‑agent, error logs, performance metrics, cookie identifiers and similar telemetry on our sites.</p>
                <p className="mt-3">Sources include you (account setup), your connected WABAs via Meta APIs, and your end‑users when they message your WhatsApp numbers.</p>
              </div>
            </details>

            <details id="purposes" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">3) Why we use data (Purposes & legal bases)</summary>
              <div className="mt-3 text-gray-700">
                <ul className="list-disc pl-6">
                  <li><b>Provide the Services</b>: deliver/receive WhatsApp messages; manage templates; process webhooks; show delivery/read reports. (Contract)</li>
                  <li><b>Security & abuse prevention</b>: authenticate sessions; detect fraud; protect accounts. (Legitimate interests / Legal obligation)</li>
                  <li><b>Support & troubleshooting</b>: logs/telemetry; respond to tickets. (Legitimate interests / Contract)</li>
                  <li><b>Product improvement & analytics</b>: aggregated usage patterns without identifying message content. (Legitimate interests; opt‑out available — contact us)</li>
                  <li><b>Legal compliance</b>: tax, accounting, regulatory requests. (Legal obligation)</li>
                </ul>
              </div>
            </details>

            <details id="whatsapp-processing" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">4) How WhatsApp processing works</summary>
              <div className="mt-3 text-gray-700">
                <p>We connect to WhatsApp Cloud API as your processor to send/receive messages and receive webhook events. Messages are protected by WhatsApp protocols in transit. Prime SMS receives content only as permitted via the Cloud API/webhooks to deliver the business function (e.g., auto‑replies, reporting).</p>
              </div>
            </details>

            <details id="sharing" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">5) Sharing & subprocessors</summary>
              <div className="mt-3 text-gray-700">
                <p>We share data only to provide the Services, under contracts that require security and confidentiality:</p>
                <ul className="list-disc pl-6">
                  <li>Meta Platforms / WhatsApp Cloud API (message delivery, template management)</li>
                  <li>Infrastructure & monitoring (hosting, storage, CDN, logging, email)</li>
                  <li>Payments & invoicing (if applicable)</li>
                  <li>Support tooling (when you contact us)</li>
                </ul>
                <p className="mt-2">We do not sell personal data. Our current subprocessors are listed at <a href="#subprocessors" className="text-emerald-700">the Subprocessors section</a>.</p>
              </div>
            </details>

            <details id="transfers" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">6) International transfers</summary>
              <div className="mt-3 text-gray-700">
                <p>We may process data in countries different from where you reside. Where required, we use recognized transfer mechanisms (e.g., SCCs) and appropriate safeguards.</p>
              </div>
            </details>

            <details id="security" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">7) Security</summary>
              <div className="mt-3 text-gray-700">
                <p>We implement administrative, technical, and physical safeguards: TLS in transit, encryption at rest (where applicable), access control, least privilege, audit logs, and incident response.</p>
              </div>
            </details>

            <details id="retention" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">8) Retention</summary>
              <div className="mt-3 text-gray-700">
                <ul className="list-disc pl-6">
                  <li><b>Account data</b>: kept for the duration of the contract and a reasonable period thereafter for legal/accounting purposes.</li>
                  <li><b>Message content & event logs</b>: retained only as long as needed to deliver the Services and then deleted or anonymized.</li>
                  <li><b>Template metadata</b>: retained while the template is active and for audit/history.</li>
                </ul>
              </div>
            </details>

            <details id="rights" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">9) Your choices & rights</summary>
              <div className="mt-3 text-gray-700">
                <p>Depending on your location, you may have rights to access, correct, delete, restrict or port personal data, and to object to certain processing.</p>
                <p className="mt-2">If you are an end‑user of one of our customers, please contact that business (they are the controller). If you are a Prime SMS account user, contact us at <a href="mailto:privacy@primesms.app" className="text-emerald-700">privacy@primesms.app</a>.</p>
              </div>
            </details>

            <details id="cookies" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">10) Cookies & similar technologies</summary>
              <div className="mt-3 text-gray-700">
                <p>We use necessary cookies (auth/session) and, if enabled, analytics/performance cookies on our sites. You can manage preferences via your browser and (where applicable) our cookie banner.</p>
              </div>
            </details>

            <details id="children" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">11) Children</summary>
              <div className="mt-3 text-gray-700">
                <p>Our Services are not directed to children under 16 (or lower age as defined by local law). We do not knowingly collect such data.</p>
              </div>
            </details>

            <details id="links" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">12) Third‑party links</summary>
              <div className="mt-3 text-gray-700">
                <p>Our sites may link to third‑party pages. Their privacy practices are governed by their own policies.</p>
              </div>
            </details>

            <details id="changes" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">13) Changes to this Policy</summary>
              <div className="mt-3 text-gray-700">
                <p>We may update this Policy. We’ll post the new version with a new “Last updated” date and, where required, notify you.</p>
              </div>
            </details>

            <details id="contact" className="group border rounded-lg p-4 mb-8">
              <summary className="font-semibold cursor-pointer text-gray-900">14) Contact us</summary>
              <div className="mt-3 text-gray-700">
                <p><b>Data controller (for account data)</b><br/>Prime SMS Technologies Pvt. Ltd.</p>
                <p className="mt-1">Email: <a href="mailto:privacy@primesms.app" className="text-emerald-700">privacy@primesms.app</a></p>
                <p className="mt-1">DPO (if applicable): <a href="mailto:dpo@primesms.app" className="text-emerald-700">dpo@primesms.app</a></p>
                <p className="mt-1">Grievance Officer (India): <a href="mailto:grievance@primesms.app" className="text-emerald-700">grievance@primesms.app</a></p>
              </div>
            </details>

            <details id="jurisdiction" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">Jurisdictional Addendum (summary)</summary>
              <div className="mt-3 text-gray-700 space-y-3">
                <div>
                  <p className="font-medium">EU/UK GDPR</p>
                  <p>Controller for account/billing/website data; processor for message content/metadata you process through Prime SMS. Data subject rights include access, rectification, erasure, restriction, portability, and objection. We provide a DPA with SCCs on request via <a href="mailto:privacy@primesms.app" className="text-emerald-700">privacy@primesms.app</a>.</p>
                </div>
                <div>
                  <p className="font-medium">California (CCPA/CPRA)</p>
                  <p>We are a service provider for message content processed on your behalf, and a business for your account data. We do not sell or share personal information as defined by CPRA. Rights requests: <a href="mailto:privacy@primesms.app" className="text-emerald-700">privacy@primesms.app</a>.</p>
                </div>
                <div>
                  <p className="font-medium">India (DPDP Act 2023)</p>
                  <p>We process personal data for lawful purposes with notice and consent where required. Rights to access/correction/grievance redressal via <a href="mailto:grievance@primesms.app" className="text-emerald-700">grievance@primesms.app</a>.</p>
                </div>
              </div>
            </details>

            <details id="product-notes" className="group border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer text-gray-900">Product‑specific notes (Prime SMS)</summary>
              <div className="mt-3 text-gray-700">
                <ul className="list-disc pl-6">
                  <li><b>Template sync</b>: We store template name, language, category, status, reasons to show in your dashboard and keep them in sync with Meta.</li>
                  <li><b>Campaign & reporting</b>: We store delivery/read statuses and message IDs to power reporting and retries.</li>
                  <li id="subprocessors"><b>Webhooks</b>: If you configure a third‑party webhook (e.g., n8n), we forward only the fields you enable.</li>
                </ul>
              </div>
            </details>

            <div className="mt-10 text-sm text-gray-600">
              <p>Questions? <Link to="/support" className="text-emerald-700">Contact Support</Link>.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


