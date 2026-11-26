export const metadata = {
  title: "Privacy Policy — Resumestan",
  description: "Privacy policy for Resumestan.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-sm leading-7 text-gray-800">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mb-4">Last updated: November 26, 2026</p>

      <p className="mb-4">
        Resumestan helps users import Canva resume designs, analyze them with AI,
        and receive recommendations and editing guides.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-gray-900">Data We Collect</h2>
      <ul className="mb-4 list-disc pl-6">
        <li>Account information: name, email, and bcrypt-hashed password.</li>
        <li>Canva connection data: Canva account ID, account name, OAuth tokens, and token expiry.</li>
        <li>Resume data: imported design metadata, Canva links, thumbnails, AI analysis results, and saved recommendations/guides.</li>
      </ul>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-gray-900">How We Use Data</h2>
      <ul className="mb-4 list-disc pl-6">
        <li>To authenticate users and maintain their account.</li>
        <li>To connect to Canva on the user&apos;s behalf and import selected resume designs.</li>
        <li>To export selected designs for AI analysis and generate recommendations/guides.</li>
      </ul>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-gray-900">Third-Party Services</h2>
      <p className="mb-4">
        Resumestan uses Canva APIs for design access/export, Google Gemini for AI analysis,
        MongoDB Atlas for data storage, and Vercel for hosting.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-gray-900">Data Retention and Removal</h2>
      <p className="mb-4">
        Data is retained while your account is active. You can delete imported resumes and
        disconnect Canva accounts from the dashboard. Disconnecting a Canva account removes
        imported resumes associated with that account. For account or data deletion requests,
        contact support.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-gray-900">Contact</h2>
      <p>
        For privacy questions or requests, contact{" "}
        <a className="text-blue-600 underline" href="mailto:mail@abdulrehman.sbs">
          mail@abdulrehman.sbs
        </a>.
      </p>
    </main>
  );
}
