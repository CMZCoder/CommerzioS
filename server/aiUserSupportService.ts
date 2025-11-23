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
  pageContext?: {
    currentPage: string;
    currentAction: string;
    formData?: {
      hasTitle?: boolean;
      hasDescription?: boolean;
      hasCategory?: boolean;
      hasImages?: boolean;
      hasLocation?: boolean;
      hasContact?: boolean;
      hasPrice?: boolean;
      imageCount?: number;
    };
  };
  conversationHistory?: UserSupportMessage[];
}

export async function getUserSupport(request: UserSupportRequest): Promise<string> {
  // Build context-aware system prompt
  let contextualGuidance = "";
  
  if (request.pageContext) {
    const { currentAction, formData } = request.pageContext;
    
    if (currentAction === "creating_service" && formData) {
      contextualGuidance = `\n\nCurrent Context: The user is creating a new service listing.
Form Progress:
- Title: ${formData.hasTitle ? "✓ Filled" : "✗ Not filled"}
- Description: ${formData.hasDescription ? "✓ Filled" : "✗ Not filled"}
- Category: ${formData.hasCategory ? "✓ Selected" : "✗ Not selected"}
- Images: ${formData.hasImages ? `✓ Uploaded (${formData.imageCount || 0} images)` : "✗ No images"}
- Location: ${formData.hasLocation ? "✓ Added" : "✗ Not added"}
- Contact: ${formData.hasContact ? "✓ Added" : "✗ Not added"}
- Pricing: ${formData.hasPrice ? "✓ Set" : "✗ Not set"}

Provide specific, actionable guidance for creating a service listing. Focus on:
- If they haven't filled the title: Suggest creating a clear, descriptive title
- If they haven't filled the description: Offer to help write an engaging description
- If they haven't uploaded images: Emphasize importance of quality images
- If they haven't set pricing: Guide them on Swiss market rates and pricing strategies
- If they're missing required fields: Politely remind them what's needed

Be proactive and specific in your help.`;
    } else if (currentAction === "editing_service") {
      contextualGuidance = `\n\nCurrent Context: The user is editing an existing service.
Provide guidance on:
- Improving service descriptions to attract more customers
- Optimizing pricing strategies
- Adding or updating images for better visibility
- Updating contact information or locations
Be constructive and focus on improvements.`;
    } else if (currentAction === "viewing_service") {
      contextualGuidance = `\n\nCurrent Context: The user is viewing a service detail page.
Help them with:
- How to contact the service provider
- Understanding the pricing and service details
- How to leave reviews (if verified)
- How to save services as favorites
Encourage engagement and clear next steps.`;
    } else if (currentAction === "browsing") {
      contextualGuidance = `\n\nCurrent Context: The user is browsing the marketplace.
Help them with:
- Finding services using search and filters
- Understanding different categories
- How to create their own service listing
- Navigating the platform effectively`;
    }
  }

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

User context: ${JSON.stringify(request.userContext || {})}${contextualGuidance}

Be friendly, concise, and helpful. If you don't know something, be honest and suggest they contact support or check the help center. Always provide specific, actionable advice based on the user's current context.`;

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
