import { VettingAgent } from "./VettingAgent";
import { DossierAgent } from "./DossierAgent";
import { ProposalAgent } from "./ProposalAgent";

export type AgentType = "vetting" | "dossier" | "proposal" | "outreach";

export class AgentFactory {
  /**
   * Dynamically instantiates and returns the correct agent logic based on the requested persona.
   */
  static get(type: AgentType) {
    switch (type) {
      case "vetting":
        return VettingAgent;
      case "dossier":
        return DossierAgent;
      case "proposal":
        return ProposalAgent;
      case "outreach":
        throw new Error("OutreachAgent not yet implemented");
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
}
