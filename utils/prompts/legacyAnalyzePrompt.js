/**
 * Prompt builder for single/direct ATS resume analysis (file base64 upload route).
 * Includes current date context for date verification.
 * @param {string} [currentDate] - Formatted current date string.
 * @param {number} [currentYear] - Current year number.
 * @returns {string} The formatted prompt string for Gemini AI.
 */
export function legacyAnalyzePrompt(currentDate, currentYear) {
  const dateStr =
    currentDate ||
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const yearNum = currentYear || new Date().getFullYear();

  return `You are an expert HR Specialist and Applicant Tracking System (ATS) Auditor.
IMPORTANT CONTEXT: Today's date is ${dateStr} (Year ${yearNum}). Any dates up to ${yearNum} (including ${yearNum} dates) are CURRENT or PAST dates. Do NOT flag dates from ${yearNum} or earlier as future dates.

Analyze this resume carefully. Provide a realistic ATS score (0-100), identify critical issues, list actionable suggestions for improvement, and highlight key strengths.

Return ONLY valid JSON matching this exact structure:
{
  "ats_score": number (0-100),
  "summary": "Brief 2-3 sentence overview of the resume",
  "errors": ["list of critical issues, missing sections, formatting errors, or ATS bottlenecks"],
  "suggestions": ["list of specific actionable improvements to boost ATS compatibility and impact"],
  "strengths": ["list of well-written sections, key skills, and strong points"]
}`;
}

export default legacyAnalyzePrompt;
