import { generateObject } from "ai";
import { getAIModel } from "../ai";
import { ToolFactory } from "../tools/ToolFactory";
import { z } from "zod";

export class VettingAgent {
  /**
   * Vets a job lead by scraping its URL and comparing it against the ICP.
   */
  static async execute(url: string) {
    // Basic hardcoded ICP for now (can be passed dynamically later)
    const icp = {
      targetRoles: ["React Developer", "Next.js Engineer", "Full Stack Developer", "Frontend Engineer"],
      minimumBudget: 5000,
      negativeKeywords: ["entry level", "unpaid", "equity only"],
    };

    // 1. Scrape the URL
    const content = await ToolFactory.scrapeWebpage(url);

    // 2. Evaluate against ICP
    const { object } = await generateObject({
      model: getAIModel(),
      schema: z.object({
        fitScore: z.number().min(0).max(100).describe("A score from 0 to 100 indicating how well the job matches the ICP."),
        jobTitle: z.string().describe("The inferred job title or project name"),
        company: z.string().describe("The inferred company name. If none is found, return 'Unknown'"),
        decisionMaker: z.object({
          name: z.string(),
          role: z.string(),
        }).describe("Any inferred decision maker name and role mentioned. If none is found, return name 'Key Stakeholder' and role 'Key Stakeholder'"),
        reasoning: z.string().describe("A 1-2 sentence explanation of why this fit score was given based on the ICP"),
      }),
      prompt: `
        You are an expert Business Development Representative (BDR).
        Your task is to evaluate a job posting and determine if it's a good fit for our agency.
        
        Our Ideal Customer Profile (ICP):
        - Target Roles: ${icp.targetRoles.join(", ")}
        - Minimum Budget: $${icp.minimumBudget}
        - Red Flags (Negative Keywords): ${icp.negativeKeywords.join(", ")}
        
        Analyze the following scraped job posting content:
        ---
        ${content}
        ---
        
        Provide a structured evaluation including a fit score, extracted job title, company, possible decision maker, and brief reasoning.
      `,
    });

    return object;
  }
}
