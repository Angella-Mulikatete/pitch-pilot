import * as cheerio from "cheerio";
import { tool } from "ai";
import { z } from "zod";

export class ToolFactory {
  /**
   * Raw scraping logic that can be invoked directly by Agents without TS complaining about AI SDK tool types.
   */
  static async scrapeWebpage(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });
      
      if (!response.ok) {
        return `Failed to fetch URL. Status: ${response.status}`;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const extraTextParts: string[] = [];

      // 1. Extract from LD+JSON schema tags (e.g. JobPosting)
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const jsonText = $(el).text().trim();
          if (jsonText) {
            const data = JSON.parse(jsonText);
            if (data && typeof data === "object") {
              const parts: string[] = [];
              if (data.title || data.name) parts.push(`Title: ${data.title || data.name}`);
              if (data.description) parts.push(`Description: ${data.description}`);
              if (data.skills || data.skillsRequired) parts.push(`Skills Required: ${data.skills || data.skillsRequired}`);
              if (data.hiringOrganization?.name) parts.push(`Company: ${data.hiringOrganization.name}`);
              if (parts.length > 0) {
                extraTextParts.push(`--- Structured Schema Details ---\n${parts.join("\n")}`);
              }
            }
          }
        } catch (e) {
          // ignore individual json parsing errors
        }
      });

      // 2. Extract from Next.js server-rendered push state scripts
      $('script').each((_, el) => {
        const text = $(el).text();
        if (text.includes("self.__next_f.push")) {
          const pushRegex = /self\.__next_f\.push\(\[\d+,\s*"([\s\S]*?)"\]\)/g;
          let match;
          while ((match = pushRegex.exec(text)) !== null) {
            const escapedStr = match[1];
            const unescaped = escapedStr
              .replace(/\\"/g, '"')
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\\\/g, '\\');
            
            if (unescaped.length > 100 && !unescaped.trim().startsWith('[') && !unescaped.trim().startsWith('{')) {
              extraTextParts.push(unescaped.trim());
            } else if (unescaped.includes('"title"') || unescaped.includes('"skillsRequired"') || unescaped.includes('"jobDetails"')) {
              const cleaned = unescaped.replace(/[\[\]{}"$:,]/g, ' ').replace(/\s+/g, ' ').trim();
              if (cleaned.length > 100) {
                extraTextParts.push(cleaned);
              }
            }
          }
        }
      });

      // 3. Perform standard HTML text extraction
      $("script, style, noscript, iframe, img, svg, video").remove();
      const mainContent = $("main, article, .job-description, #job-details").text().trim() || $("body").text().trim();
      
      let finalContent = mainContent.replace(/\s+/g, ' ').slice(0, 8000);
      
      // If standard text extraction yielded almost nothing, leverage our extracted script contents!
      if (finalContent.length < 300 && extraTextParts.length > 0) {
        finalContent = `${finalContent}\n\n--- Extracted Next.js Pre-rendered Data ---\n${extraTextParts.join("\n\n")}`.trim().slice(0, 10000);
      }
      
      return finalContent;
    } catch (error) {
      return `Error scraping URL: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }

  /**
   * Creates a web scraper tool for standard agent loops.
   */
  static createWebScraperTool() {
    return tool({
      description: "Scrapes a webpage to extract text content, useful for reading job descriptions or company websites.",
      parameters: z.object({
        url: z.string().url().describe("The URL of the webpage to scrape"),
      }),
      execute: async ({ url }: { url: string }) => {
        const content = await ToolFactory.scrapeWebpage(url);
        return { content };
      },
    } as any);
  }
}
