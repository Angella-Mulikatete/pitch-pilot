import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Query to get proposals by IDs
export const getProposalsByIds = query({
  args: { ids: v.array(v.id("proposals")) },
  handler: async (ctx, args) => {
    const results = [];
    for (const id of args.ids) {
      const doc = await ctx.db.get(id);
      if (doc) {
        results.push(doc);
      }
    }
    return results;
  },
});

// Mutation to insert a proposal
export const insertProposal = mutation({
  args: {
    title: v.string(),
    clientName: v.string(),
    techStack: v.array(v.string()),
    content: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("proposals", args);
  },
});

// Action to perform vector search
export const searchSimilarProposals = action({
  args: {
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const limit = args.limit ?? 3;
    const searchResults = await ctx.vectorSearch("proposals", "by_embedding", {
      vector: args.embedding,
      limit,
    });

    const ids = searchResults.map((result) => result._id);
    if (ids.length === 0) return [];

    // Call public query to get full documents with explicit type annotation
    const results: any[] = await ctx.runQuery(api.proposals.getProposalsByIds, { ids });
    return results;
  },
});
