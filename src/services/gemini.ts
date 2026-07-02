export interface ComponentRecommendation {
  name: string;
  tier: 'Recommended' | 'Good Alternative' | 'Budget-Friendly' | 'Premium' | 'Savings';
  specs: string;
  pros: string[];
  cons: string[];
  approxPrice?: string;
  sourceUrl?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  recommendations?: ComponentRecommendation[];
}

export const chatWithMyPCB = async (messages: ChatMessage[]) => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Express API Error:", error);
    throw error;
  }
};
