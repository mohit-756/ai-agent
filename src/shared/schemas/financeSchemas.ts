import { z } from 'zod';

export const CategoryEnum = z.enum([
  'Food & Dining',
  'Transportation',
  'Shopping & Retail',
  'Bills & Utilities',
  'Entertainment',
  'Health & Wellness',
  'Travel',
  'Education',
  'Services',
  'Income',
  'Others',
]);

export const PaymentMethodEnum = z.enum([
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Cash',
]);

export const ExpenseInputSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  category: CategoryEnum,
  description: z.string().min(1, 'Description is required'),
  merchant: z.string().optional(),
  paymentMethod: PaymentMethodEnum,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  type: z.enum(['expense', 'income']).optional().default('expense'),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.enum(['manual', 'whatsapp', 'nlp']).optional().default('manual'),
  receiptUrl: z.string().url().optional().or(z.literal('')),
  idempotencyKey: z.string().uuid().optional(),
});

export const BudgetInputSchema = z.object({
  category: CategoryEnum,
  allocatedAmount: z.number().positive('Budget amount must be positive'),
  period: z.literal('monthly').default('monthly'),
});

export const PaymentHistorySchema = z.object({
  id: z.string(),
  amount: z.number().positive(),
  date: z.string(),
  notes: z.string().optional(),
});

export const PeerRecordInputSchema = z.object({
  name: z.string().min(1, 'Peer name is required'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['lent', 'borrowed']),
  description: z.string().min(1, 'Description is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().optional(),
  status: z.enum(['pending', 'settled']).default('pending'),
  payments: z.array(PaymentHistorySchema).optional().default([]),
});

export const ParsedAgentOutputSchema = z.object({
  intent: z.enum(['add_expense', 'update_budget', 'add_peer_record', 'financial_query', 'unknown']),
  confidence: z.number().min(0).max(1),
  data: z.object({
    amount: z.number().nullable().optional(),
    category: CategoryEnum.optional(),
    description: z.string().optional(),
    merchant: z.string().optional(),
    paymentMethod: PaymentMethodEnum.optional(),
    peerName: z.string().optional(),
    type: z.enum(['expense', 'income', 'lent', 'borrowed']).optional(),
    date: z.string().optional(),
  }).optional(),
  reply: z.string().optional(),
});
