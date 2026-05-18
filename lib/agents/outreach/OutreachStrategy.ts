export interface OutreachStrategyContext {
  jobTitle?: string;
  company?: string;
  description?: string;
  clientDossier?: string;
  proposalDraft?: string;
  decisionMaker?: {
    name: string;
    role: string;
  };
}

export interface OutreachStrategy {
  /**
   * Poly-morphic method to generate highly customized outreach copies based on the active strategy.
   */
  generate(context: OutreachStrategyContext): Promise<any>;
}
