import { describe, it, expect } from 'vitest';
import { AgentOrchestrator } from '../shared/services/agents/agentOrchestrator';

describe('AgentOrchestrator Intent Routing', () => {
  it('correctly classifies natural language expense input', async () => {
    const input = 'Spent ₹350 on Swiggy dinner';
    const result = await AgentOrchestrator.processInput(input);
    expect(result.intent).toBe('add_expense');
    expect(result.proposedPayload.amount).toBe(350);
    expect(result.proposedPayload.category).toBe('Food & Dining');
  });

  it('routes financial queries appropriately', async () => {
    const input = 'How much did I spend this month?';
    const result = await AgentOrchestrator.processInput(input);
    expect(result.intent).toBe('financial_query');
    expect(result.confidenceState).toBe('AUTO_SAVE');
  });
});
