import React from 'react';
import { ChatMessage as ChatMessageType, parseModelReply } from '../services/gemini';
import { RecommendationCard } from './RecommendationCard';
import { AnimatePresence } from 'motion/react';

interface Props {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<Props> = ({ message }) => {
  const isModel = message.role === 'model';

  // User messages render verbatim. Model replies get re-parsed from raw text so
  // that history loaded out of Firestore still renders cards, falling back to
  // any recommendations that were stored alongside the message.
  const parsed = parseModelReply(message.text);
  const text = isModel ? parsed.text : message.text;
  const recommendations = isModel
    ? (message.recommendations?.length ? message.recommendations : parsed.recommendations)
    : [];

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
