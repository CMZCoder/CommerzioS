import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface UserSupportMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface UserSupportRequest {
  query: string;
  userContext?: {
    isAuthenticated: boolean;
    hasServices?: boolean;
    plan?: string;
  };
  conversationHistory?: UserSupportMessage[];
}

export async function getUserSupport(request: UserSupportRequest): Promise<string> {
  const systemPrompt = `You are a helpful AI customer support agent for ServeMkt, a Swiss service marketplace platform.

Your role:
- Help users navigate the platform
- Answer questions about posting services, pricing, and platform features
- Explain the different subscription plans and their benefits
- Guide users through common tasks
- Provide information about verification, reviews, and trust & safety

Platform features:
- Users can post services with images, descriptions, and flexible pricing (fixed, list, or custom text)
- Services are displayed in CHF (Swiss Francs)
- Four plans: Free (2 images, 7 days), Basic (4 images, 14 days), Premium (10 images, 30 days), Enterprise (20 images, 60 days)
- Services expire automatically but can be renewed
- Users with identity verification can review service providers
- Authentication is via Replit Auth
- Services can be saved as drafts
- Users can suggest new categories for approval

User context: ${JSON.stringify(request.userContext || {})}

Be friendly, concise, and helpful. If you don't know something, be honest and suggest they contact support or check the help center.`;

  const messages: UserSupportMessage[] = [
    { role: "system", content: systemPrompt },
    ...(request.conversationHistory || []),
    { role: "user", content: request.query },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error getting user support:", error);
    throw new Error("Failed to get AI support");
  }
}
