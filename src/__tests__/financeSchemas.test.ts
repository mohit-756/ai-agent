import { describe, it, expect } from 'vitest';
import { ExpenseInputSchema, BudgetInputSchema, PeerRecordInputSchema } from '../shared/schemas/financeSchemas';

describe('Finance Zod Validation Schemas', () => {
  it('validates a correct expense input payload', () => {
    const payload = {
      amount: 250,
      category: 'Food & Dining',
      description: 'Swiggy lunch',
      paymentMethod: 'UPI',
      date: '2026-08-04',
    };
    const result = ExpenseInputSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects invalid or negative expense amounts', () => {
    const payload = {
      amount: -100,
      category: 'Food & Dining',
      description: 'Invalid',
      paymentMethod: 'UPI',
      date: '2026-08-04',
    };
    const result = ExpenseInputSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('validates budget limit updates', () => {
    const payload = {
      category: 'Transportation',
      allocatedAmount: 5000,
    };
    const result = BudgetInputSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('validates peer record payloads', () => {
    const payload = {
      name: 'Rahul',
      amount: 1200,
      type: 'lent',
      description: 'Dinner split',
      date: '2026-08-04',
    };
    const result = PeerRecordInputSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
