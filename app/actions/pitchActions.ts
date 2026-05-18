"use server";

import { AgentFactory } from "@/lib/agents/AgentFactory";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function startVettingProcess(url: string) {
  try {
    // 1. Create the lead in the database (Status: VETTING)
    // For server actions, we use ConvexHttpClient
    let leadId: Id<"leads">;
    try {
      // NOTE: This assumes the user has run `npx convex dev` to generate api.
      // If not, this will fail at build/runtime.
      leadId = await convex.mutation(api.leads.createLead, { url });
    } catch (e) {
      console.error("Convex error: Make sure you ran npx convex dev", e);
      throw new Error("Database not initialized");
    }

    // 2. Fetch the appropriate agent using the Factory Pattern
    const vettingAgent = AgentFactory.get("vetting");

    // 3. Execute the agent's logic asynchronously (don't block the UI return if we don't want to)
    // Actually, for the hackathon demo, we want to return the leadId immediately so the UI can subscribe to it,
    // and run the vetting in the background. But since Vercel serverless functions die when they return,
    // we either await it here (blocking for ~5-10s) OR we use something like `waitUntil` from @vercel/functions.
    // For simplicity in the demo, we will await it here.
    
    const evaluation = await vettingAgent.execute(url);

    // 4. Update the lead with the results and advance to DOSSIER status
    await convex.mutation(api.leads.updateLeadStatus, {
      id: leadId,
      status: "DOSSIER",
    });

    // 5. We need another mutation to update the lead's fit score and decision maker.
    // Let's create a patch mutation or just add a new mutation in convex/leads.ts
    // For now, let's assume we'll add updateLeadDetails in leads.ts.
    await convex.mutation(api.leads.updateLeadDetails, {
      id: leadId,
      fitScore: evaluation.fitScore,
      jobTitle: evaluation.jobTitle,
      company: evaluation.company,
      decisionMaker: evaluation.decisionMaker,
    });

    return { success: true, leadId, evaluation };
  } catch (error) {
    console.error("Vetting pipeline failed:", error);
    return { success: false, error: String(error) };
  }
}
