import { toolRegistry } from './toolRegistry';
import { AIFinanceService } from '../../../services/aiFinanceService';
import type { Category, PaymentMethod } from '../../../types/expense';

export type ConfidenceState = 'AUTO_SAVE' | 'PREVIEW_CONFIRM' | 'EDITABLE_FORM';

export interface AgentOrchestratorResult {
  intent: 'add_expense' | 'update_budget' | 'add_peer_record' | 'financial_query' | 'unknown';
  confidence: number;
  confidenceState: ConfidenceState;
  toolName?: string;
  proposedPayload?: any;
  replyMessage: string;
  autoExecutionResult?: any;
}

export class AgentOrchestrator {
  public static async processInput(text: string): Promise<AgentOrchestratorResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        intent: 'unknown',
        confidence: 0,
        confidenceState: 'EDITABLE_FORM',
        replyMessage: 'Please enter a valid message or command.',
      };
    }

    // 1. Run NLP Parser to extract intent and structured data
    const parsedExp = AIFinanceService.parseNaturalLanguageExpense(trimmed);
    
    // Check if it's an expense action
    if (parsedExp.amount && parsedExp.amount > 0) {
      const confidence = parsedExp.confidence ?? 0.85;

      let confidenceState: ConfidenceState = 'PREVIEW_CONFIRM';
      if (confidence >= 0.90) {
        confidenceState = 'AUTO_SAVE';
      } else if (confidence < 0.70) {
        confidenceState = 'EDITABLE_FORM';
      }

      const proposedPayload = {
        amount: parsedExp.amount,
        category: parsedExp.category as Category,
        description: parsedExp.description || 'NLP Added Expense',
        merchant: parsedExp.merchant,
        paymentMethod: parsedExp.paymentMethod as PaymentMethod,
        date: parsedExp.date,
        source: 'nlp',
      };

      // If high confidence >= 0.90, execute automatically via ToolRegistry
      let autoExecutionResult: any = null;
      if (confidenceState === 'AUTO_SAVE') {
        autoExecutionResult = await toolRegistry.createExpense.execute(proposedPayload);
      }

      return {
        intent: 'add_expense',
        confidence,
        confidenceState,
        toolName: 'createExpense',
        proposedPayload,
        replyMessage: autoExecutionResult
          ? autoExecutionResult.message
          : `Extracted expense of ₹${parsedExp.amount} for "${parsedExp.description}" (${parsedExp.category}).`,
        autoExecutionResult,
      };
    }

    // 2. Financial Query Fallback
    const chatReply = AIFinanceService.queryExpenseAssistant(trimmed, [], []);
    return {
      intent: 'financial_query',
      confidence: 0.95,
      confidenceState: 'AUTO_SAVE',
      replyMessage: chatReply.text,
    };
  }
}
