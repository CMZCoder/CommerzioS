import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AdminAssistMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AdminAssistRequest {
  query: string;
  context?: {
    currentPage?: string;
    recentActions?: string[];
    platformStats?: any;
  };
  conversationHistory?: AdminAssistMessage[];
}

export async function getAdminAssistance(request: AdminAssistRequest): Promise<string> {
  const systemPrompt = `You are an AI assistant helping a platform administrator manage a Swiss service marketplace called ServeMkt.

Your capabilities include:
- Analyzing platform metrics and user behavior
- Suggesting improvements to user experience
- Identifying potential issues or anomalies in the data
- Providing guidance on platform operations
- Helping with decision-making on user management, service approval, and content moderation

Context about the platform:
- It's a marketplace connecting service providers with customers in Switzerland
- Users can post services with images, pricing (CHF), and contact details
- Services auto-categorize using AI and expire after a set duration based on their plan
- Users have different subscription plans (Free, Basic, Premium, Enterprise)
- The admin can manage users, services, categories, and plans

Current context: ${JSON.stringify(request.context || {})}

Be concise, professional, and action-oriented. Provide specific recommendations when possible.`;

  const messages: AdminAssistMessage[] = [
    { role: "system", content: systemPrompt },
    ...(request.conversationHistory || []),
    { role: "user", content: request.query },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error getting admin assistance:", error);
    throw new Error("Failed to get AI assistance");
  }
}

export async function analyzeplatformData(data: {
  totalUsers?: number;
  totalServices?: number;
  activeServices?: number;
  totalCategories?: number;
  recentActivity?: any[];
}): Promise<string> {
  const prompt = `Analyze this platform data and provide insights:
${JSON.stringify(data, null, 2)}

Provide:
1. Key observations about platform health
2. Potential areas of concern
3. Recommendations for improvement
4. Growth opportunities

Be specific and actionable.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a data analyst for a service marketplace platform." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return completion.choices[0]?.message?.content || "Unable to analyze data.";
  } catch (error) {
    console.error("Error analyzing platform data:", error);
    throw new Error("Failed to analyze platform data");
  }
}
