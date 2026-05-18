import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { OutreachStrategy, OutreachStrategyContext } from "./OutreachStrategy";

export class EmailStrategy implements OutreachStrategy {
  async generate(context: OutreachStrategyContext) {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        subject: z.string().describe("A short, hyper-engaging email subject line (avoid spam words, keep it personal and curious)"),
        body: z.string().describe("The email body text in plain text or with standard linebreaks. Use a professional, warm, value-driven, and brief tone."),
      }),
      prompt: `
        You are a world-class cold outreach copywriter. Your goal is to write a highly converting cold email to a prospective client.
        
        Lead Details:
        - Job Title: ${context.jobTitle ?? "Unknown"}
        - Company: ${context.company ?? "Unknown"}
        - Job Description: ${context.description ?? "N/A"}
        - Decision Maker to Address: ${context.decisionMaker?.name ?? "Team"} (Role: ${context.decisionMaker?.role ?? "Key stakeholder"})
        
        Strategic Dossier:
        ${context.clientDossier ?? "N/A"}
        
        Proposed Solution Plan:
        ${context.proposalDraft ?? "N/A"}
        
        Guidelines:
        1. **Subject Line**: Make it sound human-to-human, curious, and specific (e.g. "quick question about your Next.js project", "improving mobile engagement for CarePulse"). Keep it under 6-7 words.
        2. **Email Body**:
           - Keep it short (under 150-180 words) and incredibly scannable.
           - Start with a personalized, contextual hook based on their pain points.
           - Briefly explain how our custom solution adds enormous value (mentioning standard MVP milestones or previous similar proposals from RAG).
           - End with a low-friction, single call to action (e.g. "Are you open to a 10-minute chat next week to see a live mockup?").
           - Sign off as "PitchPilot Studios team". Do not leave place-holders like "[Your Name]".
      `,
    });

    return object;
  }
}
