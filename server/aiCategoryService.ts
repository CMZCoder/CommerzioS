import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CategoryValidationResult {
  isValid: boolean;
  suggestedName?: string;
  reasoning: string;
  confidence: number;
}

export async function validateCategoryName(categoryName: string, description?: string): Promise<CategoryValidationResult> {
  const prompt = `Evaluate if this category name makes sense for a Swiss service marketplace:
Category Name: "${categoryName}"
${description ? `Description: "${description}"` : ''}

Existing categories: Home Services, Design & Creative, Education & Tutoring, Wellness & Fitness, Business Support

Analyze:
1. Is this a clear, professional category name?
2. Is it distinct from existing categories?
3. Would it be useful for a service marketplace?
4. Is it in appropriate language (English, German, French, or Italian)?

If the name is problematic, suggest a better alternative.

Respond in JSON format:
{
  "isValid": boolean,
  "suggestedName": "string (only if not valid)",
  "reasoning": "string",
  "confidence": number (0-1)
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a category validation AI for a service marketplace. Be strict but fair in your validation.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 300,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return {
      isValid: result.isValid || false,
      suggestedName: result.suggestedName,
      reasoning: result.reasoning || "Unable to validate category",
      confidence: result.confidence || 0,
    };
  } catch (error) {
    console.error("Error validating category:", error);
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
