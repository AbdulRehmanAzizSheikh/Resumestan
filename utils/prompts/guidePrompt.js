/**
 * Prompt builder for generating a full step-by-step Canva implementation guide
 * from a set of saved recommendations.
 * @param {Array} recommendations - Array of recommendation objects
 * @param {string} resumeContext - Resume title/context string
 * @returns {string} Formatted prompt for Gemini AI
 */
export function guidePrompt(recommendations, resumeContext = "") {
  const recList = recommendations
    .map(
      (rec, i) =>
        `${i + 1}. Issue: ${rec.issueTitle}\n   Fix: ${rec.after}\n   Why it works: ${rec.whyItWorks}`
    )
    .join("\n\n");

  return `
You are an expert Canva resume coach. A user wants a complete step-by-step guide to implement the following recommendations in their Canva resume.

Create a single unified guide that walks them through ALL changes in a logical order. Return only valid JSON — no markdown, no extra text.

Required schema:
{
  "guide": {
    "title": "Descriptive guide title",
    "overview": "2-3 sentence summary of what this guide covers and expected outcome",
    "steps": [
      {
        "stepNumber": 1,
        "title": "Short step title",
        "instruction": "Clear, detailed instruction for this step",
        "canvaAction": "Specific Canva UI action (e.g., 'Click on the text box in the Experience section')",
        "tip": "Optional pro tip to make this step easier or better"
      }
    ]
  }
}

Rules:
- Steps should be in logical order (open Canva → navigate → make changes → review)
- Each step should cover one specific action
- canvaAction must be specific enough to follow without screenshots
- Aim for 6-12 steps total
- tip can be empty string if no tip is needed

Resume context: ${resumeContext || "Not provided"}

Recommendations to implement:
${recList}
  `.trim();
}

export default guidePrompt;
