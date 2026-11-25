export default function resumeNotificationEmail({
    atsScore = "N/A",
    fileName = "Resume.pdf",
}) {
    return `
    <div style="font-family: Arial, sans-serif; background:#f4f6fb; padding:24px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 16px 48px rgba(15,23,42,.15);">
        
        <!-- Header -->
        <div style="background:#4f46e5; color:#ffffff; padding:24px; text-align:center;">
          <h1 style="margin:0; font-size:22px; font-weight:700;">📄 New CV Uploaded for ATS Check</h1>
        </div>

        <!-- Body Content -->
        <div style="padding:24px; color:#0f172a;">
          <p style="margin:0 0 16px; font-size:15px; color:#334155;">
            Kisi user ne aapki web app par CV upload karke ATS score check kiya hai. Details neeche di gayi hain:
          </p>

          <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
            <tr>
              <td style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0; font-weight:700;">File Name</td>
              <td style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0;">${fileName}</td>
            </tr>
            <tr>
              <td style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0; font-weight:700;">Generated ATS Score</td>
              <td style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0; font-weight:bold; color:#4f46e5;">${atsScore}</td>
            </tr>
          </table>

          <div style="background:#eef2ff; border-left:4px solid #4f46e5; padding:12px 16px; border-radius:4px; font-size:14px; color:#3730a3;">
            📌 <b>Note:</b> Submitted CV is email ke saath attachment me attach kar di gayi hai.
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc; padding:16px; color:#64748b; font-size:13px; text-align:center;">
          ATS Checker Tool — Auto-generated Admin Notification
        </div>

      </div>
    </div>
  `;
}