import { PricingAgent } from './pricingAgent';
import { ServiceAgent } from './serviceAgent';

export const AgentRegistry: Record<string, any> = {
  PricingAgent,
  ServiceAgent
};

/**
 * Executes a sub-agent based on AI command.
 */
export const invokeSubAgent = async (agentName: string, params: any) => {
  const agent = AgentRegistry[agentName];
  if (!agent) {
    return { success: false, error: `Agent ${agentName} not found.` };
  }

  console.log(`[Sub-Agent] Invoking ${agentName}...`);
  return await agent.execute(params);
};
