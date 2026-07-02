import React from 'react';
import { Bot, User } from 'lucide-react';
import { ChatMessage as ChatMessageType, ComponentRecommendation } from '../services/gemini';
import { RecommendationCard } from './RecommendationCard';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<Props> = ({ message }) => {
  const isModel = message.role === 'model';

  // Extract recommendations from message text if they exist but aren't parsed yet
  // This is a safety layer if we don't pre-parse before state update
  let text = message.text;
  let recommendations: ComponentRecommendation[] = message.recommendations || [];

  if (isModel && !message.recommendations && text.includes('---RECOMMENDATIONS---')) {
    const parts = text.split('---RECOMMENDATIONS---');
    text = parts[0].trim();
    const jsonPart = parts[1].split('---END---')[0].trim();
    try {
      recommendations = JSON.parse(jsonPart);
    } catch (e) {
      console.error("Failed to parse recommendations JSON", e);
    }
  } else if (isModel && recommendations.length > 0) {
    // If already parsed, sanitize the text
    text = text.split('---RECOMMENDATIONS---')[0].trim();
  }

  return (
    <div className={`flex w-full ${isModel ? 'flex-col space-y-4' : 'justify-end'} mb-6`}>
      {isModel ? (
        <>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-[10px]">AI</div>
            <h2 className="text-sm font-semibold text-foreground">Analysis Complete</h2>
          </div>
          <div className="flex flex-col space-y-4 max-w-full overflow-hidden">
            <div className="prose prose-slate prose-sm transition-all text-foreground leading-relaxed font-normal">
              {text.split('\n').map((line, i) => (
                <p key={i} className="mb-3 last:mb-0">
                  {line}
                </p>
              ))}
            </div>

            {recommendations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                <AnimatePresence mode="popLayout">
                  {recommendations.map((rec, i) => (
                    <RecommendationCard key={i} recommendation={rec} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="max-w-[70%] bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-none shadow-sm">
          <p className="text-sm">{text}</p>
        </div>
      )}
    </div>
  );
};
