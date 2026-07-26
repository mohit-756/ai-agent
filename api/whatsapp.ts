import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase Client for Serverless Backend
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Category Keywords for parsing
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Food & Dining': ['swiggy', 'zomato', 'blinkit', 'instamart', 'zepto', 'dominos', 'pizza', 'mcdonalds', 'starbucks', 'kfc', 'subway', 'lunch', 'dinner', 'breakfast', 'cafe', 'restaurant', 'tea', 'chai', 'coffee', 'supermarket', 'grocery', 'groceries', 'bakery', 'food'],
  'Transportation': ['uber', 'ola', 'rapido', 'metro', 'auto', 'cab', 'taxi', 'fuel', 'petrol', 'diesel', 'fastag', 'toll', 'parking', 'bus', 'train', 'irctc'],
  'Shopping & Retail': ['amazon', 'flipkart', 'myntra', 'ajio', 'tata cliq', 'nykaa', 'zara', 'h&m', 'decathlon', 'd-mart', 'dmart', 'croma', 'reliance digital', 'clothes', 'shoes', 'shopping', 'electronics'],
  'Bills & Utilities': ['electricity', 'bescom', 'tata sky', 'airtel', 'jio', 'vi', 'vodafone', 'broadband', 'wifi', 'water bill', 'gas', 'indane', 'hp gas', 'rent', 'maintenance', 'recharge'],
  'Entertainment': ['netflix', 'hotstar', 'prime video', 'spotify', 'youtube', 'bookmyshow', 'cinema', 'movie', 'gaming', 'steam', 'playstation', 'concert', 'event'],
  'Health & Wellness': ['apollo', '1mg', 'pharmeasy', 'pharmacy', 'hospital', 'doctor', 'clinic', 'cult.fit', 'gym', 'fitness', 'medicines', 'lab test'],
  'Travel': ['makemytrip', 'goibibo', 'cleartrip', 'airbnb', 'hotel', 'flight', 'resort', 'indigo', 'air india', 'stay', 'vacation'],
  'Education': ['udemy', 'coursera', 'books', 'stationery', 'school', 'college', 'tuition', 'course', 'exam fee'],
  'Services': ['urban company', 'dry clean', 'laundry', 'salon', 'barber', 'spa', 'plumber', 'electrician']
};

function autoCategorize(text: string): string {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      return category;
    }
  }
  return 'Others';
}

function parseNaturalLanguage(text: string) {
  const trimmed = text.trim();
  let amount: number | null = null;
  
  // Extract amount
  const amountRegex = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:rs|rupees|inr|₹)?/i;
  const amountMatch = trimmed.match(amountRegex);
  if (amountMatch) {
    const rawNum = (amountMatch[1] || amountMatch[2]).replace(/,/g, '');
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
    }
  }

  // Extract category
  const category = autoCategorize(trimmed);

  // Extract payment method
  let paymentMethod = 'UPI';
  const lower = trimmed.toLowerCase();
  if (lower.includes('credit card') || lower.includes('cc')) {
    paymentMethod = 'Credit Card';
  } else if (lower.includes('debit card') || lower.includes('dc')) {
    paymentMethod = 'Debit Card';
  } else if (lower.includes('cash')) {
    paymentMethod = 'Cash';
  }

  // Extract Merchant
  let merchant = '';
  const merchants = ['Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'Instamart', 'Uber', 'Ola', 'Rapido', 'Amazon', 'Flipkart', 'Myntra', 'Netflix', 'Spotify', 'Apollo', 'D-Mart', 'BESCOM', 'Airtel'];
  for (const m of merchants) {
    if (lower.includes(m.toLowerCase())) {
      merchant = m;
      break;
    }
  }

  let description = trimmed.replace(/^(spent|paid|bought|add|expense|for|on)\s+/i, '');
  if (merchant && !description.toLowerCase().includes(merchant.toLowerCase())) {
    description = `${merchant} - ${description}`;
  }

  return {
    amount,
    category,
    description: description || 'WhatsApp Expense',
    merchant,
    paymentMethod,
    date: new Date().toISOString().split('T')[0]
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. GET Request: Webhook Verification for Meta
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.VERIFY_TOKEN || 'my_secret_token_123';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified successfully!');
      return res.status(200).send(challenge);
    } else {
      console.error('Webhook verification failed.');
      return res.status(403).json({ error: 'Verification token mismatch' });
    }
  }

  // 2. POST Request: Handle Incoming Message from WhatsApp
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Ensure this is a WhatsApp message webhook
      if (body.object === 'whatsapp_business_account' && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const messageVal = body.entry[0].changes[0].value;
        const phoneId = messageVal.metadata.phone_number_id;
        const msg = messageVal.messages[0];
        const fromNumber = msg.from; // User's WhatsApp Number
        const msgText = msg.text?.body || '';

        console.log(`Incoming message from ${fromNumber}: "${msgText}"`);

        // Parse Message
        const parsed = parseNaturalLanguage(msgText);
        let replyBody = '';

        if (parsed.amount) {
          // If Supabase is connected, write the expense
          if (supabase) {
            const { error } = await supabase.from('expenses').insert([{
              amount: parsed.amount,
              category: parsed.category,
              description: parsed.description,
              merchant: parsed.merchant,
              payment_method: parsed.paymentMethod, // Fix case mapping to match standard snake_case column
              date: parsed.date,
              notes: `WhatsApp message from ${fromNumber}`,
              source: 'whatsapp'
            }]);

            if (error) {
              console.error('Supabase write error:', error);
              replyBody = `⚠️ Error saving expense: ${error.message}`;
            } else {
              replyBody = `✅ *Recorded Expense!*\n\n• *Amount:* ₹${parsed.amount}\n• *Description:* ${parsed.description}\n• *Category:* ${parsed.category}\n• *Payment:* ${parsed.paymentMethod}\n\nSynced instantly with your SpendWise App!`;
            }
          } else {
            // No Database Configured yet
            replyBody = `✅ *Parsed Expense Details!*\n\n• *Amount:* ₹${parsed.amount}\n• *Description:* ${parsed.description}\n• *Category:* ${parsed.category}\n• *Payment:* ${parsed.paymentMethod}\n\n*Note:* Connect your Supabase database in Vercel settings to save this transaction permanently.`;
          }
        } else {
          replyBody = `👋 *SpendWise Financial Agent*\n\nSend a message like:\n_"Spent ₹350 on Swiggy lunch"_ or _"Uber ride ₹180 via UPI"_ to log an expense.`;
        }

        // Send Reply via Meta Cloud API
        const whatsappToken = process.env.WHATSAPP_TOKEN;
        if (whatsappToken && phoneId) {
          await axios.post(
            `https://graph.facebook.com/v25.0/${phoneId}/messages`,
            {
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: fromNumber,
              type: 'text',
              text: { body: replyBody }
            },
            {
              headers: {
                Authorization: `Bearer ${whatsappToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } else {
          console.warn('Meta WhatsApp Token missing. Message reply skipped.');
        }

        return res.status(200).json({ success: true, parsed });
      }

      return res.status(200).json({ status: 'Ignored webhook payload' });

    } catch (err: any) {
      console.error('Webhook error handler:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
