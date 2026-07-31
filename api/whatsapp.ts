import type { VercelRequest, VercelResponse } from '@vercel/node';
export const maxDuration = 60;
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase Client for Serverless Backend
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize OmniRoute & Gemini Settings
const omnirouteUrl = process.env.OMNIROUTE_URL || 'http://localhost:20128/v1';
const omnirouteKey = process.env.OMNIROUTE_KEY || 'omniroute';
const geminiApiKey = process.env.GEMINI_API_KEY || '';

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

export function parseTextExpense(text: string) {
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

function parseFlexibleDate(str: string): string {
  const clean = str.trim().replace(/[^0-9-/]/g, '');
  
  // 1. Matches YYYY-MM-DD
  const ymd = clean.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (ymd) {
    return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  }
  
  // 2. Matches DD-MM-YYYY or DD/MM/YYYY
  const dmy = clean.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  }

  // 3. Matches DD-MM-YY or DD/MM/YY
  const dmyShort = clean.match(/^(\d{2})[-/](\d{2})[-/](\d{2})$/);
  if (dmyShort) {
    const year = parseInt(dmyShort[3]) < 50 ? `20${dmyShort[3]}` : `19${dmyShort[3]}`;
    return `${year}-${dmyShort[2]}-${dmyShort[1]}`;
  }

  return clean;
}

export function parseTextPeerRecord(text: string) {
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
      } else if (parsedDate.trim()) {
        recDate = parseFlexibleDate(parsedDate);
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
      } else if (parsedDueDate.trim()) {
        dueD = parseFlexibleDate(parsedDueDate);
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
  
  // Parse Record Date (Yesterday, flexible formats)
  let recordDate = new Date().toISOString().split('T')[0];
  if (lower.includes('yesterday')) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    recordDate = yesterday.toISOString().split('T')[0];
  } else {
    const dateMatch = lower.match(/\bon\s+([\d]{2,4}[-/][\d]{2}[-/][\d]{2,4})\b/);
    if (dateMatch) {
      recordDate = parseFlexibleDate(dateMatch[1]);
    }
  }

  // Parse Due Date / Reminder (due tomorrow, due next week, due flexible formats, remind tomorrow/tommorow)
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
    const dueMatch = lower.match(/\bdue\s+([\d]{2,4}[-/][\d]{2}[-/][\d]{2,4})\b/);
    if (dueMatch) {
      dueDateStr = parseFlexibleDate(dueMatch[1]);
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
      const nameEscaped = peerName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
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

export function parseTextPayback(text: string) {
  const lower = text.toLowerCase();
  const isPaybackPattern = /\b(paid|payback|settled|returned|repaid)\b/i.test(lower);
  if (!isPaybackPattern) {
    return { isPayback: false, peerName: '', amount: null };
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

  // Extract peer name candidate
  let peerName = '';
  const words = text.split(/\s+/);
  const stopWords = ['paid', 'back', 'settled', 'returned', 'repaid', 'from', 'by', 'to', 'for', 'rs', 'inr', 'rupees', 'money', 'full', 'half', 'payback'];
  for (const w of words) {
    const cleaned = w.replace(/[^a-zA-Z]/g, '');
    if (cleaned.length > 1 && !stopWords.includes(cleaned.toLowerCase()) && !/^\d+$/.test(cleaned)) {
      peerName = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
      break;
    }
  }

  return {
    isPayback: true,
    peerName,
    amount
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
        
        let replyBody = '';
        let receiptUrl: string | undefined = undefined;

        // Process audio messages & voice notes
        const audioObj = msg.audio || msg.voice;
        if ((msg.type === 'audio' || msg.type === 'voice') && audioObj) {
          const mediaId = audioObj.id;
          try {
            console.log(`Processing voice note audio: ${mediaId}`);
            // Get Meta download URL
            const mediaRes = await axios.get(`https://graph.facebook.com/v25.0/${mediaId}`, {
              headers: { Authorization: `Bearer ${whatsappToken}` }
            });
            
            // Download audio buffer
            const audioRes = await axios.get(mediaRes.data.url, {
              headers: { Authorization: `Bearer ${whatsappToken}` },
              responseType: 'arraybuffer'
            });
            const audioBuffer = Buffer.from(audioRes.data);

            let transcriptionText = '';
            const audioBase64 = audioBuffer.toString('base64');

            if (geminiApiKey) {
              console.log('Using direct free Gemini API for instant 0.5s voice note transcription...');
              const gRes = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
                {
                  contents: [
                    {
                      parts: [
                        { text: 'Transcribe the spoken audio in this voice note accurately into plain text. Return ONLY the raw transcript.' },
                        {
                          inlineData: {
                            mimeType: 'audio/ogg',
                            data: audioBase64
                          }
                        }
                      ]
                    }
                  ]
                },
                { timeout: 15000 }
              );
              transcriptionText = gRes.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            } else {
              console.log('Using OmniRoute for voice note transcription...');
              const geminiRes = await axios.post(`${omnirouteUrl}/chat/completions`, {
                model: 'auto',
                messages: [
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: 'Transcribe the spoken words in this audio voice note into plain text accurately. Return ONLY the raw transcript.'
                      },
                      {
                        type: 'image_url',
                        url: `data:audio/ogg;base64,${audioBase64}`
                      }
                    ]
                  }
                ]
              }, {
                headers: { Authorization: `Bearer ${omnirouteKey}` },
                timeout: 25000
              });

              transcriptionText = geminiRes.data?.choices?.[0]?.message?.content?.trim() || '';
            }
            console.log(`Voice note transcribed: "${transcriptionText}"`);
            
            // Rewrite message as text so it flows into the text processing engine!
            msg.type = 'text';
            msg.text = { body: transcriptionText };
          } catch (audioErr: any) {
            console.error('Audio Transcription Error:', audioErr);
            replyBody = `⚠️ *Voice Transcription failed:* ${audioErr.response?.data?.error?.message || audioErr.message}`;
          }
        }

        // Process image messages (Receipt OCR)
        if (msg.type === 'image' && msg.image) {
          const mediaId = msg.image.id;
          try {
            if (!supabase) throw new Error('Supabase client is not initialized. Please verify SUPABASE_URL and SUPABASE_KEY.');

            console.log(`Downloading receipt image: ${mediaId}`);
            
            // Get Meta download URL
            const mediaRes = await axios.get(`https://graph.facebook.com/v25.0/${mediaId}`, {
              headers: { Authorization: `Bearer ${whatsappToken}` }
            });

            // Download image binary
            const imageRes = await axios.get(mediaRes.data.url, {
              headers: { Authorization: `Bearer ${whatsappToken}` },
              responseType: 'arraybuffer'
            });
            const buffer = Buffer.from(imageRes.data);

            // Upload to Supabase Storage receipts bucket
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

            // Call OmniRoute with Multimodal image parse request
            const prompt = `You are a financial parsing agent. Scan this receipt or transaction screenshot. Identify and extract:
1. Total amount paid (number only)
2. Store name/merchant name (e.g. Swiggy, Zomato, D-Mart)
3. Category (Must choose ONLY one of: ${CATEGORIES.join(', ')})
4. Description (A short brief memo of the spend)
5. Payment Method (Choose one of: UPI, Credit Card, Debit Card, Cash, Net Banking)

Return ONLY a clean JSON object without markdown fences:
{
  "amount": 450,
  "merchant": "Swiggy",
  "category": "Food & Dining",
  "description": "Lunch order",
  "paymentMethod": "UPI"
}`;

            const ocrResponse = await axios.post(
              `${omnirouteUrl}/chat/completions`,
              {
                model: 'auto/best-vision',
                messages: [
                  {
                    role: 'user',
                    content: [
                      { type: 'text', text: prompt },
                      {
                        type: 'image_url',
                        image_url: { url: `data:image/jpeg;base64,${buffer.toString('base64')}` }
                      }
                    ]
                  }
                ],
                response_format: { type: 'json_object' }
              },
              {
                headers: {
                  Authorization: `Bearer ${omnirouteKey}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            const responseText = ocrResponse.data.choices[0].message.content.trim();
            console.log(`OmniRoute OCR output: ${responseText}`);
            const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
            const extracted = JSON.parse(cleanJson);

            const parsed = {
              amount: parseFloat(extracted.amount) || null,
              category: CATEGORIES.includes(extracted.category) ? extracted.category : 'Others',
              description: extracted.description || 'Receipt Image Log',
              merchant: extracted.merchant || '',
              paymentMethod: extracted.paymentMethod || 'UPI',
              date: new Date().toISOString().split('T')[0]
            };

            if (parsed.amount) {
              const { error: dbError } = await supabase.from('expenses').insert([{
                amount: parsed.amount,
                category: parsed.category,
                description: parsed.description,
                merchant: parsed.merchant,
                paymentmethod: parsed.paymentMethod,
                date: parsed.date,
                notes: 'Receipt image scanned via OmniRoute OCR',
                source: 'whatsapp',
                receipt_url: receiptUrl || null
              }]);

              if (dbError) {
                replyBody = `⚠️ Error saving expense: ${dbError.message}`;
              } else {
                replyBody = `📸 *Receipt Scanned Successfully (via OmniRoute)!*\n\n` +
                  `• *Amount:* ₹${parsed.amount}\n` +
                  `• *Merchant:* ${parsed.merchant || 'N/A'}\n` +
                  `• *Category:* ${parsed.category}\n` +
                  `• *Payment:* ${parsed.paymentMethod}\n\n` +
                  `Synced with SpendWise Dashboard!`;

                // Budget Alert Check
                try {
                  const DEFAULT_BUDGETS: Record<string, number> = {
                    'Food & Dining': 5000, 'Transportation': 3000, 'Shopping & Retail': 5000,
                    'Bills & Utilities': 5000, 'Entertainment': 2000, 'Health & Wellness': 3000,
                    'Travel': 10000, 'Education': 5000, 'Services': 3000, 'Others': 3000
                  };
                  const firstDayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
                  const { data: monthExps } = await supabase
                    .from('expenses')
                    .select('amount')
                    .eq('category', parsed.category)
                    .gte('date', firstDayStr);

                  const catSum = monthExps ? monthExps.reduce((acc, e) => acc + Number(e.amount), 0) : parsed.amount;
                  const cap = DEFAULT_BUDGETS[parsed.category] || 5000;
                  const pct = Math.round((catSum / cap) * 100);

                  if (pct >= 80) {
                    replyBody += `\n\n⚠️ *Budget Alert:* You've spent ₹${catSum.toLocaleString('en-IN')} of your ₹${cap.toLocaleString('en-IN')} ${parsed.category} limit this month (${pct}%)!`;
                  }
                } catch (bErr) {
                  console.warn('Budget warning check failed:', bErr);
                }
              }
            } else {
              replyBody = `⚠️ Could not extract valid amount from this receipt scan.`;
            }

          } catch (ocrErr: any) {
            console.error('OCR Error:', ocrErr);
            replyBody = `⚠️ *OCR Parsing failed:* ${ocrErr.message}`;
          }
        }

        // Process text messages (transcribed or direct)
        else if (msg.text?.body) {
          const msgText = msg.text.body.trim();
          const urlRegex = /(https?:\/\/[^\s]+)/gi;
          const urlMatch = msgText.match(urlRegex);

          // Scenario A: Link Scraping & Memory Archive
          if (urlMatch) {
            const url = urlMatch[0];
            try {
              if (!supabase) throw new Error('Supabase client is not initialized.');
              console.log(`Scraping URL: ${url}`);
              
              // Fetch page content
              const htmlRes = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
              const content = htmlRes.data.toString()
                .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
                .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 6000); // safety length limit

              // Generate summary using OmniRoute
              const summaryResponse = await axios.post(
                `${omnirouteUrl}/chat/completions`,
                {
                  model: 'auto',
                  messages: [
                    { role: 'user', content: `Summarize the core takeaways of this page content in 3-4 bullet points:\n\n${content}` }
                  ]
                },
                { headers: { Authorization: `Bearer ${omnirouteKey}` } }
              );
              const summary = summaryResponse.data.choices[0].message.content;

              // Generate vector embedding
              const embResponse = await axios.post(
                `${omnirouteUrl}/embeddings`,
                {
                  model: 'text-embedding-3-small',
                  input: summary
                },
                { headers: { Authorization: `Bearer ${omnirouteKey}` } }
              );
              const embedding = embResponse.data.data[0].embedding;

              // Save to memories table
              const { error: memErr } = await supabase.from('memories').insert([{
                content: `Link Summary for: ${url}\n\n${summary}`,
                embedding,
                metadata: { source: 'whatsapp_link', url }
              }]);

              if (memErr) throw memErr;

              replyBody = `🔗 *Link Summarized & Saved to Second Brain!*\n\n${summary}`;
            } catch (linkErr: any) {
              console.error('Link scraping error:', linkErr);
              replyBody = `⚠️ *Link archiving failed:* ${linkErr.message}`;
            }
          }

          // Scenario B: LLM-based Intent Detection & Conversation Parser
          else {
            try {
              if (!supabase) throw new Error('Supabase client is not initialized.');

              const systemPrompt = `You are the parsing brain of SpendWise, an AI personal finance and memory system.
Analyze the user's message and determine the correct intent. Respond ONLY with a clean JSON object. Do not include markdown fences.

Intents:
- "log_expense": spending money (e.g., "spent 350 on lunch", "zomato 250 paid upi")
- "log_peer": lending or borrowing money (e.g., "lent 500 to Sneha for split", "borrowed 1000 from Rohit")
- "log_payback": settling debts (e.g., "Sneha paid back 500", "repaid 1000 to Rohit")
- "query_database": questioning past transactions or semantic memory (e.g., "who owes me money?", "what was that link I sent yesterday?", "how much did I spend on cabs?")
- "general_chat": general chatting or greetings

Return Format:
{
  "intent": "log_expense" | "log_peer" | "log_payback" | "query_database" | "general_chat",
  "data": {
    // For log_expense:
    "amount": number | null,
    "merchant": string,
    "category": "Food & Dining" | "Transportation" | "Shopping & Retail" | "Bills & Utilities" | "Entertainment" | "Health & Wellness" | "Travel" | "Education" | "Services" | "Others",
    "description": string,
    "paymentMethod": "UPI" | "Credit Card" | "Debit Card" | "Cash" | "Net Banking"

    // For log_peer:
    "peerName": string,
    "amount": number | null,
    "type": "lent" | "borrowed",
    "description": string,
    "dueDate": "YYYY-MM-DD" | null

    // For log_payback:
    "peerName": string,
    "amount": number | null
  }
}`;

              const intentResponse = await axios.post(
                `${omnirouteUrl}/chat/completions`,
                {
                  model: 'auto',
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: msgText }
                  ],
                  response_format: { type: 'json_object' }
                },
                { headers: { Authorization: `Bearer ${omnirouteKey}` } }
              );

              const responseText = intentResponse.data.choices[0].message.content.trim();
              const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
              const parsedIntent = JSON.parse(cleanJson);
              const intent = parsedIntent.intent;
              const data = parsedIntent.data || {};

              console.log(`Detected Intent: ${intent}`, data);

              // 1. Log Expense
              if (intent === 'log_expense' && data.amount) {
                const { error } = await supabase.from('expenses').insert([{
                  amount: data.amount,
                  category: data.category || 'Others',
                  description: data.description || 'WhatsApp Expense',
                  merchant: data.merchant || '',
                  paymentmethod: data.paymentMethod || 'UPI',
                  date: new Date().toISOString().split('T')[0],
                  notes: `Processed via OmniRoute text parser: "${msgText}"`,
                  source: 'whatsapp'
                }]);

                if (error) throw error;
                replyBody = `✅ *Recorded Expense!*\n\n` +
                  `• *Amount:* ₹${data.amount}\n` +
                  `• *Merchant:* ${data.merchant || 'N/A'}\n` +
                  `• *Category:* ${data.category || 'Others'}\n` +
                  `• *Payment:* ${data.paymentMethod || 'UPI'}\n\n` +
                  `Synced with SpendWise!`;
              }

              // 2. Log Peer Ledger Record
              else if (intent === 'log_peer' && data.amount) {
                const { error } = await supabase.from('peer_records').insert([{
                  name: data.peerName || 'Friend',
                  amount: data.amount,
                  original_amount: data.amount,
                  type: data.type || 'lent',
                  description: data.description || 'Peer Split',
                  date: new Date().toISOString().split('T')[0],
                  due_date: data.dueDate || null,
                  status: 'pending'
                }]);

                if (error) {
                  // Fallback to standard expense insert
                  console.warn('peer_records insert failed, falling back to expenses:', error.message);
                  await supabase.from('expenses').insert([{
                    amount: data.amount,
                    category: 'Others',
                    description: `${data.type === 'lent' ? 'Lent to' : 'Borrowed from'} ${data.peerName}: ${data.description}`,
                    paymentmethod: 'UPI',
                    date: new Date().toISOString().split('T')[0],
                    source: 'whatsapp',
                    notes: `Logged as fallback (peer_records write failed)`
                  }]);

                  replyBody = `👥 *Logged to Expenses (Fallback)*\n\n• *Detail:* ${data.type === 'lent' ? 'Lent to' : 'Borrowed from'} ${data.peerName}\n• *Amount:* ₹${data.amount}\n• *Desc:* ${data.description}`;
                } else {
                  replyBody = `👥 *Peer Ledger Record Added!*\n\n` +
                    `• *Person:* ${data.peerName}\n` +
                    `• *Type:* ${data.type === 'lent' ? 'You Lent Money ↗' : 'You Borrowed Money ↘'}\n` +
                    `• *Amount:* ₹${data.amount}\n` +
                    `• *Description:* ${data.description || 'Peer split'}\n` +
                    (data.dueDate ? `⏰ *Due Date:* ${data.dueDate}\n` : '') +
                    `\nSynced with SpendWise!`;
                }
              }

              // 3. Log Payback
              else if (intent === 'log_payback') {
                if (data.peerName) {
                  const { data: peerMatches } = await supabase
                    .from('peer_records')
                    .select('*')
                    .ilike('name', `%${data.peerName}%`)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });

                  if (peerMatches && peerMatches.length > 0) {
                    const targetRecord = peerMatches[0];
                    const paidAmount = data.amount || Number(targetRecord.amount);
                    const newOutstanding = Math.max(0, Number(targetRecord.amount) - paidAmount);
                    const newStatus = newOutstanding === 0 ? 'settled' : 'pending';

                    const { error } = await supabase
                      .from('peer_records')
                      .update({ amount: newOutstanding, status: newStatus })
                      .eq('id', targetRecord.id);

                    if (error) throw error;

                    replyBody = `🤝 *Payback Logged & Synced!*\n\n` +
                      `• *Person:* ${targetRecord.name}\n` +
                      `• *Amount Received:* ₹${paidAmount}\n` +
                      `• *Remaining Outstanding:* ₹${newOutstanding}\n` +
                      `• *Status:* ${newStatus === 'settled' ? 'Fully Settled ✅' : 'Pending ⏳'}\n\n` +
                      `Updated in SpendWise Database!`;
                  } else {
                    replyBody = `⚠️ Couldn't find an active pending peer record for "*${data.peerName}*".`;
                  }
                } else {
                  replyBody = `⚠️ Could not parse peer name for payback. Make sure to mention who paid back.`;
                }
              }

              // 4. Query Database (Financial Context + Semantic Memory Search)
              else if (intent === 'query_database' || intent === 'general_chat') {
                let memoriesContextText = 'None';
                
                // Perform semantic vector memory search if query_database is triggered
                if (intent === 'query_database') {
                  try {
                    // Generate search embedding
                    const embResponse = await axios.post(
                      `${omnirouteUrl}/embeddings`,
                      {
                        model: 'text-embedding-3-small',
                        input: msgText
                      },
                      { headers: { Authorization: `Bearer ${omnirouteKey}` } }
                    );
                    const qEmbedding = embResponse.data.data[0].embedding;

                    // Search vector similarity in memories table
                    const { data: matchedMemories } = await supabase.rpc('match_memories', {
                      query_embedding: qEmbedding,
                      match_threshold: 0.3,
                      match_count: 4
                    });

                    if (matchedMemories && matchedMemories.length > 0) {
                      memoriesContextText = matchedMemories.map((m: any) => `- [Score: ${m.similarity.toFixed(2)}] ${m.content}`).join('\n');
                    }
                  } catch (vErr) {
                    console.warn('Vector memory search failed (make sure match_memories function is installed):', vErr);
                  }
                }

                // Fetch ledger context
                const { data: peers } = await supabase.from('peer_records').select('*').eq('status', 'pending');
                const { data: recentExps } = await supabase.from('expenses').select('*').order('date', { ascending: false }).limit(10);

                const lentTotal = peers ? peers.filter(p => p.type === 'lent').reduce((acc, p) => acc + Number(p.amount), 0) : 0;
                const borrowedTotal = peers ? peers.filter(p => p.type === 'borrowed').reduce((acc, p) => acc + Number(p.amount), 0) : 0;

                const peerSummary = peers && peers.length > 0
                  ? peers.map(p => `- ${p.name}: ${p.type === 'lent' ? 'owes you' : 'you owe'} ₹${p.amount} for "${p.description}"`).join('\n')
                  : 'No active debts.';

                const expSummary = recentExps && recentExps.length > 0
                  ? recentExps.map(e => `- ₹${e.amount} on ${e.category} (${e.description || e.merchant || 'Expense'}) on ${e.date}`).join('\n')
                  : 'No recent expenses.';

                const conversationPrompt = `You are SpendWise AI Assistant, a personal finance and second brain agent.
Answer the user's questions clearly, concisely, and helpfully using the provided financial context and memory summaries.
Format output using bullet points and WhatsApp bold (*text*). Keep your response under 150 words.

Active Peer Balances:
- Owed to You: ₹${lentTotal}
- You Owe: ₹${borrowedTotal}
- Individual balances:
${peerSummary}

Recent Expenses (Last 10):
${expSummary}

Archived Second Brain Memories (similar findings):
${memoriesContextText}

User's Question: "${msgText}"`;

                const chatResponse = await axios.post(
                  `${omnirouteUrl}/chat/completions`,
                  {
                    model: 'auto',
                    messages: [{ role: 'user', content: conversationPrompt }]
                  },
                  { headers: { Authorization: `Bearer ${omnirouteKey}` } }
                );

                replyBody = chatResponse.data.choices[0].message.content.trim();
              }

            } catch (textErr: any) {
              console.error('Text Processing Error:', textErr);
              replyBody = `⚠️ *Failed to process message:* ${textErr.message}`;
            }
          }
        }

        // Send Reply back to user WhatsApp chat
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

        return res.status(200).json({ success: true, receiptUrl });
      }

      return res.status(200).json({ status: 'Ignored webhook payload' });

    } catch (err: any) {
      console.error('Webhook error handler:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
