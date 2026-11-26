export const metadata = {
  title: "Terms and Conditions — Resumestan",
  description: "Terms and conditions for Resumestan.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-sm leading-7 text-gray-800">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Terms and Conditions</h1>
      <p className="mb-4">Last updated: November 26, 2026</p>

      <p className="mb-4">
        By using Resumestan, you agree to these terms. Resumestan provides tools to import
        Canva resume designs, analyze them with AI, and generate recommendations and guides.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-gray-900">Use of Service</h2>
      <ul className="mb-4 list-disc pl-6">
        <li>You must provide accurate account information and keep your credentials secure.</li>
        <li>You may only connect Canva accounts and designs you are authorized to access.</li>
        <li>You are responsible for reviewing AI-generated suggestions before using them.</li>
      </ul>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-gray-900">AI Output</h2>
      <p className="mb-4">
        AI analysis and recommendations are provided for informational purposes and may contain
        errors. Resumestan does not guarantee employment outcomes or resume performance.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-gray-900">Third-Party Services</h2>
      <p className="mb-4">
        Resumestan integrates with third-party services including Canva and Google Gemini.
        Your use of those services is also subject to their applicable terms and policies.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-gray-900">Availability and Changes</h2>
      <p className="mb-4">
        We may update, suspend, or discontinue features as needed. These terms may be updated
        from time to time by posting a revised version on this page.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-gray-900">Contact</h2>
      <p>
        For questions about these terms, contact{" "}
        <a className="text-blue-600 underline" href="mailto:mail@abdulrehman.sbs">
          mail@abdulrehman.sbs
        </a>.
      </p>
    </main>
  );
}
