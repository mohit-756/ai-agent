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

function parseTextPeerRecord(text: string) {
  const lower = text.toLowerCase();
  
  // Check if text has structured key-value template format (e.g. contains colons and split pipes or newlines)
  const isStructured = lower.includes(':') && (lower.includes('|') || lower.includes('\n'));
  if (isStructured) {
    const segments = text.split(/[|\n]+/);
    let parsedAmount = 0;
    let parsedType: 'lent' | 'borrowed' = 'lent';
    let parsedName = '';
    let parsedDesc = '';
    let parsedDate = '';
    let parsedDueDate = '';
    let isPeer = false;

    for (const seg of segments) {
      const parts = seg.split(':');
      if (parts.length < 2) continue;
      const key = parts[0].trim().toLowerCase();
      const val = parts.slice(1).join(':').trim();

      if (key.includes('lent') || key.includes('lend') || key.includes('given')) {
        parsedType = 'lent';
        parsedAmount = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
        isPeer = true;
      } else if (key.includes('borrowed') || key.includes('borrow') || key.includes('owe') || key.includes('taken')) {
        parsedType = 'borrowed';
        parsedAmount = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
        isPeer = true;
      } else if (key === 'amount') {
        parsedAmount = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
      } else if (key === 'name' || key === 'person' || key === 'who' || key === 'peer') {
        parsedName = val;
        isPeer = true;
      } else if (key === 'desc' || key === 'description' || key === 'for') {
        parsedDesc = val;
      } else if (key === 'date' || key === 'when') {
        parsedDate = val;
      } else if (key === 'due' || key === 'remind') {
        parsedDueDate = val;
      }
    }

    if (isPeer && parsedAmount > 0) {
      let recDate = new Date().toISOString().split('T')[0];
      if (parsedDate.toLowerCase().includes('yesterday')) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        recDate = yesterday.toISOString().split('T')[0];
      } else {
        const m = parsedDate.match(/\d{4}-\d{2}-\d{2}/);
        if (m) recDate = m[0];
      }

      let dueD: string | undefined = undefined;
      if (parsedDueDate.toLowerCase().includes('tomorrow') || parsedDueDate.toLowerCase().includes('tommorow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dueD = tomorrow.toISOString().split('T')[0];
      } else if (parsedDueDate.toLowerCase().includes('next week')) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        dueD = nextWeek.toISOString().split('T')[0];
      } else {
        const m = parsedDueDate.match(/\d{4}-\d{2}-\d{2}/);
        if (m) dueD = m[0];
      }

      return {
        isPeerRecord: true,
        type: parsedType,
        peerName: parsedName || 'Friend',
        amount: parsedAmount,
        description: parsedDesc || `${parsedType === 'lent' ? 'Lent' : 'Borrowed'} split`,
        date: recDate,
        dueDate: dueD
      };
    }
  }

  // Check if message matches peer transaction or reminder patterns
  const isLent = /\blent\b|\blend\b|\bgave\b.*\bto\b|\bgiven\b.*\bto\b|\bsplit\b.*\bwith\b|\bowes\b.*\bme\b/.test(lower);
  const isBorrowed = /\bborrowed\b|\bborrow\b|\btook\b.*\bfrom\b|\breceived\b.*\bfrom\b|\bi\b.*\bowe\b/.test(lower);
  const isReminder = /\bremind\b.*\b(take|pay|get|give|return|collect|ask)\b/.test(lower);
  
  const isPeerRecord = isLent || isBorrowed || isReminder;
  
  if (!isPeerRecord) {
    return { isPeerRecord: false };
  }
  
  // Extract amount
  let amount: number | null = null;
  const amountRegex = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:rs|rupees|inr|₹)?/i;
  const amountMatch = text.match(amountRegex);
  if (amountMatch) {
    const rawNum = (amountMatch[1] || amountMatch[2]).replace(/,/g, '');
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
    }
  }
  
  if (!amount) {
    return { isPeerRecord: false };
  }
  
  // Determine type: lent or borrowed
  let type: 'lent' | 'borrowed' = 'lent';
  if (isBorrowed) {
    type = 'borrowed';
  } else if (isReminder && (lower.includes('pay') || lower.includes('give') || lower.includes('return to'))) {
    type = 'borrowed';
  } else if (isReminder && (lower.includes('take') || lower.includes('get') || lower.includes('collect') || lower.includes('ask'))) {
    type = 'lent';
  }
  
  // Try to extract peer name and description
  let peerName = 'Friend';
  let description = 'Peer Split';
  
  // Patterns for matching names
  const toRegex = /(?:lent|gave|given|split\s+with|to)\s+(?:money\s+to\s+|to\s+)?([a-zA-Z]+)(?:\s+|$|\d)/i;
  const fromRegex = /(?:borrowed|took|received|from)\s+(?:money\s+from\s+|from\s+)?([a-zA-Z]+)(?:\s+|$|\d)/i;
  
  let nameMatch = null;
  if (type === 'lent') {
    nameMatch = text.match(toRegex);
  } else {
    nameMatch = text.match(fromRegex);
  }
  
  if (nameMatch && nameMatch[1]) {
    const candidate = nameMatch[1].trim();
    const lowerCandidate = candidate.toLowerCase();
    const stopWords = ['money', 'cash', 'yesterday', 'today', 'tomorrow', 'tommorow', 'due', 'remind', 'him', 'her', 'them', 'me', 'to', 'for', 'from'];
    if (candidate.length > 0 && !/\d/.test(candidate) && !stopWords.includes(lowerCandidate)) {
      peerName = candidate;
    }
  }
  
  // If still Friend, search uppercase word or keyword bounds
  if (peerName === 'Friend') {
    const words = text.split(/\s+/);
    const nameKeywords = ['to', 'from', 'with'];
    for (let i = 0; i < words.length - 1; i++) {
      if (nameKeywords.includes(words[i].toLowerCase())) {
        const nextWord = words[i+1].replace(/[^a-zA-Z]/g, '');
        if (nextWord && nextWord[0] === nextWord[0].toUpperCase()) {
          peerName = nextWord;
          break;
        }
      }
    }
  }
  
  // Capitalize peerName first letter
  if (peerName && peerName !== 'Friend') {
    peerName = peerName.charAt(0).toUpperCase() + peerName.slice(1);
  }
  
  // Parse Record Date (Yesterday, YYYY-MM-DD)
  let recordDate = new Date().toISOString().split('T')[0];
  if (lower.includes('yesterday')) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    recordDate = yesterday.toISOString().split('T')[0];
  } else {
    const dateMatch = lower.match(/\bon\s+(\d{4}-\d{2}-\d{2})\b/);
    if (dateMatch) {
      recordDate = dateMatch[1];
    }
  }

  // Parse Due Date / Reminder (due tomorrow, due next week, due YYYY-MM-DD, remind tomorrow/tommorow)
  let dueDateStr: string | undefined = undefined;
  if (lower.includes('tomorrow') || lower.includes('tommorow') || lower.includes('remind tomorrow') || lower.includes('remind tommorow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDateStr = tomorrow.toISOString().split('T')[0];
  } else if (lower.includes('next week')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    dueDateStr = nextWeek.toISOString().split('T')[0];
  } else {
    const dueMatch = lower.match(/\bdue\s+(\d{4}-\d{2}-\d{2})\b/);
    if (dueMatch) {
      dueDateStr = dueMatch[1];
    }
  }

  // Parse description: anything after "for" (exclude date/due clauses)
  const forRegex = /\bfor\s+([a-zA-Z0-9\s]+?)(?:\s+on|\s+due|$)/i;
  const forMatch = text.match(forRegex);
  if (forMatch && forMatch[1]) {
    description = forMatch[1].trim();
  } else {
    // Clean up all helper tags
    description = text.replace(amountRegex, '')
      .replace(/\b(?:lent|borrowed|to|from|for|split|with|on|due|yesterday|tomorrow|tommorow|remind|me|take|give|money|cash|him|her|them)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Remove name if included
    if (peerName && peerName !== 'Friend') {
      const nameEscaped = peerName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      description = description.replace(new RegExp('\\b' + nameEscaped + '\\b', 'gi'), '');
    }
    
    description = description.replace(/\s+/g, ' ').trim();
    
    if (description.length > 25) {
      description = description.slice(0, 25) + '...';
    }
  }
  
  if (peerName.toLowerCase().includes(' for ')) {
    peerName = peerName.split(/ for /i)[0].trim();
  }
  
  return {
    isPeerRecord: true,
    type,
    peerName,
    amount,
    description: description || (type === 'lent' ? `Lent to ${peerName}` : `Borrowed from ${peerName}`),
    date: recordDate,
    dueDate: dueDateStr
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
        let isPeerRecord = false;
        let peerRecordData = {
          peerName: '',
          type: 'lent' as 'lent' | 'borrowed',
          amount: 0,
          description: '',
          date: '',
          dueDate: undefined as string | undefined
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
          const peerParsed = parseTextPeerRecord(msgText);
          if (peerParsed.isPeerRecord && peerParsed.amount) {
            isPeerRecord = true;
            peerRecordData = {
              peerName: peerParsed.peerName || 'Friend',
              type: peerParsed.type || 'lent',
              amount: peerParsed.amount,
              description: peerParsed.description || 'Peer Split',
              date: peerParsed.date || new Date().toISOString().split('T')[0],
              dueDate: peerParsed.dueDate
            };
          } else {
            parsed = parseTextExpense(msgText);
          }
        }

        let replyBody = '';

        if (isPeerRecord && peerRecordData.amount) {
          if (supabase) {
            const { error } = await supabase.from('peer_records').insert([{
              name: peerRecordData.peerName,
              amount: peerRecordData.amount,
              original_amount: peerRecordData.amount,
              type: peerRecordData.type,
              description: peerRecordData.description,
              date: peerRecordData.date,
              due_date: peerRecordData.dueDate || null,
              status: 'pending'
            }]);

            if (error) {
              console.warn('peer_records write error, fallback to expenses table:', error.message);
              // Fallback to inserting as a standard expense labeled as 'Others'
              const { error: expError } = await supabase.from('expenses').insert([{
                amount: peerRecordData.amount,
                category: 'Others',
                description: `${peerRecordData.type === 'lent' ? 'Lent to' : 'Borrowed from'} ${peerRecordData.peerName}: ${peerRecordData.description}`,
                date: peerRecordData.date,
                source: 'whatsapp',
                notes: `Logged as expense fallback (peer_records table write failed)`
              }]);

              if (expError) {
                replyBody = `⚠️ Error saving peer record: ${expError.message}`;
              } else {
                replyBody = `👥 *Logged to Expenses (Fallback)*\n\n` +
                  `• *Detail:* ${peerRecordData.type === 'lent' ? 'Lent to' : 'Borrowed from'} ${peerRecordData.peerName}\n` +
                  `• *Amount:* ₹${peerRecordData.amount}\n` +
                  `• *Desc:* ${peerRecordData.description}\n\n` +
                  `*Note:* To save this specifically as a Peer Ledger entry, please create a \`peer_records\` table in your Supabase database.`;
              }
            } else {
              replyBody = `👥 *Peer Ledger Record Added!*\n\n` +
                `• *Person:* ${peerRecordData.peerName}\n` +
                `• *Type:* ${peerRecordData.type === 'lent' ? 'You Lent Money ↗' : 'You Borrowed Money ↘'}\n` +
                `• *Amount:* ₹${peerRecordData.amount}\n` +
                `• *Description:* ${peerRecordData.description}\n` +
                `• *Date Taken:* ${peerRecordData.date}\n` +
                (peerRecordData.dueDate ? `⏰ *Due Date:* ${peerRecordData.dueDate}\n` : '') +
                `\nSynced with your SpendWise database!`;
            }
          } else {
            replyBody = `👥 *Parsed Peer Record!*\n\n• *Person:* ${peerRecordData.peerName}\n• *Type:* ${peerRecordData.type === 'lent' ? 'Lent' : 'Borrowed'}\n• *Amount:* ₹${peerRecordData.amount}\n• *Desc:* ${peerRecordData.description}\n\n*Note:* Connect your Supabase database in Vercel settings to save permanently.`;
          }
        } else if (parsed.amount) {
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
          replyBody = `👋 *SpendWise Financial Agent*\n\nSend a text like:\n_"Spent ₹350 on Swiggy lunch"_\n\nOr track loans:\n_"Lent ₹500 to Rohit for dinner split"_\n\nOr **send a photo of any receipt/bill** to scan it automatically!`;
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
