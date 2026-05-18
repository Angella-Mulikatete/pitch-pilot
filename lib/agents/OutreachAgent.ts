import { EmailStrategy } from "./outreach/EmailStrategy";
import { LinkedInStrategy } from "./outreach/LinkedInStrategy";
import { OutreachStrategyContext } from "./outreach/OutreachStrategy";

export class OutreachAgent {
  private static strategies = {
    email: new EmailStrategy(),
    linkedin: new LinkedInStrategy(),
  };

  /**
   * Orchestrates outreach copywriting across multiple social strategies dynamically.
   */
  static async execute(context: OutreachStrategyContext) {
    // Run both outreach strategies in parallel (Strategy Pattern)
    const [emailRes, linkedinRes] = await Promise.all([
      this.strategies.email.generate(context),
      this.strategies.linkedin.generate(context),
    ]);

    return {
      emailDraftSubject: emailRes.subject,
      emailDraftBody: emailRes.body,
      linkedInConnectionRequest: linkedinRes.connectionRequest,
      linkedInPitchHook: linkedinRes.pitchHook,
    };
  }
}
