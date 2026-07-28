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
    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch peer records that are pending and have due_date <= today
    const { data: dueRecords, error } = await supabase
      .from('peer_records')
      .select('*')
      .eq('status', 'pending')
      .lte('due_date', todayStr)
      .order('due_date', { ascending: true });

    if (error) throw error;

    if (!dueRecords || dueRecords.length === 0) {
      return res.status(200).json({ success: true, message: 'No overdue or due peer records found today.' });
    }

    // Build friendly notification text
    const lines = dueRecords.map(r => {
      const isOverdue = r.due_date < todayStr;
      const badge = isOverdue ? '🔴 OVERDUE' : '🟡 DUE TODAY';
      return `• *${r.name}*: ₹${r.amount} (${r.type === 'lent' ? 'Owes You' : 'You Owe'}) - ${r.description || 'Split'} [${badge}]`;
    });

    const bodyText = `⏰ *SpendWise Daily Debt & Due Reminder*\n\nYou have ${dueRecords.length} pending peer record(s) due or overdue today:\n\n${lines.join('\n')}\n\nCheck your SpendWise dashboard to send 1-click WhatsApp reminders or log paybacks!`;

    if (whatsappToken && phoneId && targetPhone) {
      await axios.post(
        `https://graph.facebook.com/v25.0/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: targetPhone,
          type: 'text',
          text: { body: bodyText }
        },
        {
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return res.status(200).json({ success: true, count: dueRecords.length, bodyText });
  } catch (err: any) {
    console.error('Error executing due-reminders cron:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
