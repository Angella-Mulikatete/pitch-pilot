import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  icps: defineTable({
    name: v.string(),
    targetRoles: v.array(v.string()),
    minimumBudget: v.number(),
    targetIndustries: v.array(v.string()),
    negativeKeywords: v.array(v.string()),
    description: v.optional(v.string()),
  }),

  leads: defineTable({
    url: v.string(),
    jobTitle: v.optional(v.string()),
    company: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    source: v.optional(v.string()),
    status: v.union(
      v.literal("VETTING"),
      v.literal("DOSSIER"),
      v.literal("PROPOSAL"),
      v.literal("READY")
    ),
    fitScore: v.optional(v.number()),
    decisionMaker: v.optional(
      v.object({
        name: v.string(),
        role: v.string(),
        linkedIn: v.optional(v.string()),
      })
    ),
    clientDossier: v.optional(v.string()),
    proposalPdfUrl: v.optional(v.string()),
    emailDraft: v.optional(v.string()),
  }),

  proposals: defineTable({
    title: v.string(),
    clientName: v.string(),
    techStack: v.array(v.string()),
    content: v.string(), // The full markdown proposal text
    embedding: v.array(v.float64()),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
  }),

  audit_logs: defineTable({
    leadId: v.id("leads"),
    action: v.string(),
    inputs: v.any(),
    outputs: v.any(),
    reasoning: v.string(),
    timestamp: v.number(),
  }),
});
