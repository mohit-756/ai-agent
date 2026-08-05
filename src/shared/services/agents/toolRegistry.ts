import { ExpenseService } from '../../../services/expenseService';
import { BudgetService } from '../../../services/budgetService';
import { PeerService } from '../../../services/peerService';
import { AIFinanceService } from '../../../services/aiFinanceService';
import { ExpenseInputSchema, BudgetInputSchema, PeerRecordInputSchema } from '../../schemas/financeSchemas';

export interface ToolExecutionResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface Tool {
  name: string;
  description: string;
  execute: (input: any, idempotencyKey?: string) => Promise<ToolExecutionResult>;
}

export const toolRegistry: Record<string, Tool> = {
  createExpense: {
    name: 'createExpense',
    description: 'Creates a new transaction/expense or income record',
    execute: async (input: any) => {
      const parsed = ExpenseInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          success: false,
          message: `Validation failed: ${parsed.error.issues.map((e) => e.message).join(', ')}`,
        };
      }
      const newExp = ExpenseService.addExpense(parsed.data);
      return {
        success: true,
        message: `Successfully logged expense "${newExp.description}" for ₹${newExp.amount}`,
        data: newExp,
      };
    },
  },

  updateBudget: {
    name: 'updateBudget',
    description: 'Updates category budget limit',
    execute: async (input: any) => {
      const parsed = BudgetInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          success: false,
          message: `Validation failed: ${parsed.error.issues.map((e) => e.message).join(', ')}`,
        };
      }
      BudgetService.updateCategoryBudget(parsed.data.category, parsed.data.allocatedAmount);
      return {
        success: true,
        message: `Updated budget for ${parsed.data.category} to ₹${parsed.data.allocatedAmount}`,
      };
    },
  },

  createPeerDebt: {
    name: 'createPeerDebt',
    description: 'Logs money lent to or borrowed from a peer',
    execute: async (input: any) => {
      const parsed = PeerRecordInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          success: false,
          message: `Validation failed: ${parsed.error.issues.map((e) => e.message).join(', ')}`,
        };
      }
      const record = PeerService.addPeerRecord({
        name: parsed.data.name,
        originalAmount: parsed.data.amount,
        type: parsed.data.type,
        description: parsed.data.description,
        date: parsed.data.date,
        dueDate: parsed.data.dueDate,
      });
      return {
        success: true,
        message: `Logged ${parsed.data.type} transaction with ${parsed.data.name} for ₹${parsed.data.amount}`,
        data: record,
      };
    },
  },

  generateInsight: {
    name: 'generateInsight',
    description: 'Generates financial insights and budget advice',
    execute: async () => {
      const expenses = ExpenseService.getExpenses();
      const budgets = BudgetService.getBudgets();
      const insights = AIFinanceService.generateSpendingInsights(expenses, budgets);
      return {
        success: true,
        message: `Generated ${insights.length} insights`,
        data: insights,
      };
    },
  },
};
