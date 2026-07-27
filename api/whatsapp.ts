import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

// Initialize Supabase Client for Serverless Backend
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize Google Gemini API
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const CATEGORIES = ['Food & Dining', 'Transportation', 'Shopping & Retail', 'Bills & Utilities', 'Entertainment', 'Health & Wellness', 'Travel', 'Education', 'Services', 'Others'];

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

function parseTextExpense(text: string) {
  const trimmed = text.trim();
  let amount: number | null = null;
  
  // 1. Search for numbers with explicit currency symbols (₹, Rs, INR) first
  const currencyRegex = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)/i;
  const currencyMatch = trimmed.match(currencyRegex);
  if (currencyMatch) {
    const rawNum = currencyMatch[1].replace(/,/g, '');
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
    }
  } else {
    // 2. Fallback to raw numbers with word boundaries
    const rawRegex = /\b([\d,]+(?:\.\d+)?)\b/;
    const rawMatch = trimmed.match(rawRegex);
    if (rawMatch) {
      const rawNum = rawMatch[1].replace(/,/g, '');
      const parsed = parseFloat(rawNum);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }
  }

  const category = autoCategorize(trimmed);
  let paymentMethod = 'UPI';
  const lower = trimmed.toLowerCase();
  if (lower.includes('credit card') || lower.includes('cc')) {
    paymentMethod = 'Credit Card';
  } else if (lower.includes('debit card') || lower.includes('dc')) {
    paymentMethod = 'Debit Card';
  } else if (lower.includes('cash')) {
    paymentMethod = 'Cash';
  }

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
  const whatsappToken = process.env.WHATSAPP_TOKEN;

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
    let fromNumber = '';
    let phoneId = '';
    
    try {
      const body = req.body;

      if (body.object === 'whatsapp_business_account' && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const messageVal = body.entry[0].changes[0].value;
        phoneId = messageVal.metadata.phone_number_id;
        const msg = messageVal.messages[0];
        fromNumber = msg.from; // User's WhatsApp Number
        
        let parsed = {
          amount: null as number | null,
          category: 'Others',
          description: '',
          merchant: '',
          paymentMethod: 'UPI',
          date: new Date().toISOString().split('T')[0]
        };
        let receiptUrl: string | undefined = undefined;
        let isImage = false;

        // Process image messages
        if (msg.type === 'image' && msg.image) {
          isImage = true;
          const mediaId = msg.image.id;

          try {
            if (!genAI) throw new Error('GEMINI_API_KEY environment variable is not set on Vercel.');
            if (!supabase) throw new Error('Supabase client is not initialized. Please verify SUPABASE_URL and SUPABASE_KEY.');

            console.log(`Downloading image media: ${mediaId}`);
            
            // Step A: Get WhatsApp Media download link
            const mediaRes = await axios.get(`https://graph.facebook.com/v25.0/${mediaId}`, {
              headers: { Authorization: `Bearer ${whatsappToken}` }
            });
            const mediaUrl = mediaRes.data.url;

            // Step B: Download the image binary buffer
            const imageRes = await axios.get(mediaUrl, {
              headers: { Authorization: `Bearer ${whatsappToken}` },
              responseType: 'arraybuffer'
            });
            const buffer = Buffer.from(imageRes.data);

            // Step C: Upload to Supabase Storage Bucket ('receipts')
            const storageFilename = `${Date.now()}_receipt.jpg`;
            const { error: uploadError } = await supabase.storage
              .from('receipts')
              .upload(storageFilename, buffer, {
                contentType: 'image/jpeg',
                upsert: true
              });

            if (uploadError) {
              console.warn('Supabase storage upload failed:', uploadError.message);
            } else {
              const { data: linkData } = supabase.storage
                .from('receipts')
                .getPublicUrl(storageFilename);
              receiptUrl = linkData.publicUrl;
            }

            // Step D: Send base64 to Gemini for OCR extraction using a robust model fallback loop
            const modelsToTry = [
              'gemini-3.5-flash',
              'gemini-3.6-flash',
              'gemini-3.5-flash-lite',
              'gemini-2.5-flash'
            ];

            const prompt = `You are a financial parsing agent. Scan this receipt or transaction screenshot. Identify and extract:
1. Total amount paid (number only)
2. Store name/merchant name (e.g. Swiggy, Zomato, D-Mart)
3. Category (Must choose ONLY one of: ${CATEGORIES.join(', ')})
4. Description (A short brief memo of the spend)
5. Payment Method (Choose one of: UPI, Credit Card, Debit Card, Cash, Net Banking)

Return ONLY a clean JSON object without markdown fences, matching exactly this format:
{
  "amount": 450,
  "merchant": "Swiggy",
  "category": "Food & Dining",
  "description": "Lunch order",
  "paymentMethod": "UPI"
}`;

            let geminiResult = null;
            let lastModelErr = null;

            for (const modelName of modelsToTry) {
              try {
                console.log(`Attempting Gemini OCR with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                geminiResult = await model.generateContent([
                  prompt,
                  {
                    inlineData: {
                      data: buffer.toString('base64'),
                      mimeType: 'image/jpeg'
                    }
                  }
                ]);
                console.log(`Successfully generated content using model: ${modelName}`);
                break;
              } catch (err: any) {
                console.warn(`Model ${modelName} failed: ${err.message}`);
                lastModelErr = err;
              }
            }

            if (!geminiResult) {
              throw new Error(`All Gemini models failed. Last error: ${lastModelErr?.message}`);
            }

            const responseText = geminiResult.response.text().trim();
            console.log(`Gemini raw extraction result: ${responseText}`);
            
            // Remove markdown code block surrounds if present
            const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
            const extracted = JSON.parse(cleanJson);
            parsed = {
              amount: parseFloat(extracted.amount) || null,
              category: CATEGORIES.includes(extracted.category) ? extracted.category : 'Others',
              description: extracted.description || 'Receipt Image Log',
              merchant: extracted.merchant || '',
              paymentMethod: extracted.paymentMethod || 'UPI',
              date: new Date().toISOString().split('T')[0]
            };

          } catch (ocrErr: any) {
            console.error('OCR Processing Error:', ocrErr);
            // Send the error message directly back to the user so they can diagnose it!
            if (whatsappToken && phoneId) {
              await axios.post(
                `https://graph.facebook.com/v25.0/${phoneId}/messages`,
                {
                  messaging_product: 'whatsapp',
                  recipient_type: 'individual',
                  to: fromNumber,
                  type: 'text',
                  text: { body: `⚠️ *Image Parse Error:* ${ocrErr.message}\n\nMake sure your Gemini API key is generated from Google AI Studio, and your Supabase 'receipts' storage bucket exists.` }
                },
                {
                  headers: {
                    Authorization: `Bearer ${whatsappToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
            }
            return res.status(200).json({ error: ocrErr.message });
          }
        } else {
          // Process standard text messages
          const msgText = msg.text?.body || '';
          parsed = parseTextExpense(msgText);
        }

        let replyBody = '';

        if (parsed.amount) {
          if (supabase) {
            const { error } = await supabase.from('expenses').insert([{
              amount: parsed.amount,
              category: parsed.category,
              description: parsed.description,
              merchant: parsed.merchant,
              paymentmethod: parsed.paymentMethod,
              date: parsed.date,
              notes: isImage ? `Receipt image parsed via Gemini AI` : `WhatsApp text entry`,
              source: 'whatsapp',
              receipt_url: receiptUrl || null
            }]);

            if (error) {
              console.error('Supabase write error:', error);
              replyBody = `⚠️ Error saving expense: ${error.message}`;
            } else {
              replyBody = `${isImage ? '📸 *Receipt Scanned Successfully!*' : '✅ *Recorded Expense!*'}\n\n` +
                `• *Amount:* ₹${parsed.amount}\n` +
                `• *Merchant:* ${parsed.merchant || 'N/A'}\n` +
                `• *Category:* ${parsed.category}\n` +
                `• *Payment:* ${parsed.paymentMethod}\n\n` +
                `Synced instantly with your SpendWise Dashboard!`;
            }
          } else {
            replyBody = `✅ *Parsed Expense Details!*\n\n• *Amount:* ₹${parsed.amount}\n• *Merchant:* ${parsed.merchant || 'N/A'}\n• *Category:* ${parsed.category}\n• *Payment:* ${parsed.paymentMethod}\n\n*Note:* Connect your Supabase database in Vercel settings to save this transaction permanently.`;
          }
        } else if (!isImage) {
          replyBody = `👋 *SpendWise Financial Agent*\n\nSend a text like:\n_"Spent ₹350 on Swiggy lunch"_\n\nOr **send a photo of any receipt/bill** to scan it automatically!`;
        }

        // Send Reply via Meta Cloud API for successful text parses or successful image parses
        if (replyBody && whatsappToken && phoneId) {
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
        }

        return res.status(200).json({ success: true, parsed, receiptUrl });
      }

      return res.status(200).json({ status: 'Ignored webhook payload' });

    } catch (err: any) {
      console.error('Webhook error handler:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
