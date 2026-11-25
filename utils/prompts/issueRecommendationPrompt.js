/**
 * Prompt builder for generating targeted recommendations for selected issues.
 * @param {Array} issues - Array of issue objects: { title, detail, severity }
 * @param {string} resumeContext - Resume title/context string
 * @returns {string} Formatted prompt for Gemini AI
 */
export function issueRecommendationPrompt(issues, resumeContext = "") {
  const issuesList = issues
    .map(
      (issue, i) =>
        `${i + 1}. Title: ${issue.title}\n   Detail: ${issue.detail}\n   Severity: ${issue.severity || "medium"}`
    )
    .join("\n\n");

  return `
You are an expert ATS resume coach and Canva design specialist. A user has selected specific issues from their resume analysis and wants actionable fix recommendations for each one.

For EACH issue below, generate a precise, actionable recommendation. Return only valid JSON — no markdown, no extra text.

Required schema:
{
  "recommendations": [
    {
      "issueTitle": "Exact issue title from the list",
      "before": "Exact weak text from the resume, or concise description of the problem",
      "after": "Ready-to-paste ATS-friendly replacement or fix",
      "canvaSteps": [
        "Step 1: Open your Canva resume design",
        "Step 2: Navigate to the specific section",
        "Step 3: Apply the change"
      ],
      "whyItWorks": "One concise sentence explaining why this fix improves ATS/recruiter impact"
    }
  ]
}

Rules:
- One recommendation object per issue
- The "after" field must be usable as a direct copy-paste fix in Canva
- Canva steps should be specific and actionable (3-5 steps)
- Keep "whyItWorks" under 20 words

Resume context: ${resumeContext || "Not provided"}

Selected Issues:
${issuesList}
  `.trim();
}

export default issueRecommendationPrompt;
