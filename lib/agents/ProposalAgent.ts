import { generateText, Output } from "ai";
import { getAIModel } from "../ai";
import { z } from "zod";

const proposalSchema = z.object({
  proposalDraft: z.string(),
  pricingTiers: z.array(
    z.object({
      name: z.string(),
      price: z.string(),
      scope: z.array(z.string()),
    })
  ).min(3).max(3),
});

export class ProposalAgent {
  /**
   * Generates a tailored professional proposal draft and multi-tiered pricing based on the lead context.
   */
  static async execute(lead: { 
    jobTitle?: string; 
    company?: string; 
    description?: string; 
    clientDossier?: string;
  }) {
    // Parse the dossier to feed clean text to the model
    let dossierText = "No deep dossier insights compiled.";
    if (lead.clientDossier) {
      try {
        const parsed = JSON.parse(lead.clientDossier);
        dossierText = `
        Inferred Pain Points: ${parsed.inferredPainPoints?.join(", ")}
        Company Research: ${parsed.companyInsights}
        Risks/Red Flags: ${parsed.potentialRedFlags?.join(", ")}
        Strategic Approach Blueprint: ${parsed.strategicApproach}
        `;
      } catch (e) {
        dossierText = lead.clientDossier;
      }
    }

    const { output } = await generateText({
      model: getAIModel(),
      output: Output.json(),
      prompt: `
        You are a principal Solutions Architect and veteran Sales Partner for a world-class software development agency.
        Your task is to write a highly compelling, custom proposal and structure a 3-tier pricing strategy for this active lead.
        
        Job Lead context:
        - Job Title: ${lead.jobTitle ?? "Unknown role"}
        - Client Company: ${lead.company ?? "Unknown"}
        - Job Description:
        ${lead.description ?? "N/A"}
        
        Synthesized Strategic Dossier & RAG insights:
        ${dossierText}
        
        Guidelines:
        1. **Proposal Draft**:
           - Write it in persuasive, executive-level markdown.
           - Start directly with an Executive Summary. Add sections for: Technical Solution Architectures, Timeline & Milestones, and Why We Win (leveraging our agency case studies).
           - Do not use placeholders (like "[Insert Date]" or "[Your Name]"). Use real details appropriate for the agency "PitchPilot Studios".
        2. **Pricing Structure**:
           - Create exactly 3 tiers: Basic (MVP), Standard (Recommended), and Premium (Scale).
           - Base the estimated dollar amount logically on the job budget context. If no budget is inferred, use realistic agency numbers (e.g., $4k basic, $8k standard, $15k premium).
           - Specify distinct, comprehensive list of deliverables for each tier's scope.

        You MUST output the response as a JSON object matching this schema exactly:
        {
          "proposalDraft": "A comprehensive, professional markdown-formatted sales proposal draft (executive summary, technical proposal, timelines, and credentials)",
          "pricingTiers": [
            {
              "name": "Tier name, e.g., 'Core MVP Integration'",
              "price": "Price figure, e.g., '$4,800'",
              "scope": ["deliverable 1", "deliverable 2", "deliverable 3"]
            },
            {
              "name": "Tier name, e.g., 'Full-Scale Platform'",
              "price": "Price figure, e.g., '$9,500'",
              "scope": ["deliverable 1", "deliverable 2", "deliverable 3"]
            },
            {
              "name": "Tier name, e.g., 'Premium Scale & Support'",
              "price": "Price figure, e.g., '$15,000'",
              "scope": ["deliverable 1", "deliverable 2", "deliverable 3"]
            }
          ]
        }
      `,
    });

    return proposalSchema.parse(output);
  }
}

