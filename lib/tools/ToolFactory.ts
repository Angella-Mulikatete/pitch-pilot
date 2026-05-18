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
      
      $("script, style, noscript, iframe, img, svg, video").remove();
      const mainContent = $("main, article, .job-description, #job-details").text().trim() || $("body").text().trim();
      return mainContent.replace(/\s+/g, ' ').slice(0, 8000);
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
