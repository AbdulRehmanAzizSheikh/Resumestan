export const metadata = {
  title: "Support — Resumestan",
  description: "Support for Resumestan.",
};

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-sm leading-7 text-gray-800">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Support</h1>
      <p className="mb-4">
        Need help with Resumestan? Contact us and include your account email and a short
        description of the issue.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-gray-900">Contact</h2>
      <p className="mb-4">
        Email:{" "}
        <a className="text-blue-600 underline" href="mailto:mail@abdulrehman.sbs">
          mail@abdulrehman.sbs
        </a>
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-gray-900">Common Issues</h2>
      <ul className="mb-4 list-disc pl-6">
        <li><strong>Canva not connected:</strong> Reconnect your Canva account from the dashboard.</li>
        <li><strong>Analysis failed:</strong> Ensure the Canva design is accessible and try Analyze again.</li>
        <li><strong>Email verification:</strong> Check spam/junk and request a new OTP.</li>
      </ul>

      <p>
        App URL:{" "}
        <a className="text-blue-600 underline" href="https://resumestan.vercel.app">
          https://resumestan.vercel.app
        </a>
      </p>
    </main>
  );
}
