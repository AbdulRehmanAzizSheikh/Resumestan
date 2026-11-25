import { Schema, model, models } from "mongoose";

const recommendationSchema = new Schema(
  {
    issueTitle: { type: String, required: true },
    before: { type: String, default: "" },
    after: { type: String, default: "" },
    canvaSteps: { type: [String], default: [] },
    whyItWorks: { type: String, default: "" },
  },
  { _id: false }
);

const savedRecommendationSchema = new Schema(
  {
    issueTitle: { type: String, required: true },
    before: { type: String, default: "" },
    after: { type: String, default: "" },
    canvaSteps: { type: [String], default: [] },
    whyItWorks: { type: String, default: "" },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const guideStepSchema = new Schema(
  {
    stepNumber: { type: Number },
    title: { type: String, default: "" },
    instruction: { type: String, default: "" },
    canvaAction: { type: String, default: "" },
    tip: { type: String, default: "" },
  },
  { _id: false }
);

const savedGuideSchema = new Schema(
  {
    title: { type: String, default: "" },
    overview: { type: String, default: "" },
    steps: { type: [guideStepSchema], default: [] },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const resumeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    canvaAccountId: {
      type: String,
      required: true,
    },
    canvaDesignId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    canvaLink: {
      type: String,
      default: "",
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },

    // Gemini analysis result
    analysis: {
      score: { type: Number, default: 0, min: 0, max: 100 },
      summary: { type: String, default: "" },
      goodAspects: {
        type: [{ title: String, detail: String }],
        default: [],
      },
      issues: {
        type: [
          {
            title: String,
            detail: String,
            severity: {
              type: String,
              enum: ["high", "medium", "low"],
              default: "medium",
            },
          },
        ],
        default: [],
      },
      recommendations: { type: [recommendationSchema], default: [] },
      analyzedAt: { type: Date, default: null },
    },

    // User-saved recommendations
    savedRecommendations: {
      type: [savedRecommendationSchema],
      default: [],
    },

    // User-saved guides
    savedGuides: {
      type: [savedGuideSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Resume = models.resumes || model("resumes", resumeSchema);

export default Resume;
