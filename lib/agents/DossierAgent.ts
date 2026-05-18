import { generateText, embed, Output } from "ai";
import { getAIModel, getEmbeddingModel } from "../ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { z } from "zod";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const dossierSchema = z.object({
  inferredPainPoints: z.array(z.string()),
  companyInsights: z.string(),
  potentialRedFlags: z.array(z.string()),
  strategicApproach: z.string(),
});

export class DossierAgent {
  /**
   * Generates a strategic Client Dossier using RAG (vector search over past proposals) and GPT-4o.
   */
  static async execute(lead: { jobTitle?: string; company?: string; description?: string; url: string }) {
    const jobText = `${lead.jobTitle ?? ""} ${lead.company ?? ""} ${lead.description ?? ""}`.trim();
    
    let similarProposalsText = "No direct past matching proposals found.";
    
    try {
      // 1. Get the embedding model — skip RAG if unavailable
      const embeddingModel = getEmbeddingModel();
      if (!embeddingModel) {
        console.info("RAG skipped: no embedding provider configured. Dossier will be generated without past proposal context.");
      } else {
        // 2. Generate embedding for the job posting
        const { embedding } = await embed({
          model: embeddingModel,
          value: jobText || "React Full Stack Developer lead",
        });

        // 3. Query Convex for similar past successful proposals
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
      }
    } catch (e: any) {
      // Quota exceeded or network error — RAG is optional, continue without it
      const isQuotaError = e?.lastError?.statusCode === 429 || e?.statusCode === 429;
      if (isQuotaError) {
        console.info("RAG skipped: OpenAI embedding quota exceeded. Dossier will be generated without past proposal context.");
      } else {
        console.warn("RAG Vector Search failed — continuing without it:", e?.message ?? e);
      }
    }

    // 3. Prompt GPT-4o to synthesize the Job description, Company info, and Past proposals into a Client Dossier
    const { output } = await generateText({
      model: getAIModel(),
      output: Output.json(),
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
        You MUST output the response as a JSON object matching this schema exactly:
        {
          "inferredPainPoints": ["3-5 highly strategic pain points the client is facing based on the job details"],
          "companyInsights": "Synthesized research and recent activity about the company",
          "potentialRedFlags": ["Any warning signs, budget concerns, or timeline risks to be aware of"],
          "strategicApproach": "How we should position ourselves to win this deal, referencing our past successful case studies/proposals if applicable"
        }
      `,
    });

    return dossierSchema.parse(output);
  }
}

