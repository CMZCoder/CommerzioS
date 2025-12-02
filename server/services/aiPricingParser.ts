/**
 * AI Pricing Parser
 * 
 * Multi-provider fallback for parsing natural language pricing descriptions:
 * 1. Groq llama-3.3-70b (free, fast)
 * 2. OpenAI gpt-4o-mini (reliable)
 * 3. Local regex parser (always works)
 * 
 * With caching to reduce AI calls.
 */

import OpenAI from 'openai';

// ===========================================
// TYPES
// ===========================================

export interface ParsedPricing {
  price: number;
  currency: string;
  billingInterval: 'one_time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  durationMinutes?: number;
  confidence: number;
  source: 'groq' | 'openai' | 'regex';
}

export interface PricingParserInput {
  description: string;
  context?: string;
}

// ===========================================
// CACHE
// ===========================================

interface CachedResult {
  result: ParsedPricing;
  timestamp: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const cache: Map<string, CachedResult> = new Map();

// Cleanup expired cache entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, cached] of cache) {
    if (now - cached.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Generate cache key from input
 */
function getCacheKey(input: PricingParserInput): string {
  return `${input.description.toLowerCase().trim()}:${input.context || ''}`;
}

// ===========================================
// GROQ PARSER (Primary)
// ===========================================

let groqClient: OpenAI | null = null;

function getGroqClient(): OpenAI | null {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  
  if (!groqClient) {
    groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  
  return groqClient;
}

async function parseWithGroq(input: PricingParserInput): Promise<ParsedPricing | null> {
  const client = getGroqClient();
  if (!client) return null;
  
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a pricing parser for a Swiss service marketplace. Parse the pricing description and return a JSON object with:
- price: numeric value in CHF
- currency: always "CHF"
- billingInterval: one of "one_time", "hourly", "daily", "weekly", "monthly", "yearly"
- durationMinutes: duration in minutes if specified
- confidence: 0-1 how confident you are in the parsing

Examples:
"50 CHF per hour" -> {"price": 50, "currency": "CHF", "billingInterval": "hourly", "confidence": 0.95}
"Starting from 200.-" -> {"price": 200, "currency": "CHF", "billingInterval": "one_time", "confidence": 0.8}
"80 per session (2h)" -> {"price": 80, "currency": "CHF", "billingInterval": "one_time", "durationMinutes": 120, "confidence": 0.9}

Return ONLY the JSON object, no other text.`,
        },
        {
          role: 'user',
          content: input.context 
            ? `Context: ${input.context}\nPricing: ${input.description}`
            : input.description,
        },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    
    const parsed = JSON.parse(content.trim());
    return {
      ...parsed,
      source: 'groq' as const,
    };
  } catch (error) {
    console.error('Groq parsing failed:', error);
    return null;
  }
}

// ===========================================
// OPENAI PARSER (Fallback)
// ===========================================

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  return openaiClient;
}

async function parseWithOpenAI(input: PricingParserInput): Promise<ParsedPricing | null> {
  const client = getOpenAIClient();
  if (!client) return null;
  
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Parse pricing descriptions for a Swiss service marketplace. Return JSON with:
- price: numeric value in CHF
- currency: "CHF"
- billingInterval: "one_time" | "hourly" | "daily" | "weekly" | "monthly" | "yearly"
- durationMinutes: optional duration in minutes
- confidence: 0-1 confidence level

Return only valid JSON.`,
        },
        {
          role: 'user',
          content: input.context 
            ? `Context: ${input.context}\nPricing: ${input.description}`
            : input.description,
        },
      ],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    
    const parsed = JSON.parse(content);
    return {
      ...parsed,
      source: 'openai' as const,
    };
  } catch (error) {
    console.error('OpenAI parsing failed:', error);
    return null;
  }
}

// ===========================================
// REGEX PARSER (Last Resort)
// ===========================================

/**
 * Parse pricing using regex patterns
 * This always works but may be less accurate
 */
function parseWithRegex(input: PricingParserInput): ParsedPricing {
  const text = input.description.toLowerCase();
  
  // Extract price
  const pricePatterns = [
    /(\d+(?:[.,]\d+)?)\s*(?:chf|fr\.?|sfr\.?|-)/i,  // 50 CHF, 50.-, 50 Fr.
    /chf\s*(\d+(?:[.,]\d+)?)/i,                       // CHF 50
    /(\d+(?:[.,]\d+)?)\s*(?:pro|per|\/)/i,           // 50 per, 50/
    /ab\s*(\d+(?:[.,]\d+)?)/i,                        // ab 50 (starting from)
    /(\d+(?:[.,]\d+)?)/,                              // Just a number
  ];
  
  let price = 0;
  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      price = parseFloat(match[1].replace(',', '.'));
      break;
    }
  }
  
  // Determine billing interval
  let billingInterval: ParsedPricing['billingInterval'] = 'one_time';
  let confidence = 0.5;
  
  if (/(?:pro|per|\/)\s*(?:stunde|hour|h\b|std)/i.test(text)) {
    billingInterval = 'hourly';
    confidence = 0.8;
  } else if (/(?:pro|per|\/)\s*(?:tag|day|d\b)/i.test(text)) {
    billingInterval = 'daily';
    confidence = 0.8;
  } else if (/(?:pro|per|\/)\s*(?:woche|week|w\b)/i.test(text)) {
    billingInterval = 'weekly';
    confidence = 0.8;
  } else if (/(?:pro|per|\/)\s*(?:monat|month|m\b)/i.test(text)) {
    billingInterval = 'monthly';
    confidence = 0.8;
  } else if (/stündlich|hourly/i.test(text)) {
    billingInterval = 'hourly';
    confidence = 0.7;
  } else if (/täglich|daily/i.test(text)) {
    billingInterval = 'daily';
    confidence = 0.7;
  }
  
  // Extract duration
  let durationMinutes: number | undefined;
  
  const durationPatterns = [
    /(\d+(?:[.,]\d+)?)\s*(?:stunden?|hours?|h\b)/i,
    /(\d+(?:[.,]\d+)?)\s*(?:minuten?|minutes?|min)/i,
  ];
  
  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(',', '.'));
      if (pattern.source.includes('stunde') || pattern.source.includes('hour')) {
        durationMinutes = Math.round(value * 60);
      } else {
        durationMinutes = Math.round(value);
      }
      break;
    }
  }
  
  return {
    price,
    currency: 'CHF',
    billingInterval,
    durationMinutes,
    confidence,
    source: 'regex',
  };
}

// ===========================================
// MAIN PARSER FUNCTION
// ===========================================

/**
 * Parse pricing description using multi-provider fallback
 */
export async function parsePricing(input: PricingParserInput): Promise<ParsedPricing> {
  // Check cache first
  const cacheKey = getCacheKey(input);
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('[AI Parser] Cache hit');
    return cached.result;
  }
  
  // Try Groq first (free and fast)
  console.log('[AI Parser] Trying Groq...');
  const groqResult = await parseWithGroq(input);
  if (groqResult && groqResult.confidence > 0.5) {
    cache.set(cacheKey, { result: groqResult, timestamp: Date.now() });
    return groqResult;
  }
  
  // Try OpenAI as fallback
  console.log('[AI Parser] Trying OpenAI...');
  const openaiResult = await parseWithOpenAI(input);
  if (openaiResult && openaiResult.confidence > 0.5) {
    cache.set(cacheKey, { result: openaiResult, timestamp: Date.now() });
    return openaiResult;
  }
  
  // Fall back to regex
  console.log('[AI Parser] Using regex fallback');
  const regexResult = parseWithRegex(input);
  cache.set(cacheKey, { result: regexResult, timestamp: Date.now() });
  return regexResult;
}

/**
 * Parse multiple pricing descriptions in batch
 */
export async function parsePricingBatch(inputs: PricingParserInput[]): Promise<ParsedPricing[]> {
  return Promise.all(inputs.map(input => parsePricing(input)));
}

/**
 * Clear the parsing cache
 */
export function clearParsingCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; hitRate: number } {
  // In a real implementation, track hits/misses
  return {
    size: cache.size,
    hitRate: 0, // Would need to track this
  };
}

export default {
  parsePricing,
  parsePricingBatch,
  clearParsingCache,
  getCacheStats,
};
