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

const START_MARKER = '---RECOMMENDATIONS---';
const END_MARKER = '---END---';

/**
 * Splits a raw model reply into prose and structured recommendations.
 *
 * The JSON block is model-generated and therefore untrusted: it may be absent,
 * truncated, invalid JSON, or an array of the wrong shape. Anything we cannot
 * confidently read is dropped rather than surfaced, and the marker block is
 * always stripped from the prose so raw delimiters never reach the user.
 */
export const parseModelReply = (
  raw: string,
): { text: string; recommendations: ComponentRecommendation[] } => {
  if (!raw.includes(START_MARKER)) {
    return { text: raw.trim(), recommendations: [] };
  }

  const [prose, ...rest] = raw.split(START_MARKER);
  const block = rest.join(START_MARKER).split(END_MARKER)[0].trim();

  let recommendations: ComponentRecommendation[] = [];
  try {
    const parsed = JSON.parse(block);
    if (Array.isArray(parsed)) {
      recommendations = parsed.filter(
        (item): item is ComponentRecommendation =>
          item !== null && typeof item === 'object' && !Array.isArray(item),
      );
    }
  } catch {
    // A truncated or malformed block is expected occasionally; show the prose.
  }

  return { text: prose.trim(), recommendations };
};

export const chatWithMyPCB = async (messages: ChatMessage[]): Promise<{ text: string }> => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Only the fields the server needs; recommendations are re-derived from text.
    body: JSON.stringify({
      messages: messages.map(({ role, text }) => ({ role, text })),
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Request failed (${response.status} ${response.statusText})`);
  }

  return response.json();
};
