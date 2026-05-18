import { VettingAgent } from "./VettingAgent";

export type AgentType = "vetting" | "proposal" | "outreach";

export class AgentFactory {
  /**
   * Dynamically instantiates and returns the correct agent logic based on the requested persona.
   */
  static get(type: AgentType) {
    switch (type) {
      case "vetting":
        return VettingAgent;
      case "proposal":
        throw new Error("ProposalAgent not yet implemented");
      case "outreach":
        throw new Error("OutreachAgent not yet implemented");
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
}
