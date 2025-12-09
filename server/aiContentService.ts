import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeImagesForHashtags(imageUrls: string[]): Promise<string[]> {
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }

  try {
    const imageContents = imageUrls.slice(0, 3).map(url => ({
      type: "image_url" as const,
      image_url: { url }
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze these images and suggest up to 5 relevant hashtags for a Swiss service marketplace. Focus on the service type, industry, and key features visible. Return only the hashtags as a comma-separated list without the # symbol. Examples: plumbing, renovation, bathroom"
            },
            ...imageContents
          ]
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "";
    const hashtags = content
      .split(/[,\n]/)
      .map(tag => tag.trim().toLowerCase().replace(/^#/, ''))
      .filter(tag => tag.length > 0)
      .slice(0, 5);

    return hashtags;
  } catch (error) {
    console.error("Error analyzing images for hashtags:", error);
    return [];
  }
}

export async function generateServiceTitle(images: string[], currentTitle?: string): Promise<string> {
  if (!images || images.length === 0) {
    return currentTitle || "Professional Service";
  }

  try {
    const imageContents = images.slice(0, 2).map(url => ({
      type: "image_url" as const,
      image_url: { url }
    }));

    const contextText = currentTitle
      ? `Current title: "${currentTitle}". Suggest an improved version or keep it if already good.`
      : "Suggest a professional service title.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze these images and suggest a professional service title for a Swiss marketplace. ${contextText} Keep it concise (max 200 characters), professional, and descriptive. Return only the title, no explanation.`
            },
            ...imageContents
          ]
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const title = response.choices[0]?.message?.content?.trim() || currentTitle || "Professional Service";
    return title.substring(0, 200);
  } catch (error) {
    console.error("Error generating service title:", error);
    return currentTitle || "Professional Service";
  }
}

export async function generateServiceDescription(
  images: string[],
  title: string,
  category?: string
): Promise<string> {
  if (!images || images.length === 0) {
    return "Professional service available.";
  }

  try {
    const imageContents = images.slice(0, 3).map(url => ({
      type: "image_url" as const,
      image_url: { url }
    }));

    const categoryContext = category ? `Category: ${category}` : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze these images and generate a professional service description for a Swiss marketplace.
              
Service Title: ${title}
${categoryContext}

Generate a detailed, professional description (50-500 words) that:
- Describes the service based on what you see in the images
- Highlights key features and benefits
- Uses professional language suitable for Switzerland (English or German)
- Focuses on quality and expertise
- Is formatted in clear paragraphs

Return only the description, no additional commentary.`
            },
            ...imageContents
          ]
        }
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const description = response.choices[0]?.message?.content?.trim() || "Professional service available.";
    return description;
  } catch (error) {
    console.error("Error generating service description:", error);
    return "Professional service available. Contact us for more details.";
  }
}

export async function generatePricingSuggestion(
  images: string[],
  title: string,
  description: string,
  category?: string
): Promise<{ type: string; price?: string; priceText?: string }> {
  try {
    const imageContents = images.slice(0, 2).map(url => ({
      type: "image_url" as const,
      image_url: { url }
    }));

    const categoryContext = category ? `Category: ${category}` : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this service and suggest appropriate pricing for the Swiss market (CHF).

Service Title: ${title}
Description: ${description}
${categoryContext}

Based on the images and service details, suggest:
1. Pricing type: "fixed" (single price), "list" (price list for different options), or "text" (custom pricing description)
2. For fixed pricing: suggest a reasonable CHF price range (e.g., "150-200")
3. For list pricing: suggest price points
4. For text pricing: suggest pricing description

Return JSON format:
{
  "type": "fixed" | "list" | "text",
  "price": "price range for fixed, e.g., 150-200",
  "priceText": "pricing description"
}

Consider Swiss market rates and service complexity.`
            },
            ...imageContents
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");

    return {
      type: result.type || "text",
      price: result.price,
      priceText: result.priceText || "Contact for pricing"
    };
  } catch (error) {
    console.error("Error generating pricing suggestion:", error);
    return {
      type: "text",
      priceText: "Contact for pricing"
    };
  }
}

export async function filterProfanity(
  text: string
): Promise<{ isClean: boolean; filtered: string; issues: string[] }> {
  if (!text || text.trim().length === 0) {
    return { isClean: true, filtered: text, issues: [] };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a content moderation AI for a Swiss service marketplace. Detect and filter:
1. Explicit sexual content
2. Hate speech and slurs
3. Scam patterns: "100% guaranteed", "money back no questions", "get rich quick", "make money fast", "too good to be true"
4. Suspicious contact information in inappropriate contexts
5. Discriminatory language
6. Threats or violence

Analyze the text and return JSON:
{
  "isClean": boolean,
  "filtered": "sanitized version with blocked words replaced with [removed]",
  "issues": ["list of specific issues found"]
}

Be strict but fair. Swiss marketplace context - multiple languages are normal.`
        },
        {
          role: "user",
          content: `Analyze this text:\n\n${text}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");

    return {
      isClean: result.isClean ?? true,
      filtered: result.filtered || text,
      issues: result.issues || []
    };
  } catch (error) {
    console.error("Error filtering profanity:", error);
    return {
      isClean: true,
      filtered: text,
      issues: ["Unable to verify content - please review manually"]
    };
  }
}

export interface AISuggestAllResult {
  title: string;
  description: string;
  categorySlug: string;
  subcategorySlug: string | null;
  hashtags: string[];
  confidence: number;
}

export async function suggestAllFields(
  imageUrls: string[],
  currentTitle?: string
): Promise<AISuggestAllResult> {
  if (!imageUrls || imageUrls.length === 0) {
    throw new Error("At least one image is required for AI suggestions");
  }

  try {
    const imageContents = imageUrls.slice(0, 3).map(url => ({
      type: "image_url" as const,
      image_url: { url }
    }));

    const categoriesAndSubcategories = `
**Available Categories and Subcategories:**

1. home-services (Home Services)
   - cleaning-housekeeping, plumbing-electrical, painting-renovation, garden-landscaping, moving-delivery, handyman

2. design-creative (Design & Creative)
   - logo-branding, web-app-design, graphic-design, photography, video-production, interior-design

3. education (Education & Tutoring)
   - language-lessons, math-science, music-lessons, exam-prep, adult-education, children-tutoring

4. wellness (Wellness & Fitness)
   - personal-training, yoga-pilates, massage-therapy, nutrition-coaching, mental-health

5. business (Business Support)
   - bookkeeping-accounting, consulting-strategy, marketing-seo, translation-writing, hr-recruitment

6. automotive (Automotive Services)
   - repair-maintenance, car-detailing, tire-services, pre-purchase-inspection, mobile-mechanics

7. pets (Pet Care & Animals)
   - dog-walking, pet-grooming, veterinary-care, pet-sitting-boarding, training-behavior

8. events (Events & Entertainment)
   - event-photo-video, catering, dj-music, event-planning, entertainment-performers

9. legal-financial (Legal & Financial)
   - legal-consulting, immigration-permits, financial-planning, tax-preparation, notary-services

10. technology (Technology & IT)
    - computer-repair, software-development, network-security, website-maintenance, cloud-devops
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for a Swiss service marketplace. Analyze service images and generate complete service listing details. Always respond in valid JSON format.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze these service images and generate a complete listing with ALL of the following:

1. **Title**: A professional, concise title (max 100 chars) describing the service
2. **Description**: A detailed, professional description (100-300 words) highlighting features and benefits
3. **Category**: The most appropriate category slug from the list below
4. **Subcategory**: ALWAYS provide a subcategory slug. If one from the list fits well, use it. If not, CREATE a new descriptive subcategory slug (lowercase-with-dashes format, e.g., "accordion-lessons", "pet-photography", "custom-tailoring")
5. **Hashtags**: Up to 5 relevant hashtags (without # symbol) for discoverability

IMPORTANT: You MUST always provide a subcategorySlug - never return null. Create a descriptive new subcategory if needed.

${currentTitle ? `Current title hint: "${currentTitle}"` : ''}

${categoriesAndSubcategories}

Return a JSON object with this exact structure:
{
  "title": "Professional service title here",
  "description": "Detailed description here...",
  "categorySlug": "category-slug",
  "subcategorySlug": "subcategory-slug (REQUIRED - create one if needed)",
  "hashtags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85
}`
            },
            ...imageContents
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content);

    return {
      title: (result.title || "Professional Service").substring(0, 200),
      description: result.description || "Professional service available. Contact for more details.",
      categorySlug: result.categorySlug || "home-services",
      subcategorySlug: result.subcategorySlug || null,
      hashtags: Array.isArray(result.hashtags)
        ? result.hashtags.map((t: string) => t.toLowerCase().replace(/^#/, '').trim()).filter(Boolean).slice(0, 5)
        : [],
      confidence: result.confidence || 0.7,
    };
  } catch (error) {
    console.error("Error in suggestAllFields:", error);
    throw new Error("Failed to generate AI suggestions");
  }
}
