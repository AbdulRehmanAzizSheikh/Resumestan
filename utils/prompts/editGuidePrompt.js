/**
 * Prompt builder for generating a step-by-step "edit in Canva" guide.
 * Used by the AI Edit Guide feature on the resume page.
 * @param {string} resumeTitle
 * @returns {string} Prompt for Gemini.
 */
export function editGuidePrompt(resumeTitle = "") {
  return `
You are an expert Canva resume coach and editor. A user has a Canva resume design and wants a short, friendly, step-by-step guide of what to edit directly inside Canva.

The user cannot see the resume right now, so make the guide concrete and easy to follow without screenshots: mention where each step happens in the Canva editor (e.g., "Click the text box in the Experience section").

Return only valid JSON — no markdown, no extra text.

Required schema:
{
  "guide": {
    "title": "Short guide title (max 6 words)",
    "overview": "2-3 sentence plain-language summary of what the user will improve",
    "steps": [
      {
        "stepNumber": 1,
        "title": "Short step title",
        "instruction": "Clear, actionable instruction for this step",
        "tip": "Optional pro tip to make the step easier or better"
      }
    ]
  }
}

Rules:
- 4-8 steps, logical order (open Canva → find section → make the change → finish)
- Each step covers one specific action the user can do in the editor
- Keep instructions short and clear (1-3 sentences)

Resume title: ${resumeTitle || "Not provided"}
  `.trim();
}

export default editGuidePrompt;
