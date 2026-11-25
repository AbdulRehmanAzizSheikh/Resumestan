/**
 * Prompt builder for analyzing saved resumes and generating structured ATS score, summary, and feedback.
 * @param {string} contentText - The text content of the resume.
 * @returns {string} The formatted prompt string for Gemini AI.
 */
export function analyzeResumePrompt(contentText) {
  return `
      You are a precision ATS strategist and Canva resume coach. Review the resume below against ATS readability, recruiter impact, spelling, formatting, keywords, and action verbs.
      Return structured feedback in JSON only. Be specific and honest; never use generic N/A feedback.

      Required schema:
      {
        "score": 0,
        "summary": "short summary",
        "goodAspects": [{"title":"Strength title","detail":"Evidence from the resume and why it helps ATS"}],
        "issues": [{"title":"Critical issue","detail":"What is wrong and why it hurts the application","severity":"high|medium|low"}],
        "recommendations": [{
          "issueTitle":"The issue this fixes",
          "before":"Exact weak text from the resume, or a concise description if no exact text exists",
          "after":"Exact ATS-friendly replacement text, ready to copy and paste",
          "canvaSteps":["Open your Canva Resume", "Go to the exact section", "Replace the old text with the copy-paste fix"],
          "whyItWorks":"One concise reason this improves ATS/recruiter impact"
        }]
      }

      Create one recommendation for every critical issue. The "after" field must be usable as a direct copy-paste fix in Canva. Only claim formatting problems that can be inferred from the extracted text.

      Resume content:
      ${contentText}
    `.trim();
}

export default analyzeResumePrompt;
