import { generateObject, embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { z } from "zod";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export class DossierAgent {
  /**
   * Generates a strategic Client Dossier using RAG (vector search over past proposals) and GPT-4o.
   */
  static async execute(lead: { jobTitle?: string; company?: string; description?: string; url: string }) {
    const jobText = `${lead.jobTitle ?? ""} ${lead.company ?? ""} ${lead.description ?? ""}`.trim();
    
    let similarProposalsText = "No direct past matching proposals found.";
    
    try {
      // 1. Generate embedding for the job posting using OpenAI embedding
      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: jobText || "React Full Stack Developer lead",
      });

      // 2. Query Convex for similar past successful proposals
      const similarProposals = await convex.action(api.proposals.searchSimilarProposals, {
        embedding,
        limit: 2,
      });

      if (similarProposals && similarProposals.length > 0) {
        similarProposalsText = similarProposals.map((prop: any, idx: number) => `
        --- PAST SUCCESSFUL PROPOSAL #${idx + 1} ---
        Title: ${prop.title}
        Client tech stack: ${prop.techStack.join(", ")}
        Content: ${prop.content}
        `).join("\n");
      }
    } catch (e) {
      console.warn("RAG Vector Search failed (make sure proposals are inserted/indexed):", e);
    }

    // 3. Prompt GPT-4o to synthesize the Job description, Company info, and Past proposals into a Client Dossier
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        inferredPainPoints: z.array(z.string()).describe("3-5 highly strategic pain points the client is facing based on the job details"),
        companyInsights: z.string().describe("Synthesized research and recent activity about the company"),
        potentialRedFlags: z.array(z.string()).describe("Any warning signs, budget concerns, or timeline risks to be aware of"),
        strategicApproach: z.string().describe("How we should position ourselves to win this deal, referencing our past successful case studies/proposals if applicable"),
      }),
      prompt: `
        You are a principal Strategic Sales Consultant and expert BDR partner.
        Your goal is to arm the sales team with a hyper-detailed "Client Dossier" (internal brief) for a hot lead.
        
        Job Listing Information:
        - Job Title: ${lead.jobTitle ?? "Unknown"}
        - Company: ${lead.company ?? "Unknown"}
        - URL: ${lead.url}
        - Full Description:
        ${lead.description ?? "N/A"}
        
        Reference Materials (Similar past successful proposals from our history):
        ${similarProposalsText}
        
        Based on the job posting, infer their deep challenges and technical needs. Use the successful past proposals to formulate a winning strategic approach.
        Provide the output in a clean, structured JSON format.
      `,
    });

    return object;
  }
}
