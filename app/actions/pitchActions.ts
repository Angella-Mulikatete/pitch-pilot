"use server";

import { AgentFactory } from "@/lib/agents/AgentFactory";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function startVettingProcess(url: string, description?: string) {
  try {
    // 1. Create the lead in the database (Status: VETTING)
    let leadId: Id<"leads">;
    try {
      leadId = await convex.mutation(api.leads.createLead, { 
        url,
        description,
        source: "manual",
      });
    } catch (e) {
      console.error("Convex error: Make sure you ran npx convex dev", e);
      throw new Error("Database not initialized");
    }

    // 2. Fetch the vetting agent
    const vettingAgent = AgentFactory.get("vetting") as any;
    const evaluation = await vettingAgent.execute(url);

    // 3. Update the lead details
    await convex.mutation(api.leads.updateLeadDetails, {
      id: leadId,
      fitScore: evaluation.fitScore,
      jobTitle: evaluation.jobTitle,
      company: evaluation.company,
      decisionMaker: evaluation.decisionMaker,
    });

    // 4. If fit score is high enough (>= 50), run the DossierAgent (RAG + Research)
    let dossier = null;
    if (evaluation.fitScore >= 50) {
      const dossierAgent = AgentFactory.get("dossier") as any;
      const dossierObj = await dossierAgent.execute({
        jobTitle: evaluation.jobTitle,
        company: evaluation.company,
        description: description || evaluation.reasoning,
        url,
      });
      dossier = dossierObj;
      await convex.mutation(api.leads.updateLeadDossier, {
        id: leadId,
        clientDossier: JSON.stringify(dossierObj),
      });
    } else {
      // Just advance status to DOSSIER anyway without rich dossier
      await convex.mutation(api.leads.updateLeadStatus, {
        id: leadId,
        status: "DOSSIER",
      });
    }

    return { success: true, leadId, evaluation, dossier };
  } catch (error) {
    console.error("Vetting pipeline failed:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Discovers jobs from Google Jobs via SerpAPI (or mock fallback if API fails/not configured).
 */
export async function discoverJobsAction(query: string, location: string) {
  try {
    const apiKey = process.env.SERP_API_KEY;
    let jobs = [];

    if (apiKey && apiKey !== "your_key_here") {
      try {
        const url = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&api_key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.jobs_results) {
          jobs = data.jobs_results.slice(0, 5).map((job: any) => ({
            title: job.title || "Untitled Job",
            description: job.description || "",
            url: job.share_link || job.apply_options?.[0]?.link || "https://google.com/jobs",
            company: job.company_name || "Unknown Company",
            location: job.location || location,
            source: "serpapi",
          }));
        }
      } catch (err) {
        console.error("SerpAPI call failed, falling back to mock data:", err);
      }
    }

    // Fallback to high-quality mock data if SerpAPI fails or no key
    if (jobs.length === 0) {
      jobs = [
        {
          title: "Senior React & Next.js Engineer (Remote)",
          description: "We are looking for a senior engineer to build a premium SaaS dashboard with Tailwind CSS, TypeScript, and integrations with Stripe and OpenAI. This is a high-budget project with long-term potential.",
          url: "https://example.com/jobs/react-nextjs-stripe",
          company: "Acme Corp",
          location: "San Francisco, CA (Remote)",
          source: "mock-serpapi",
        },
        {
          title: "Full Stack Developer - React & Supabase",
          description: "Seeking a developer to build an interactive dashboard using React, Tailwind CSS, Supabase, and real-time WebSockets. Clean code, professional design patterns, and optimization are critical.",
          url: "https://example.com/jobs/fullstack-supabase",
          company: "Innovate Labs",
          location: "New York, NY (Remote)",
          source: "mock-serpapi",
        },
        {
          title: "AI Integration specialist (GPT-4o & RAG)",
          description: "We need an expert to integrate OpenAI LLMs, vector search, and custom scraper agents into our existing Next.js application. Immediate start, $8,000 budget.",
          url: "https://example.com/jobs/ai-integration-rag",
          company: "Cognitive AI",
          location: "Austin, TX (Remote)",
          source: "mock-serpapi",
        }
      ];
    }

    // Insert leads into Convex
    const insertedLeads = [];
    for (const job of jobs) {
      const leadId = await convex.mutation(api.leads.createLead, {
        url: job.url,
        jobTitle: job.title,
        company: job.company,
        description: job.description,
        location: job.location,
        source: job.source,
        status: "VETTING",
      });

      // Let's run vetting immediately for the first job to show immediate results in demo
      if (insertedLeads.length === 0) {
        try {
          const evalRes = await startVettingProcess(job.url, job.description);
          insertedLeads.push({
            id: leadId,
            ...job,
            evaluated: true,
            evalRes,
          });
          continue;
        } catch (e) {
          console.error("Discovery vetting error:", e);
        }
      }

      insertedLeads.push({
        id: leadId,
        ...job,
        evaluated: false,
      });
    }

    return { success: true, leads: insertedLeads };
  } catch (error) {
    console.error("Job discovery action failed:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Seeds a few past successful proposals into the Vector Database.
 */
export async function seedPastProposalsAction() {
  try {
    const proposals = [
      {
        title: "Next.js SaaS Platform with Stripe & AI integration",
        clientName: "Acme Analytics",
        techStack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Stripe", "OpenAI"],
        content: `
# Proposal: Acme Analytics Dashboard

We propose building a state-of-the-art SaaS analytics dashboard using Next.js, React, and TypeScript.
Our solution will utilize a Glassmorphism theme, premium styling, and full responsiveness.

## Key Features
1. Stripe Subscription billing & tier management.
2. AI-Powered customer insights using GPT-4o.
3. High-performance caching and vector search for instant data retrieval.

## Budget & Timeline
- Budget: $12,500
- Timeline: 4 Weeks
        `,
      },
      {
        title: "React Native Mobile Health App",
        clientName: "CarePulse Health",
        techStack: ["React Native", "Expo", "Supabase", "Node.js"],
        content: `
# Proposal: CarePulse Healthcare Mobile Application

An elegant, HIPAA-compliant patient dashboard mobile application built with React Native and Expo.

## Key Features
1. Real-time patient-doctor WebSockets messaging.
2. Health metrics data visualization.
3. Offline database synchronization.

## Budget & Timeline
- Budget: $18,000
- Timeline: 6 Weeks
        `,
      }
    ];

    for (const prop of proposals) {
      // Generate embedding
      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: `${prop.title} ${prop.techStack.join(" ")} ${prop.content}`,
      });

      await convex.mutation(api.proposals.insertProposal, {
        title: prop.title,
        clientName: prop.clientName,
        techStack: prop.techStack,
        content: prop.content,
        embedding,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Seeding proposals failed:", error);
    return { success: false, error: String(error) };
  }
}
