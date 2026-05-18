import { VettingAgent } from "./VettingAgent";
import { DossierAgent } from "./DossierAgent";
import { ProposalAgent } from "./ProposalAgent";
import { OutreachAgent } from "./OutreachAgent";

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
        return OutreachAgent;
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
}
