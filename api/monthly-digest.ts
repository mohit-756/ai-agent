import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const whatsappToken = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const targetPhone = process.env.DEFAULT_USER_PHONE || process.env.ADMIN_PHONE;

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized' });
  }

  try {
    const now = new Date();
    // First day of previous month
    const prevMonthFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthLast = new Date(now.getFullYear(), now.getMonth(), 0);

    const startStr = prevMonthFirst.toISOString().split('T')[0];
    const endStr = prevMonthLast.toISOString().split('T')[0];

    const monthName = prevMonthFirst.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Fetch expenses for previous month
    const { data: monthExpenses, error: expError } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startStr)
      .lte('date', endStr);

    if (expError) throw expError;

    // Fetch active peer records
    const { data: peerRecords, error: peerError } = await supabase
      .from('peer_records')
      .select('*')
      .eq('status', 'pending');

    if (peerError) throw peerError;

    const totalSpent = monthExpenses ? monthExpenses.reduce((acc, e) => acc + Number(e.amount), 0) : 0;
    const totalCount = monthExpenses ? monthExpenses.length : 0;

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    if (monthExpenses) {
      monthExpenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
      });
    }

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    const lentTotal = peerRecords ? peerRecords.filter(p => p.type === 'lent').reduce((acc, p) => acc + Number(p.amount), 0) : 0;
    const borrowedTotal = peerRecords ? peerRecords.filter(p => p.type === 'borrowed').reduce((acc, p) => acc + Number(p.amount), 0) : 0;

    const digestText = `📈 *SpendWise Monthly Financial Digest* (${monthName})\n\n` +
      `💰 *Total Monthly Spending:* ₹${totalSpent.toLocaleString('en-IN')}\n` +
      `📊 *Total Transactions:* ${totalCount}\n` +
      `🏆 *Top Category:* ${topCategory[0]} (₹${topCategory[1].toLocaleString('en-IN')})\n\n` +
      `👥 *Peer Ledger Balance:* \n` +
      `• Owed to You: ₹${lentTotal.toLocaleString('en-IN')}\n` +
      `• You Owe: ₹${borrowedTotal.toLocaleString('en-IN')}\n\n` +
      `Great job tracking your finances! Open SpendWise to view detailed analytics or export your monthly statement.`;

    if (whatsappToken && phoneId && targetPhone) {
      await axios.post(
        `https://graph.facebook.com/v25.0/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: targetPhone,
          type: 'text',
          text: { body: digestText }
        },
        {
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return res.status(200).json({ success: true, month: monthName, totalSpent, digestText });
  } catch (err: any) {
    console.error('Error executing monthly-digest cron:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
