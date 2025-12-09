import OpenAI from "openai";
import { storage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CategoryValidationResult {
  isValid: boolean;
  suggestedName?: string;
  reasoning: string;
  confidence: number;
  existingCategoryId?: string;
  existingCategoryName?: string;
  suggestedSubcategoryId?: string;
  suggestedSubcategoryName?: string;
}

export async function validateCategoryName(categoryName: string, description?: string): Promise<CategoryValidationResult> {
  // First, get all existing categories and subcategories
  const allCategories = await storage.getCategories();
  const allSubcategories = await storage.getSubcategories();

  // Build a list of existing category/subcategory names for the AI
  const existingCategoriesStr = allCategories.map(c => `- ${c.name} (id: ${c.id})`).join('\\n');
  const existingSubcategoriesStr = allSubcategories.map(s => {
    const parent = allCategories.find(c => c.id === s.categoryId);
    return `- ${s.name} (id: ${s.id}, parent: ${parent?.name || 'unknown'})`;
  }).join('\\n');

  // Check for fuzzy match first
  const fuzzyMatch = findSimilarCategoryName(categoryName, allCategories);
  const fuzzySubcategoryMatch = findSimilarSubcategoryName(categoryName, allSubcategories, allCategories);

  const prompt = `Evaluate if this category name makes sense for a Swiss service marketplace.
The user wants to create a NEW category named: "${categoryName}"
${description ? `Description: "${description}"` : ''}

**Existing Categories:**
${existingCategoriesStr}

**Existing Subcategories:**
${existingSubcategoriesStr}

${fuzzyMatch.similarity > 0.7 ? `
**IMPORTANT:** A similar category "${fuzzyMatch.category?.name}" already exists with ${Math.round(fuzzyMatch.similarity * 100)}% similarity!
` : ''}

${fuzzySubcategoryMatch.similarity > 0.7 ? `
**IMPORTANT:** A similar subcategory "${fuzzySubcategoryMatch.subcategory?.name}" already exists with ${Math.round(fuzzySubcategoryMatch.similarity * 100)}% similarity!
` : ''}

Analyze:
1. Does an existing category or subcategory ALREADY COVER this use case? If so, return that existing one instead.
2. Is the proposed name too similar to an existing category/subcategory? (DJ & Music vs dj-music)
3. Is this a clear, professional category name?
4. Would it be useful for a service marketplace?

CRITICAL: If the user's category is essentially the same as an existing one (even with slight wording differences), you MUST reject it and point to the existing category/subcategory.

Respond in JSON format:
{
  "isValid": false if similar exists or invalid, true only if truly new and valid,
  "existingCategoryId": "string - ID of existing category if one matches (even partially)",
  "existingCategoryName": "string - name of existing category if one matches",
  "existingSubcategoryId": "string - ID of existing subcategory if one matches",
  "existingSubcategoryName": "string - name of existing subcategory if one matches",
  "suggestedName": "string (better alternative if proposed name is not optimal)",
  "reasoning": "string explaining your decision",
  "confidence": number (0-1)
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a category validation AI for a service marketplace. Be VERY strict about preventing duplicate categories. If anything similar exists, reject the new category and point to the existing one. The goal is to maintain a clean, well-organized category structure.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 500,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

    return {
      isValid: result.isValid || false,
      suggestedName: result.suggestedName,
      reasoning: result.reasoning || "Unable to validate category",
      confidence: result.confidence || 0,
      existingCategoryId: result.existingCategoryId,
      existingCategoryName: result.existingCategoryName,
      suggestedSubcategoryId: result.existingSubcategoryId,
      suggestedSubcategoryName: result.existingSubcategoryName,
    };
  } catch (error) {
    console.error("Error validating category:", error);

    // If AI fails, still check for obvious matches
    if (fuzzyMatch.similarity > 0.85 && fuzzyMatch.category) {
      return {
        isValid: false,
        reasoning: `A very similar category "${fuzzyMatch.category.name}" already exists.`,
        confidence: fuzzyMatch.similarity,
        existingCategoryId: fuzzyMatch.category.id,
        existingCategoryName: fuzzyMatch.category.name,
      };
    }

    return {
      isValid: false,
      reasoning: "Failed to validate category. Please submit for admin review.",
      confidence: 0,
    };
  }
}

export async function suggestCategoryAlternative(categoryName: string, userFeedback?: string): Promise<string> {
  const prompt = `The user suggested a category name: "${categoryName}"
${userFeedback ? `User feedback: "${userFeedback}"` : ''}

Suggest 3 alternative professional category names that would work better for a Swiss service marketplace.
Keep them concise, clear, and professional.

Format as a conversational response suggesting the alternatives.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant suggesting better category names.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return completion.choices[0]?.message?.content || "I couldn't generate suggestions. Please try a different name.";
  } catch (error) {
    console.error("Error suggesting alternative:", error);
    return "I'm having trouble generating suggestions. Please try again or submit your category for admin review.";
  }
}

// Check if a category already exists (fuzzy matching)
export function findSimilarCategoryName(categoryName: string, existingCategories: Array<{ name: string; id: string }>): { category: { name: string; id: string } | null; similarity: number } {
  const normalize = (str: string) => str.toLowerCase().trim().replace(/[&,]/g, '').replace(/\s+/g, ' ');
  const normalizedInput = normalize(categoryName);

  let bestMatch: { category: { name: string; id: string } | null; similarity: number } = {
    category: null,
    similarity: 0
  };

  for (const existing of existingCategories) {
    const normalizedExisting = normalize(existing.name);

    // Exact match after normalization
    if (normalizedInput === normalizedExisting) {
      return { category: existing, similarity: 1.0 };
    }

    // Strong substring match - catches "Childcare Parenting" vs "Childcare Parenting Services"
    const inputWords = normalizedInput.split(' ').filter(w => w.length > 2);
    const existingWords = normalizedExisting.split(' ').filter(w => w.length > 2);

    // Check if one contains most of the other's significant words
    const commonWords = inputWords.filter(w => existingWords.includes(w));
    const minWords = Math.min(inputWords.length, existingWords.length);
    const wordSimilarity = minWords > 0 ? commonWords.length / minWords : 0;

    if (wordSimilarity >= 0.8) {
      // Very high word overlap - these are likely the same category
      return { category: existing, similarity: 0.95 };
    }

    // Regular substring match
    if (normalizedInput.includes(normalizedExisting) || normalizedExisting.includes(normalizedInput)) {
      if (bestMatch.similarity < 0.85) {
        bestMatch = { category: existing, similarity: 0.85 };
      }
      continue;
    }

    // Levenshtein distance for fuzzy matching
    const distance = levenshteinDistance(normalizedInput, normalizedExisting);
    const maxLen = Math.max(normalizedInput.length, normalizedExisting.length);
    const similarity = 1 - (distance / maxLen);

    if (similarity > 0.75 && similarity > bestMatch.similarity) {
      bestMatch = { category: existing, similarity };
    }
  }

  return bestMatch;
}

// Check if a subcategory already exists (fuzzy matching)
export function findSimilarSubcategoryName(
  name: string,
  existingSubcategories: Array<{ name: string; id: string; categoryId: string }>,
  existingCategories: Array<{ name: string; id: string }>
): { subcategory: { name: string; id: string; categoryId: string; categoryName?: string } | null; similarity: number } {
  const normalize = (str: string) => str.toLowerCase().trim().replace(/[&,]/g, '').replace(/\s+/g, ' ');
  const normalizedInput = normalize(name);

  let bestMatch: { subcategory: { name: string; id: string; categoryId: string; categoryName?: string } | null; similarity: number } = {
    subcategory: null,
    similarity: 0
  };

  for (const existing of existingSubcategories) {
    const normalizedExisting = normalize(existing.name);

    // Exact match after normalization
    if (normalizedInput === normalizedExisting) {
      const parentCat = existingCategories.find(c => c.id === existing.categoryId);
      return {
        subcategory: { ...existing, categoryName: parentCat?.name },
        similarity: 1.0
      };
    }

    // Word-based similarity
    const inputWords = normalizedInput.split(' ').filter(w => w.length > 2);
    const existingWords = normalizedExisting.split(' ').filter(w => w.length > 2);
    const commonWords = inputWords.filter(w => existingWords.includes(w));
    const minWords = Math.min(inputWords.length, existingWords.length);
    const wordSimilarity = minWords > 0 ? commonWords.length / minWords : 0;

    if (wordSimilarity >= 0.8) {
      const parentCat = existingCategories.find(c => c.id === existing.categoryId);
      return {
        subcategory: { ...existing, categoryName: parentCat?.name },
        similarity: 0.95
      };
    }

    // Levenshtein distance
    const distance = levenshteinDistance(normalizedInput, normalizedExisting);
    const maxLen = Math.max(normalizedInput.length, normalizedExisting.length);
    const similarity = 1 - (distance / maxLen);

    if (similarity > 0.75 && similarity > bestMatch.similarity) {
      const parentCat = existingCategories.find(c => c.id === existing.categoryId);
      bestMatch = {
        subcategory: { ...existing, categoryName: parentCat?.name },
        similarity
      };
    }
  }

  return bestMatch;
}

// Simple Levenshtein distance implementation
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

export interface CategorySubcategorySuggestion {
  categorySlug: string;
  subcategoryId: string | null;
  confidence: number;
}

export async function suggestCategoryAndSubcategory(
  title: string,
  description: string,
  imageUrls?: string[]
): Promise<CategorySubcategorySuggestion> {
  const categoriesAndSubcategories = `
**Categories and their Subcategories:**

1. home-services (Home Services)
   - cleaning-housekeeping (Cleaning & Housekeeping)
   - plumbing-electrical (Plumbing & Electrical)
   - painting-renovation (Painting & Renovation)
   - garden-landscaping (Garden & Landscaping)
   - moving-delivery (Moving & Delivery)
   - handyman (Handyman Services)

2. design-creative (Design & Creative)
   - logo-branding (Logo & Branding)
   - web-app-design (Web & App Design)
   - graphic-design (Graphic Design)
   - photography (Photography)
   - video-production (Video Production)
   - interior-design (Interior Design)

3. education (Education & Tutoring)
   - language-lessons (Language Lessons)
   - math-science (Math & Science)
   - music-lessons (Music Lessons)
   - exam-prep (Exam Preparation)
   - adult-education (Adult Education)
   - children-tutoring (Children's Tutoring)

4. wellness (Wellness & Fitness)
   - personal-training (Personal Training)
   - yoga-pilates (Yoga & Pilates)
   - massage-therapy (Massage Therapy)
   - nutrition-coaching (Nutrition & Coaching)
   - mental-health (Mental Health Support)

5. business (Business Support)
   - bookkeeping-accounting (Bookkeeping & Accounting)
   - consulting-strategy (Consulting & Strategy)
   - marketing-seo (Marketing & SEO)
   - translation-writing (Translation & Writing)
   - hr-recruitment (HR & Recruitment)

6. automotive (Automotive Services)
   - repair-maintenance (Repair & Maintenance)
   - car-detailing (Car Detailing & Cleaning)
   - tire-services (Tire Services)
   - pre-purchase-inspection (Pre-Purchase Inspection)
   - mobile-mechanics (Mobile Mechanics)

7. pets (Pet Care & Animals)
   - dog-walking (Dog Walking)
   - pet-grooming (Pet Grooming)
   - veterinary-care (Veterinary Care)
   - pet-sitting-boarding (Pet Sitting & Boarding)
   - training-behavior (Training & Behavior)

8. events (Events & Entertainment)
   - event-photo-video (Photography & Video)
   - catering (Catering)
   - dj-music (DJ & Music)
   - event-planning (Event Planning)
   - entertainment-performers (Entertainment & Performers)

9. legal-financial (Legal & Financial)
   - legal-consulting (Legal Consulting)
   - immigration-permits (Immigration & Work Permits)
   - financial-planning (Financial Planning)
   - tax-preparation (Tax Preparation)
   - notary-services (Notary Services)

10. technology (Technology & IT)
    - computer-repair (Computer Repair)
    - software-development (Software Development)
    - network-security (Network & Security)
    - website-maintenance (Website Maintenance)
    - cloud-devops (Cloud & DevOps)
`;

  const prompt = `Analyze this service listing and suggest the most appropriate category and subcategory:

Title: "${title}"
Description: "${description}"
${imageUrls && imageUrls.length > 0 ? `Number of images: ${imageUrls.length}` : ''}

${categoriesAndSubcategories}

Instructions:
1. Choose the MOST SPECIFIC category slug that matches this service
2. If a subcategory is a very close match (confidence > 0.85), include the subcategory SLUG
3. If no subcategory is a strong match, set subcategoryId to null
4. Provide a confidence score (0-1) for your overall categorization

Examples:
- "Piano lessons for children" → {"categorySlug": "education", "subcategoryId": "music-lessons", "confidence": 0.95}
- "Home cleaning service" → {"categorySlug": "home-services", "subcategoryId": "cleaning-housekeeping", "confidence": 0.9}
- "Dog walking in Zurich" → {"categorySlug": "pets", "subcategoryId": "dog-walking", "confidence": 0.95}
- "General handyman work" → {"categorySlug": "home-services", "subcategoryId": "handyman", "confidence": 0.85}

Respond in JSON format:
{
  "categorySlug": "string",
  "subcategoryId": "string or null",
  "confidence": number
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI that categorizes service listings. Be precise and only suggest subcategories when there's a strong match (confidence > 0.85). Use the exact slugs provided.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 200,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

    return {
      categorySlug: result.categorySlug || "home-services",
      subcategoryId: result.confidence > 0.85 ? result.subcategoryId : null,
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error("Error suggesting category and subcategory:", error);
    return {
      categorySlug: "home-services",
      subcategoryId: null,
      confidence: 0,
    };
  }
}
