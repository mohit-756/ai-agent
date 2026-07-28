import type { WhatsAppMessage, Expense } from '../types/expense';
import { AIFinanceService } from './aiFinanceService';
import { ExpenseService, formatCurrency } from './expenseService';
import { BudgetService } from './budgetService';
import { PeerService } from './peerService';

const WHATSAPP_STORAGE_KEY = 'ai_expense_tracker_whatsapp_chats';

const INITIAL_WHATSAPP_CHAT: WhatsAppMessage[] = [
  {
    id: 'wa-1',
    sender: 'bot',
    body: `👋 *Welcome to SpendWise WhatsApp Bot!*\n\nYou can text me your daily expenses or peer loans anytime!\n\n*Examples:*\n• "Spent ₹250 on Swiggy lunch"\n• "Lent ₹500 to Rohit for dinner split"\n• "Borrowed ₹300 from Amit for cab"\n• "How much did I spend this month?"`,
    timestamp: new Date(Date.now() - 3600000 * 5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

export class WhatsAppService {

  public static getChatHistory(): WhatsAppMessage[] {
    try {
      const stored = localStorage.getItem(WHATSAPP_STORAGE_KEY);
      if (!stored) {
        this.saveChatHistory(INITIAL_WHATSAPP_CHAT);
        return INITIAL_WHATSAPP_CHAT;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_WHATSAPP_CHAT;
    }
  }

  public static saveChatHistory(messages: WhatsAppMessage[]): void {
    localStorage.setItem(WHATSAPP_STORAGE_KEY, JSON.stringify(messages));
  }

  /**
   * Process incoming WhatsApp Message Webhook
   */
  public static processIncomingMessage(userText: string): {
    userMessage: WhatsAppMessage;
    botResponse: WhatsAppMessage;
    addedExpense?: Expense;
  } {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // 1. User Message
    const userMessage: WhatsAppMessage = {
      id: `wa-msg-${Date.now()}`,
      sender: 'user',
      body: userText,
      timestamp,
      status: 'read'
    };

    // 2. Parse using AI Engine
    const peerParsed = AIFinanceService.parseNaturalLanguagePeerRecord(userText);
    const parsed = AIFinanceService.parseNaturalLanguageExpense(userText);
    let botResponseBody = '';
    let addedExpense: Expense | undefined = undefined;

    if (peerParsed.isPeerRecord && peerParsed.amount && peerParsed.peerName) {
      // Auto Add Peer Record
      PeerService.addPeerRecord({
        name: peerParsed.peerName,
        originalAmount: peerParsed.amount,
        type: peerParsed.type || 'lent',
        description: peerParsed.description || 'WhatsApp Entry',
        date: peerParsed.date || new Date().toISOString().split('T')[0],
        dueDate: peerParsed.dueDate
      });

      botResponseBody = `👥 *Peer Ledger Record Added!*\n\n` +
        `• *Person:* ${peerParsed.peerName}\n` +
        `• *Type:* ${peerParsed.type === 'lent' ? 'You Lent Money ↗' : 'You Borrowed Money ↘'}\n` +
        `• *Amount:* ${formatCurrency(peerParsed.amount)}\n` +
        `• *Description:* ${peerParsed.description}\n` +
        `• *Date Taken:* ${peerParsed.date}\n` +
        (peerParsed.dueDate ? `⏰ *Due Date:* ${peerParsed.dueDate}\n` : '') +
        `\nOutstanding balance updated in Peer Ledger!`;

    } else if (parsed.amount && parsed.amount > 0) {
      // Auto Add Expense
      addedExpense = ExpenseService.addExpense({
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description || 'WhatsApp Entry',
        merchant: parsed.merchant,
        paymentMethod: parsed.paymentMethod,
        date: parsed.date,
        notes: 'Added via WhatsApp Bot'
      });

      // Get updated category budget status
      const allExpenses = ExpenseService.getExpenses();
      const budgetStatuses = BudgetService.getBudgetStatuses(allExpenses);
      const catStatus = budgetStatuses.find(b => b.category === parsed.category);

      botResponseBody = `✅ *Recorded Expense!*\n\n` +
        `• *Amount:* ${formatCurrency(parsed.amount)}\n` +
        `• *Description:* ${parsed.description}\n` +
        `• *Category:* ${parsed.category}\n` +
        `• *Payment:* ${parsed.paymentMethod}\n\n` +
        (catStatus ? `📊 *${parsed.category} Budget:* ${formatCurrency(catStatus.spent)} / ${formatCurrency(catStatus.allocated)} (${catStatus.percentage}% used).` : '');

    } else {
      // Treat as financial query
      const allExpenses = ExpenseService.getExpenses();
      const budgets = BudgetService.getBudgets();
      const assistantRes = AIFinanceService.queryExpenseAssistant(userText, allExpenses, budgets);
      
      // Clean markdown formatting for WhatsApp bold syntax
      botResponseBody = assistantRes.text;
    }

    const botResponse: WhatsAppMessage = {
      id: `wa-reply-${Date.now()}`,
      sender: 'bot',
      body: botResponseBody,
      timestamp,
      expenseAdded: addedExpense
    };

    const history = this.getChatHistory();
    const updatedHistory = [...history, userMessage, botResponse];
    this.saveChatHistory(updatedHistory);

    return { userMessage, botResponse, addedExpense };
  }

  public static resetChat(): WhatsAppMessage[] {
    this.saveChatHistory(INITIAL_WHATSAPP_CHAT);
    return INITIAL_WHATSAPP_CHAT;
  }

  /**
   * Node.js / Express Webhook Deployment Server Script Template
   */
  public static getProductionBackendScript(): string {
    return `// SpendWise WhatsApp Bot - Twilio / Node.js Webhook Server
const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const axios = require('axios');

const app = express();
app.use(express.urlencoded({ extended: false }));

app.post('/webhook/whatsapp', async (req, res) => {
  const twiml = new MessagingResponse();
  const incomingMsg = req.body.Body || '';
  const fromNumber = req.body.From;

  console.log(\`Received WhatsApp from \${fromNumber}: "\${incomingMsg}"\`);

  try {
    // 1. Post to SpendWise AI NLP Service
    const response = await axios.post('https://your-spendwise-api.com/api/parse-expense', {
      text: incomingMsg,
      source: 'whatsapp',
      userPhone: fromNumber
    });

    const { amount, category, description, remainingBudget } = response.data;

    if (amount) {
      twiml.message(
        \`✅ *Recorded Expense!*\n\n\` +
        \`• *Amount:* ₹\${amount}\n\` +
        \`• *Description:* \${description}\n\` +
        \`• *Category:* \${category}\n\n\` +
        \`📊 *Remaining Monthly Budget:* ₹\${remainingBudget}\`
      );
    } else {
      twiml.message(response.data.replyText || "I'm your SpendWise Bot! Send e.g. 'Spent ₹250 on Swiggy'.");
    }

  } catch (error) {
    console.error('Webhook error:', error);
    twiml.message("⚠️ Sorry, could not log expense. Please try again.");
  }

  res.type('text/xml').send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`WhatsApp Webhook server running on port \${PORT}\`));`;
  }
}
