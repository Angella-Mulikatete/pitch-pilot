import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { OutreachStrategy, OutreachStrategyContext } from "./OutreachStrategy";

export class LinkedInStrategy implements OutreachStrategy {
  async generate(context: OutreachStrategyContext) {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        connectionRequest: z.string().max(290).describe("A personalized LinkedIn connection request note. MUST BE STRICTLY UNDER 290 CHARACTERS including spaces."),
        pitchHook: z.string().describe("A follow-up conversational pitch message once the connection is accepted. Keep it casual, direct, and under 100 words."),
      }),
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
      `,
    });

    return object;
  }
}
