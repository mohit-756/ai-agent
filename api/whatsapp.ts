import type { VercelRequest, VercelResponse } from '@vercel/node';
export const maxDuration = 60;
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase Client for Serverless Backend
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize Direct Google Gemini API Settings
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

const CATEGORIES = ['Food & Dining', 'Transportation', 'Shopping & Retail', 'Bills & Utilities', 'Entertainment', 'Health & Wellness', 'Travel', 'Education', 'Services', 'Others'];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Food & Dining': [
    'swiggy', 'zomato', 'blinkit', 'instamart', 'zepto', 'dominos', 'pizza', 'mcdonalds', 
    'starbucks', 'kfc', 'subway', 'lunch', 'dinner', 'breakfast', 'cafe', 'restaurant', 
    'tea', 'chai', 'coffee', 'supermarket', 'grocery', 'groceries', 'bakery', 'food', 
    'tiffin', 'curry', 'curries', 'chicken', 'mutton', 'fish', 'meat', 'egg', 'eggs', 
    'paneer', 'spices', 'spice', 'masala', 'chilli', 'chili', 'turmeric', 'salt', 'pepper', 
    'oil', 'ghee', 'tomato', 'tomatoes', 'potato', 'potatoes', 'onion', 'onions', 
    'vegetable', 'vegetables', 'veggies', 'veggie', 'fruit', 'fruits', 'apple', 'banana', 
    'mango', 'milk', 'curd', 'butter', 'cheese', 'dahi', 'lassi', 'bread', 'rice', 
    'dal', 'atta', 'flour', 'wheat', 'roti', 'naan', 'paratha', 'dosa', 'idli', 'snack', 
    'snacks', 'biscuit', 'biscuits', 'chips', 'chocolate', 'sweets', 'sweet', 'ice cream'
  ],
  'Transportation': [
    'uber', 'ola', 'rapido', 'metro', 'namma metro', 'auto', 'cab', 'taxi', 'fuel', 
    'petrol', 'diesel', 'fastag', 'toll', 'parking', 'bus', 'train', 'irctc', 'flight'
  ],
  'Shopping & Retail': [
    'amazon', 'flipkart', 'myntra', 'ajio', 'tata cliq', 'nykaa', 'zara', 'h&m', 
    'decathlon', 'd-mart', 'dmart', 'croma', 'reliance digital', 'clothes', 'shoes', 
    'shopping', 'electronics', 'dress', 'shirt', 'pants'
  ],
  'Bills & Utilities': [
    'electricity', 'bescom', 'tata sky', 'airtel', 'jio', 'vi', 'vodafone', 'broadband', 
    'wifi', 'water bill', 'gas', 'indane', 'hp gas', 'rent', 'maintenance', 'recharge', 'cylinder'
  ],
  'Entertainment': [
    'netflix', 'hotstar', 'prime video', 'spotify', 'youtube', 'bookmyshow', 'cinema', 
    'movie', 'gaming', 'steam', 'playstation', 'concert', 'event'
  ],
  'Health & Wellness': [
    'apollo', '1mg', 'pharmeasy', 'pharmacy', 'hospital', 'doctor', 'clinic', 'cult.fit', 
    'gym', 'fitness', 'medicines', 'medicine', 'lab test'
  ],
  'Travel': [
    'makemytrip', 'goibibo', 'cleartrip', 'airbnb', 'hotel', 'flight', 'resort', 
    'indigo', 'air india', 'stay', 'vacation', 'trip'
  ],
  'Education': [
    'udemy', 'coursera', 'books', 'stationery', 'school', 'college', 'tuition', 
    'course', 'exam fee', 'book'
  ],
  'Services': [
    'urban company', 'dry clean', 'laundry', 'salon', 'barber', 'spa', 'plumber', 'electrician'
  ]
};

function autoCategorize(text: string): string {
  let lower = text.toLowerCase();
  lower = lower.replace(/\b(dro|fro|fon|fo)\b/gi, 'for');

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      return category;
    }
  }
  return 'Others';
}

export function parseFlexibleOrTextDate(str: string): string | null {
  const lower = str.toLowerCase().trim();
  const today = new Date();

  if (lower === 'today') {
    return today.toISOString().split('T')[0];
  }
  if (lower === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  if (lower === 'tomorrow' || lower === 'tommorow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  const monthMap: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12'
  };

  const monthRegex = /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\b/i;
  const monthMatch = lower.match(monthRegex);

  if (monthMatch) {
    const mStr = monthMatch[1].toLowerCase();
    const monthNum = monthMap[mStr];

    const dayMatch = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
    if (dayMatch) {
      const dayNum = parseInt(dayMatch[1], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        const paddedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
        const yearMatch = lower.match(/\b(20\d{2})\b/);
        const yearStr = yearMatch ? yearMatch[1] : `${today.getFullYear()}`;
        return `${yearStr}-${monthNum}-${paddedDay}`;
      }
    }
  }

  const flex = parseFlexibleDate(str);
  if (flex && /^\d{4}-\d{2}-\d{2}$/.test(flex)) {
    return flex;
  }

  return null;
}

export function extractDateDirective(text: string): { date: string; cleanText: string; hasExplicitDate: boolean } {
  const defaultDate = new Date().toISOString().split('T')[0];
  let extractedDate = defaultDate;
  let hasExplicitDate = false;

  const lines = text.split(/[\r\n]+/);
  const remainingLines: string[] = [];

  const dateLineRegex = /^(?:date|dated|on date)\s*[:-=]?\s*(.+)$/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(dateLineRegex);
    if (match) {
      const dateValStr = match[1].trim();
      const parsed = parseFlexibleOrTextDate(dateValStr);
      if (parsed) {
        extractedDate = parsed;
        hasExplicitDate = true;
        continue; // Skip date line so it is never treated as an expense!
      }
    }

    remainingLines.push(line);
  }

  return {
    date: extractedDate,
    cleanText: remainingLines.join('\n'),
    hasExplicitDate
  };
}

export function parseTextExpense(text: string, defaultDate?: string) {
  const trimmed = text.trim();
  
  // Check if line is a date directive or income line
  if (/^(?:date|dated|on date)\s*[:-=]/i.test(trimmed)) {
    return { amount: null, category: 'Others', description: '', merchant: '', paymentMethod: 'UPI', date: defaultDate || new Date().toISOString().split('T')[0] };
  }
  if (/\b(credited|received|deposit|deposited|salary|cashback)\b/i.test(trimmed)) {
    return { amount: null, category: 'Others', description: '', merchant: '', paymentMethod: 'UPI', date: defaultDate || new Date().toISOString().split('T')[0] };
  }

  const normalizedText = trimmed
    .replace(/(\d+)\s*,\s*(\d+)/g, '$1$2')
    .replace(/\b(dro|fro|fon|fo)\b/gi, 'for');

  let amount: number | null = null;
  
  const currencyRegex = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)/i;
  const currencyMatch = normalizedText.match(currencyRegex);
  if (currencyMatch) {
    const rawNum = currencyMatch[1].replace(/,/g, '');
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
    }
  } else {
    const rawRegex = /\b([\d,]+(?:\.\d+)?)\b/;
    const rawMatch = normalizedText.match(rawRegex);
    if (rawMatch) {
      const rawNum = rawMatch[1].replace(/,/g, '');
      const parsed = parseFloat(rawNum);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }
  }

  const category = autoCategorize(normalizedText);
  let paymentMethod = 'UPI';
  const lower = normalizedText.toLowerCase();
  if (lower.includes('credit card') || lower.includes('cc')) {
    paymentMethod = 'Credit Card';
  } else if (lower.includes('debit card') || lower.includes('dc')) {
    paymentMethod = 'Debit Card';
  } else if (lower.includes('cash')) {
    paymentMethod = 'Cash';
  }

  let merchant = '';
  const merchants = ['Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'Instamart', 'Uber', 'Ola', 'Rapido', 'Amazon', 'Flipkart', 'Myntra', 'Netflix', 'Spotify', 'Apollo', 'D-Mart', 'BESCOM', 'Airtel', 'Coffee', 'Tiffin', 'Chicken', 'Spices', 'Tomato'];
  for (const m of merchants) {
    if (lower.includes(m.toLowerCase())) {
      merchant = m;
      break;
    }
  }

  let description = normalizedText.replace(/^(spent|paid|bought|add|expense|for|on)\s+/i, '');
  if (merchant && !description.toLowerCase().includes(merchant.toLowerCase())) {
    description = `${merchant} - ${description}`;
  }

  return {
    amount,
    category,
    description: description || 'WhatsApp Expense',
    merchant,
    paymentMethod,
    date: defaultDate || new Date().toISOString().split('T')[0]
  };
}

export function parseMultipleTextExpenses(text: string, defaultDate?: string) {
  const { date: extractedDate, cleanText } = extractDateDirective(text);
  const targetDate = defaultDate || extractedDate;

  const trimmed = cleanText.trim();
  const lower = trimmed.toLowerCase();

  let globalPaymentMethod = 'UPI';
  if (lower.includes('credit card') || lower.includes('cc')) {
    globalPaymentMethod = 'Credit Card';
  } else if (lower.includes('debit card') || lower.includes('dc')) {
    globalPaymentMethod = 'Debit Card';
  } else if (lower.includes('cash')) {
    globalPaymentMethod = 'Cash';
  }

  const lines = trimmed.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
  const items: Array<{
    amount: number;
    category: string;
    description: string;
    merchant: string;
    paymentMethod: string;
    date: string;
  }> = [];

  for (const line of lines) {
    const lineLower = line.toLowerCase();
    
    if (/^(pp|phonepe|upi|gpay|paytm|cash|credit card|debit card|cc|dc)$/i.test(lineLower)) {
      continue;
    }

    // Skip income lines from expense batch
    if (/\b(credited|received|deposit|deposited|salary|cashback)\b/i.test(lineLower)) {
      continue;
    }

    const exp = parseTextExpense(line, targetDate);
    if (exp.amount !== null) {
      if (!lineLower.includes('cash') && !lineLower.includes('credit card') && !lineLower.includes('debit card')) {
        exp.paymentMethod = globalPaymentMethod;
      }
      items.push({
        amount: exp.amount,
        category: exp.category,
        description: exp.description,
        merchant: exp.merchant,
        paymentMethod: exp.paymentMethod,
        date: exp.date
      });
    }
  }

  return items;
}

export function parseIncomeRecord(text: string, defaultDate?: string) {
  const { date: extractedDate, cleanText } = extractDateDirective(text);
  const targetDate = defaultDate || extractedDate;

  const trimmed = cleanText.trim();
  const lower = trimmed.toLowerCase();
  const isIncome = /\b(credited|received|deposit|deposited|salary|cashback|earned)\b/i.test(lower);
  if (!isIncome) {
    return { isIncome: false, amount: null, description: '', date: targetDate };
  }

  // Handle numbers with spaces around commas or dots like "35 ,000", "35 , 000", "35,000", "35 000"
  const cleaned = trimmed
    .replace(/(\d+)\s*,\s*(\d+)/g, '$1$2')
    .replace(/(\d+)\s+(\d{3})\b/g, '$1$2');

  const incomeRegex = /\b(?:credited|received|deposit|deposited|salary|cashback|earned)\b\s*(?:(?:rs\.?|inr|₹)\s*)?([\d,]+(?:\.\d+)?)/i;
  const amountRegex = /(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:rs|rupees|inr|₹)?/i;

  let amount: number | null = null;
  const incMatch = cleaned.match(incomeRegex);
  if (incMatch) {
    const rawNum = incMatch[1].replace(/,/g, '');
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
    }
  }

  if (!amount) {
    const match = cleaned.match(amountRegex);
    if (match) {
      const rawNum = (match[1] || match[2] || '').replace(/,/g, '');
      const parsed = parseFloat(rawNum);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }
  }

  return {
    isIncome: true,
    amount,
    description: trimmed,
    date: targetDate
  };
}

function parseFlexibleDate(str: string): string {
  const clean = str.trim().replace(/[^0-9-/]/g, '');
  
  const ymd = clean.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  
  const dmy = clean.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

  const dmyShort = clean.match(/^(\d{2})[-/](\d{2})[-/](\d{2})$/);
  if (dmyShort) {
    const year = parseInt(dmyShort[3]) < 50 ? `20${dmyShort[3]}` : `19${dmyShort[3]}`;
    return `${year}-${dmyShort[2]}-${dmyShort[1]}`;
  }

  return clean;
}

export function parseTextPeerRecord(text: string) {
  const lower = text.toLowerCase();
  
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
        recDate = parseFlexibleOrTextDate(parsedDate) || parseFlexibleDate(parsedDate);
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
        dueD = parseFlexibleOrTextDate(parsedDueDate) || parseFlexibleDate(parsedDueDate);
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

  const isLent = /\blent\b|\blend\b|\bgave\b.*\bto\b|\bgiven\b.*\bto\b|\bsplit\b.*\bwith\b|\bowes\b.*\bme\b/.test(lower);
  const isBorrowed = /\bborrowed\b|\bborrow\b|\btook\b.*\bfrom\b|\breceived\b.*\bfrom\b|\bi\b.*\bowe\b/.test(lower);
  const isReminder = /\bremind\b.*\b(take|pay|get|give|return|collect|ask)\b/.test(lower);
  
  const isPeerRecord = isLent || isBorrowed || isReminder;
  
  if (!isPeerRecord) {
    return { isPeerRecord: false };
  }
  
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
  
  let type: 'lent' | 'borrowed' = 'lent';
  if (isBorrowed) {
    type = 'borrowed';
  } else if (isReminder && (lower.includes('pay') || lower.includes('give') || lower.includes('return to'))) {
    type = 'borrowed';
  } else if (isReminder && (lower.includes('take') || lower.includes('get') || lower.includes('collect') || lower.includes('ask'))) {
    type = 'lent';
  }
  
  let peerName = 'Friend';
  let description = 'Peer Split';
  
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
  
  if (peerName && peerName !== 'Friend') {
    peerName = peerName.charAt(0).toUpperCase() + peerName.slice(1);
  }
  
  let recordDate = new Date().toISOString().split('T')[0];
  if (lower.includes('yesterday')) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    recordDate = yesterday.toISOString().split('T')[0];
  } else {
    const dateMatch = lower.match(/\bon\s+([\d]{2,4}[-/][\d]{2}[-/][\d]{2,4})\b/);
    if (dateMatch) {
      recordDate = parseFlexibleOrTextDate(dateMatch[1]) || parseFlexibleDate(dateMatch[1]);
    }
  }

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
      dueDateStr = parseFlexibleOrTextDate(dueMatch[1]) || parseFlexibleDate(dueMatch[1]);
    }
  }

  const forRegex = /\bfor\s+([a-zA-Z0-9\s]+?)(?:\s+on|\s+due|$)/i;
  const forMatch = text.match(forRegex);
  if (forMatch && forMatch[1]) {
    description = forMatch[1].trim();
  } else {
    description = text.replace(amountRegex, '')
      .replace(/\b(?:lent|borrowed|to|from|for|split|with|on|due|yesterday|tomorrow|tommorow|remind|me|take|give|money|cash|him|her|them)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
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

export function localParseMessage(text: string) {
  const { date: targetDate, cleanText, hasExplicitDate } = extractDateDirective(text);
  const trimmed = cleanText.trim();

  // 1. Payback check
  const payback = parseTextPayback(trimmed);
  if (payback.isPayback && payback.peerName) {
    return {
      intent: 'log_payback',
      data: { peerName: payback.peerName, amount: payback.amount, date: targetDate }
    };
  }

  // 2. Peer Record check (Lent/Borrowed)
  const peerRecord = parseTextPeerRecord(trimmed);
  if (peerRecord.isPeerRecord && peerRecord.amount) {
    return {
      intent: 'log_peer',
      data: {
        peerName: peerRecord.peerName,
        amount: peerRecord.amount,
        type: peerRecord.type,
        description: peerRecord.description,
        dueDate: peerRecord.dueDate || null,
        date: targetDate
      }
    };
  }

  // 3. Multi-line Check: check for both Expenses AND Income
  const lines = trimmed.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
  const incomeLines: string[] = [];
  const expenseLines: string[] = [];

  for (const line of lines) {
    if (/\b(credited|received|deposit|deposited|salary|cashback|earned)\b/i.test(line)) {
      incomeLines.push(line);
    } else {
      expenseLines.push(line);
    }
  }

  const parsedIncomes = incomeLines
    .map(line => parseIncomeRecord(line, targetDate))
    .filter(inc => inc.isIncome && inc.amount !== null);

  const parsedExpenses = parseMultipleTextExpenses(expenseLines.join('\n'), targetDate);

  if (parsedExpenses.length > 0 && parsedIncomes.length > 0) {
    return {
      intent: 'log_multi_financial',
      data: {
        expenses: parsedExpenses,
        incomes: parsedIncomes,
        date: targetDate,
        hasExplicitDate
      }
    };
  }

  // 4. Standalone Income check
  const incomeRecord = parseIncomeRecord(trimmed, targetDate);
  if (incomeRecord.isIncome && incomeRecord.amount) {
    return {
      intent: 'log_income',
      data: {
        amount: incomeRecord.amount,
        description: incomeRecord.description || 'Money Credited',
        category: 'Income',
        date: targetDate,
        hasExplicitDate
      }
    };
  }

  // 5. Standalone Expense check
  if (parsedExpenses.length > 0) {
    return {
      intent: 'log_expense',
      data: {
        items: parsedExpenses,
        date: targetDate,
        hasExplicitDate
      }
    };
  }

  // 6. Fallback: Save as Second Brain memory note
  return {
    intent: 'log_memory',
    data: {
      content: text.trim(),
      category: 'note',
      date: targetDate
    }
  };
}

interface LLMCompletionOptions {
  systemPrompt?: string;
  userMessage?: string;
  jsonMode?: boolean;
  imageBase64?: string;
  mimeType?: string;
  timeoutMs?: number;
}

/**
 * Direct Google Gemini API LLM Call (No OmniRoute Dependency)
 */
async function callLLMCompletion(options: LLMCompletionOptions): Promise<string | null> {
  if (!geminiApiKey) return null;

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'];
  for (const model of models) {
    try {
      console.log(`Calling Direct Google Gemini API (${model})...`);
      const parts: any[] = [];
      if (options.systemPrompt) {
        parts.push({ text: `[System Directive]: ${options.systemPrompt}` });
      }
      if (options.userMessage) {
        parts.push({ text: options.userMessage });
      }
      if (options.imageBase64) {
        parts.push({
          inlineData: {
            mimeType: options.mimeType || 'image/jpeg',
            data: options.imageBase64
          }
        });
      }

      const body: any = { contents: [{ parts }] };
      if (options.jsonMode) {
        body.generationConfig = { responseMimeType: 'application/json' };
      }

      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        body,
        { timeout: options.timeoutMs || 8000 }
      );

      const content = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (content) return content;
    } catch (err: any) {
      console.warn(`Gemini direct model ${model} failed:`, err.response?.data?.error?.message || err.message);
    }
  }

  return null;
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
        fromNumber = msg.from;
        
        let replyBody = '';
        let receiptUrl: string | undefined = undefined;

        // Audio/Voice notes disabled per user preference
        const audioObj = msg.audio || msg.voice;
        if ((msg.type === 'audio' || msg.type === 'voice') && audioObj) {
          replyBody = `🎤 *Voice messages are disabled.* Please type your expense, income, or note as text!`;
        }

        // Process image messages (Receipt OCR via Direct Gemini API)
        else if (msg.type === 'image' && msg.image) {
          const mediaId = msg.image.id;
          try {
            if (!supabase) throw new Error('Supabase client is not initialized.');

            console.log(`Downloading receipt image: ${mediaId}`);
            
            const mediaRes = await axios.get(`https://graph.facebook.com/v25.0/${mediaId}`, {
              headers: { Authorization: `Bearer ${whatsappToken}` }
            });

            const imageRes = await axios.get(mediaRes.data.url, {
              headers: { Authorization: `Bearer ${whatsappToken}` },
              responseType: 'arraybuffer'
            });
            const buffer = Buffer.from(imageRes.data);

            const storageFilename = `${Date.now()}_receipt.jpg`;
            const { error: uploadError } = await supabase.storage
              .from('receipts')
              .upload(storageFilename, buffer, {
                contentType: 'image/jpeg',
                upsert: true
              });

            if (!uploadError) {
              const { data: linkData } = supabase.storage
                .from('receipts')
                .getPublicUrl(storageFilename);
              receiptUrl = linkData.publicUrl;
            }

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

            const ocrText = await callLLMCompletion({
              systemPrompt: prompt,
              imageBase64: buffer.toString('base64'),
              mimeType: 'image/jpeg',
              jsonMode: true,
              timeoutMs: 12000
            });

            if (ocrText) {
              const cleanJson = ocrText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
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
                  notes: 'Receipt image scanned via Gemini OCR',
                  source: 'whatsapp',
                  receipt_url: receiptUrl || null
                }]);

                if (dbError) {
                  replyBody = `⚠️ Error saving expense: ${dbError.message}`;
                } else {
                  replyBody = `📸 *Receipt Scanned Successfully!*\n\n` +
                    `• *Amount:* ₹${parsed.amount}\n` +
                    `• *Merchant:* ${parsed.merchant || 'N/A'}\n` +
                    `• *Category:* ${parsed.category}\n` +
                    `• *Payment:* ${parsed.paymentMethod}\n\n` +
                    `Synced with SpendWise Dashboard!`;
                }
              } else {
                replyBody = `⚠️ Could not extract valid amount from this receipt scan.`;
              }
            } else {
              replyBody = `⚠️ *Receipt Scan:* Could not scan receipt image. Please type your expense as text.`;
            }

          } catch (ocrErr: any) {
            console.error('OCR Error:', ocrErr);
            replyBody = `⚠️ *OCR Parsing failed:* ${ocrErr.message}`;
          }
        }

        // Process text messages
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
              
              const htmlRes = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 });
              const content = htmlRes.data.toString()
                .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
                .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 6000);

              const summaryPrompt = `Summarize the core takeaways of this web page content in 3-4 bullet points:\n\n${content}`;
              const summary = await callLLMCompletion({ userMessage: summaryPrompt }) || 'Web page archived.';

              const { error: memErr } = await supabase.from('memories').insert([{
                content: `Link Summary for: ${url}\n\n${summary}`,
                metadata: { source: 'whatsapp_link', url }
              }]);

              if (memErr) throw memErr;

              replyBody = `🔗 *Link Summarized & Saved to Second Brain!*\n\n${summary}`;
            } catch (linkErr: any) {
              console.error('Link scraping error:', linkErr);
              replyBody = `⚠️ *Link archiving failed:* ${linkErr.message}`;
            }
          }

          // Scenario B: Direct Gemini LLM & Local Deterministic Intent Parser
          else {
            try {
              if (!supabase) throw new Error('Supabase client is not initialized.');

              const systemPrompt = `You are the parsing brain of SpendWise, an AI personal finance and real-life memory system.
Analyze the user's message and determine the correct intent. Respond ONLY with a clean JSON object. Do not include markdown fences.

Intents:
- "log_expense": spending money (e.g., "spent 350 on lunch", "spent 40 tiffin \n 80 curries \n Pp", "zomato 250 paid upi", "spend 30 on coffee cash", "150 on chicken \n 50 dro spices \n 25 fro tomato \n Date :-august 2")
- "log_income": receiving money / salary / credits (e.g., "Credited 35,000", "Credited 35 ,000", "salary 50000 received", "received 500 from bank")
- "log_peer": lending or borrowing money (e.g., "lent 500 to Sneha for split", "borrowed 1000 from Rohit")
- "log_payback": settling debts (e.g., "Sneha paid back 500", "repaid 1000 to Rohit")
- "log_memory": saving a non-monetary real-life note, reminder, task, idea, or memo (e.g., "Doctor appointment on Friday at 5pm", "Buy groceries")
- "query_database": questioning past transactions or memory (e.g., "who owes me money?", "how much did I spend on cabs?")
- "general_chat": general chatting or greetings

Important Rules:
1. If the message contains explicit date directives (e.g. "Date :-august 2", "date: 2 Aug"), extract that date (YYYY-MM-DD) and assign it to all expense/income items. Do NOT parse the date directive line as an expense item!
2. Food items like "chicken", "spices", "tomato", "tiffin", "curries", "groceries" MUST be categorized as "Food & Dining".
3. Handle typos in prepositions (e.g., "dro spices" -> "spices", "fro tomato" -> "tomato").
4. Messages containing "Credited", "Received", "Salary" followed by an amount MUST be categorized as "log_income", NEVER "log_memory".

Return Format:
{
  "intent": "log_expense" | "log_income" | "log_peer" | "log_payback" | "log_memory" | "query_database" | "general_chat",
  "data": {
    // For log_expense:
    "items": [
      {
        "amount": number,
        "merchant": string,
        "category": "Food & Dining" | "Transportation" | "Shopping & Retail" | "Bills & Utilities" | "Entertainment" | "Health & Wellness" | "Travel" | "Education" | "Services" | "Others",
        "description": string,
        "paymentMethod": "UPI" | "Credit Card" | "Debit Card" | "Cash" | "Net Banking",
        "date": "YYYY-MM-DD"
      }
    ],

    // For log_income:
    "amount": number,
    "description": string,
    "date": "YYYY-MM-DD",

    // For log_peer:
    "peerName": string,
    "amount": number | null,
    "type": "lent" | "borrowed",
    "description": string,
    "dueDate": "YYYY-MM-DD" | null,
    "date": "YYYY-MM-DD",

    // For log_payback:
    "peerName": string,
    "amount": number | null,

    // For log_memory:
    "content": string,
    "category": "note" | "reminder" | "idea" | "task"
  }
}`;

              let parsedIntentObj: any = null;
              
              const llmResponseText = await callLLMCompletion({
                systemPrompt,
                userMessage: msgText,
                jsonMode: true,
                timeoutMs: 8000
              });

              if (llmResponseText) {
                try {
                  const cleanJson = llmResponseText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
                  parsedIntentObj = JSON.parse(cleanJson);
                } catch (pe) {
                  console.warn('JSON parsing failed, falling back to local engine:', pe);
                }
              }

              // Always run local parser as benchmark
              const localParsed = localParseMessage(msgText);

              // Override LLM if Gemini returned log_memory or general_chat when text clearly contains financial keywords
              if (!parsedIntentObj || !parsedIntentObj.intent || 
                  ((parsedIntentObj.intent === 'log_memory' || parsedIntentObj.intent === 'general_chat') && 
                   (localParsed.intent === 'log_income' || localParsed.intent === 'log_expense' || localParsed.intent === 'log_multi_financial' || localParsed.intent === 'log_peer' || localParsed.intent === 'log_payback'))) {
                parsedIntentObj = localParsed;
              }

              const intent = parsedIntentObj.intent;
              const data = parsedIntentObj.data || {};
              const todayStr = new Date().toISOString().split('T')[0];

              // 0. Log Multi-Financial (Expenses + Income in single message)
              if (intent === 'log_multi_financial') {
                const expensesToInsert = data.expenses || [];
                const incomesToInsert = data.incomes || [];
                const dateStr = data.date || todayStr;

                if (expensesToInsert.length > 0) {
                  const records = expensesToInsert.map((item: any) => ({
                    amount: item.amount,
                    category: item.category || autoCategorize(item.description || item.merchant || msgText),
                    description: item.description || 'WhatsApp Expense',
                    merchant: item.merchant || '',
                    paymentmethod: item.paymentMethod || 'UPI',
                    date: item.date || dateStr,
                    notes: `Processed via SpendWise: "${msgText}"`,
                    source: 'whatsapp'
                  }));
                  const { error: expErr } = await supabase.from('expenses').insert(records);
                  if (expErr) throw expErr;
                }

                if (incomesToInsert.length > 0) {
                  const memRecords = incomesToInsert.map((inc: any) => ({
                    content: `[INCOME] Credited ₹${Number(inc.amount).toLocaleString('en-IN')}: ${inc.description}`,
                    metadata: {
                      source: 'whatsapp_text',
                      category: 'income',
                      amount: inc.amount,
                      date: inc.date || dateStr
                    }
                  }));
                  const { error: incErr } = await supabase.from('memories').insert(memRecords);
                  if (incErr) throw incErr;
                }

                const replyParts: string[] = [];

                if (expensesToInsert.length > 0) {
                  if (expensesToInsert.length === 1) {
                    const i = expensesToInsert[0];
                    replyParts.push(`✅ *Recorded Expense!*\n\n• *Amount:* ₹${i.amount}\n• *Merchant:* ${i.merchant || 'N/A'}\n• *Category:* ${i.category}\n• *Payment:* ${i.paymentMethod}`);
                  } else {
                    const expLines = expensesToInsert.map((i: any) => `• *${i.description || i.merchant || 'Expense'}*: ₹${i.amount} (${i.category || 'Others'}) [${i.paymentMethod || 'UPI'}]`);
                    const totalSum = expensesToInsert.reduce((acc: number, i: any) => acc + Number(i.amount), 0);
                    replyParts.push(`✅ *Recorded ${expensesToInsert.length} Expenses!*\n\n${expLines.join('\n')}\n\n💰 *Total Spent:* ₹${totalSum}`);
                  }
                }

                if (incomesToInsert.length > 0) {
                  const incLines = incomesToInsert.map((inc: any) => `• *Credited:* ₹${Number(inc.amount).toLocaleString('en-IN')} (${inc.description})`);
                  replyParts.push(`💵 *Income / Credit Recorded!*\n\n${incLines.join('\n')}`);
                }

                if (data.hasExplicitDate || data.date) {
                  replyParts.push(`📅 *Date:* ${data.date || dateStr}`);
                }

                replyParts.push(`Synced with SpendWise!`);
                replyBody = replyParts.join('\n\n');
              }

              // 1. Log Expense (Single or Multiple items)
              else if (intent === 'log_expense') {
                const itemsToInsert: Array<any> = Array.isArray(data.items) && data.items.length > 0
                  ? data.items
                  : (data.amount ? [data] : []);

                const validItems = itemsToInsert.filter(i => i.amount && i.amount > 0);

                if (validItems.length > 0) {
                  const records = validItems.map(item => ({
                    amount: item.amount,
                    category: item.category || autoCategorize(item.description || item.merchant || msgText),
                    description: item.description || 'WhatsApp Expense',
                    merchant: item.merchant || '',
                    paymentmethod: item.paymentMethod || 'UPI',
                    date: item.date || data.date || todayStr,
                    notes: `Processed via SpendWise: "${msgText}"`,
                    source: 'whatsapp'
                  }));

                  const { error } = await supabase.from('expenses').insert(records);
                  if (error) throw error;

                  if (validItems.length === 1) {
                    const item = validItems[0];
                    replyBody = `✅ *Recorded Expense!*\n\n` +
                      `• *Amount:* ₹${item.amount}\n` +
                      `• *Merchant:* ${item.merchant || 'N/A'}\n` +
                      `• *Category:* ${item.category || autoCategorize(item.description || '')}\n` +
                      `• *Payment:* ${item.paymentMethod || 'UPI'}\n\n` +
                      (data.hasExplicitDate || item.date ? `📅 *Date:* ${item.date || data.date}\n\n` : '') +
                      `Synced with SpendWise!`;
                  } else {
                    const lines = validItems.map(i => `• *${i.description || i.merchant || 'Expense'}*: ₹${i.amount} (${i.category || 'Others'}) [${i.paymentMethod || 'UPI'}]`);
                    const totalSum = validItems.reduce((acc, i) => acc + Number(i.amount), 0);
                    replyBody = `✅ *Recorded ${validItems.length} Expenses!*\n\n` +
                      `${lines.join('\n')}\n\n` +
                      `💰 *Total Spent:* ₹${totalSum}\n` +
                      (data.hasExplicitDate || data.date ? `📅 *Date:* ${data.date}\n` : '') +
                      `Synced with SpendWise!`;
                  }
                } else {
                  await supabase.from('memories').insert([{
                    content: `[NOTE] ${msgText}`,
                    metadata: { source: 'whatsapp_text', category: 'note', date: data.date || todayStr }
                  }]);
                  replyBody = `📝 *Saved to Second Brain Notes!*\n\n"${msgText}"`;
                }
              }

              // 2. Log Income / Money Credited
              else if (intent === 'log_income' && data.amount) {
                const amount = data.amount;
                const desc = data.description || msgText;
                const recDate = data.date || todayStr;
                const { error: memErr } = await supabase.from('memories').insert([{
                  content: `[INCOME] Credited ₹${amount.toLocaleString('en-IN')}: ${desc}`,
                  metadata: {
                    source: 'whatsapp_text',
                    category: 'income',
                    amount,
                    date: recDate
                  }
                }]);

                if (memErr) throw memErr;

                replyBody = `💵 *Income / Credit Recorded!*\n\n` +
                  `• *Amount:* ₹${amount.toLocaleString('en-IN')}\n` +
                  `• *Details:* ${desc}\n` +
                  `• *Category:* Income\n\n` +
                  (data.hasExplicitDate || data.date ? `📅 *Date:* ${recDate}\n\n` : '') +
                  `Synced with SpendWise Second Brain!`;
              }

              // 3. Log Peer Ledger Record
              else if (intent === 'log_peer' && data.amount) {
                const recDate = data.date || todayStr;
                const { error } = await supabase.from('peer_records').insert([{
                  name: data.peerName || 'Friend',
                  amount: data.amount,
                  original_amount: data.amount,
                  type: data.type || 'lent',
                  description: data.description || 'Peer Split',
                  date: recDate,
                  due_date: data.dueDate || null,
                  status: 'pending'
                }]);

                if (error) {
                  await supabase.from('expenses').insert([{
                    amount: data.amount,
                    category: 'Others',
                    description: `${data.type === 'lent' ? 'Lent to' : 'Borrowed from'} ${data.peerName}: ${data.description}`,
                    paymentmethod: 'UPI',
                    date: recDate,
                    source: 'whatsapp',
                    notes: `Logged as fallback`
                  }]);

                  replyBody = `👥 *Logged to Expenses (Fallback)*\n\n• *Detail:* ${data.type === 'lent' ? 'Lent to' : 'Borrowed from'} ${data.peerName}\n• *Amount:* ₹${data.amount}\n• *Desc:* ${data.description}`;
                } else {
                  replyBody = `👥 *Peer Ledger Record Added!*\n\n` +
                    `• *Person:* ${data.peerName}\n` +
                    `• *Type:* ${data.type === 'lent' ? 'You Lent Money ↗' : 'You Borrowed Money ↘'}\n` +
                    `• *Amount:* ₹${data.amount}\n` +
                    `• *Description:* ${data.description || 'Peer split'}\n` +
                    (data.dueDate ? `⏰ *Due Date:* ${data.dueDate}\n` : '') +
                    (data.hasExplicitDate || data.date ? `📅 *Date:* ${recDate}\n` : '') +
                    `\nSynced with SpendWise!`;
                }
              }

              // 4. Log Payback
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
                  replyBody = `⚠️ Could not parse peer name for payback.`;
                }
              }

              // 5. Log Real-Life Memory / Note / Reminder / Task / Idea
              else if (intent === 'log_memory') {
                const memoryContent = data.content || msgText;
                const memoryCategory = (data.category || 'note').toUpperCase();

                const { error: memErr } = await supabase.from('memories').insert([{
                  content: `[${memoryCategory}] ${memoryContent}`,
                  metadata: {
                    source: 'whatsapp_text',
                    category: data.category || 'note',
                    date: data.date || todayStr
                  }
                }]);

                if (memErr) throw memErr;

                replyBody = `📝 *Saved to Second Brain Notes!*\n\n` +
                  `• *Category:* ${memoryCategory}\n` +
                  `• *Note:* "${memoryContent}"\n\n` +
                  `Stored safely in your SpendWise Second Brain!`;
              }

              // 6. Query Database
              else if (intent === 'query_database' || intent === 'general_chat') {
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
Answer the user's questions clearly, concisely, and helpfully using the provided financial context.
Format output using bullet points and WhatsApp bold (*text*). Keep your response under 150 words.

Active Peer Balances:
- Owed to You: ₹${lentTotal}
- You Owe: ₹${borrowedTotal}
- Individual balances:
${peerSummary}

Recent Expenses (Last 10):
${expSummary}

User's Question: "${msgText}"`;

                const chatReply = await callLLMCompletion({ userMessage: conversationPrompt, timeoutMs: 8000 });
                replyBody = chatReply || `Hi! I am SpendWise AI. I can track expenses, debts, income, and notes. Ask me anything about your finances!`;
              }

            } catch (textErr: any) {
              console.error('Text Processing Error:', textErr);
              try {
                const fallbackObj = localParseMessage(msgText);
                if ((fallbackObj.intent === 'log_expense' || fallbackObj.intent === 'log_multi_financial') && fallbackObj.data.items?.length) {
                  const items = fallbackObj.data.items;
                  if (supabase) {
                    await supabase.from('expenses').insert(items.map((i: any) => ({
                      amount: i.amount,
                      category: i.category,
                      description: i.description,
                      merchant: i.merchant,
                      paymentmethod: i.paymentMethod,
                      date: i.date || new Date().toISOString().split('T')[0],
                      notes: `Logged via fallback parser`,
                      source: 'whatsapp'
                    })));
                  }
                  replyBody = `✅ *Recorded Expense!*\n\n• *Amount:* ₹${items[0].amount}\n• *Category:* ${items[0].category}\n• *Payment:* ${items[0].paymentMethod}\n\nSynced with SpendWise!`;
                } else {
                  if (supabase) {
                    await supabase.from('memories').insert([{
                      content: `[NOTE] ${msgText}`,
                      metadata: { source: 'whatsapp_text', category: 'note', date: new Date().toISOString().split('T')[0] }
                    }]);
                  }
                  replyBody = `📝 *Saved to Second Brain Notes!*\n\n"${msgText}"`;
                }
              } catch (err: any) {
                console.error('Fallback execution error:', err.message);
                replyBody = `📝 *Received message:* "${msgText}". Saved to SpendWise!`;
              }
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
              },
              timeout: 8000
            }
          );
        }

        return res.status(200).json({ success: true, receiptUrl });
      }

      return res.status(200).json({ status: 'Ignored webhook payload' });

    } catch (err: any) {
      console.error('Webhook error handler:', err.message);
      return res.status(200).json({ error: err.message, handled: true });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
