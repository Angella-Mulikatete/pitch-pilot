import { generateText, Output } from "ai";
import { getAIModel } from "../ai";
import { ToolFactory } from "../tools/ToolFactory";
import { z } from "zod";

const vettingSchema = z.object({
  fitScore: z.number().min(0).max(100),
  jobTitle: z.string(),
  company: z.string(),
  decisionMaker: z.object({
    name: z.string(),
    role: z.string(),
  }),
  reasoning: z.string(),
});

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
    const { output } = await generateText({
      model: getAIModel(),
      output: Output.json(),
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
        You MUST output the response as a JSON object matching this schema exactly:
        {
          "fitScore": number (A score from 0 to 100 indicating how well the job matches the ICP),
          "jobTitle": string (The inferred job title or project name),
          "company": string (The inferred company name. If none is found, return "Unknown"),
          "decisionMaker": {
            "name": string (Any inferred decision maker name mentioned. If none, return "Key Stakeholder"),
            "role": string (Any inferred role. If none, return "Key Stakeholder")
          },
          "reasoning": string (A 1-2 sentence explanation of why this fit score was given based on the ICP)
        }
      `,
    });

    return vettingSchema.parse(output);
  }
}


