import { generateText, Output } from "ai";
import { getAIModel } from "../../ai";
import { z } from "zod";
import { OutreachStrategy, OutreachStrategyContext } from "./OutreachStrategy";

const linkedinSchema = z.object({
  connectionRequest: z.string().max(290),
  pitchHook: z.string(),
});

export class LinkedInStrategy implements OutreachStrategy {
  async generate(context: OutreachStrategyContext) {
    const { output } = await generateText({
      model: getAIModel(),
      output: Output.json(),
      prompt: `
        You are an expert at B2B social selling on LinkedIn. Your job is to draft LinkedIn outreach touchpoints for this lead.
        
        Lead Details:
        - Job Title: ${context.jobTitle ?? "Unknown"}
        - Company: ${context.company ?? "Unknown"}
        - Decision Maker: ${context.decisionMaker?.name ?? "Key stakeholder"} (Role: ${context.decisionMaker?.role ?? "Key stakeholder"})
        
        Strategic Dossier:
        ${context.clientDossier ?? "N/A"}
        
        Guidelines:
        1. **Connection Request Note**:
           - **CRITICAL**: Must be under 290 characters total. It should be highly personal and contextual (e.g. referencing their job post or industry challenges).
           - Do not sell! Just request a connection based on a shared space/interest.
        2. **Follow-up Pitch Hook**:
           - Write a casual, short message (under 100 words) to send after connection acceptance.
           - Connect their business challenge directly to our custom approach.
           - Finish with a low-friction question (e.g., "Are you exploring external dev partners for this MVP?").

        You MUST output the response as a JSON object matching this schema exactly:
        {
          "connectionRequest": "A personalized LinkedIn connection request note (STRICTLY UNDER 290 CHARACTERS including spaces)",
          "pitchHook": "A follow-up conversational pitch message once the connection is accepted"
        }
      `,
    });

    return linkedinSchema.parse(output);
  }
}

