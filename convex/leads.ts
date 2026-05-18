import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getLead = query({
  args: { id: v.id("leads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getLeads = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("leads").order("desc").collect();
  },
});

export const createLead = mutation({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("leads", {
      url: args.url,
      status: "VETTING",
    });
  },
});

export const updateLeadStatus = mutation({
  args: {
    id: v.id("leads"),
    status: v.union(
      v.literal("VETTING"),
      v.literal("DOSSIER"),
      v.literal("PROPOSAL"),
      v.literal("READY")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const updateLeadDetails = mutation({
  args: {
    id: v.id("leads"),
    fitScore: v.optional(v.number()),
    jobTitle: v.optional(v.string()),
    company: v.optional(v.string()),
    decisionMaker: v.optional(
      v.object({
        name: v.string(),
        role: v.string(),
        linkedIn: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...details } = args;
    await ctx.db.patch(id, details);
  },
});

