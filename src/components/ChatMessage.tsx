import React, { useState } from 'react';
import { exportBOM } from '../utils/exportBOM';
import { ChatMessage as ChatMessageType, parseModelReply } from '../services/chat';
import { RecommendationCard } from './RecommendationCard';
import { AnimatePresence } from 'motion/react';

interface Props {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<Props> = ({ message }) => {
  const [selected, setSelected] = useState<number[]>([]);
  const [exportError, setExportError] = useState('');
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
                    <div key={i} className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer py-2">
                        <input type="checkbox" checked={selected.includes(i)} onChange={() => setSelected(current => current.includes(i) ? current.filter(index => index !== i) : [...current, i])} className="accent-primary h-4 w-4" />
                        Compare {typeof rec.name === 'string' ? rec.name : 'part'}
                      </label>
                      <RecommendationCard recommendation={rec} />
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            {selected.length > 0 && (
              <section className="rounded-xl border border-border bg-card p-4" aria-label="Selected part comparison">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h3 className="font-heading font-bold">Your shortlist ({selected.length})</h3>
                  <button className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm" onClick={() => {
                    setExportError('');
                    exportBOM(selected.map(i => recommendations[i]).filter(Boolean)).catch(() => setExportError('Export failed. Please try again.'));
                  }}>Export selected BOM</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead><tr className="border-b border-border"><th className="p-2">Part</th><th className="p-2">Specs</th><th className="p-2">Price</th><th className="p-2">Limitations</th></tr></thead>
                    <tbody>{selected.filter(i => recommendations[i]).map(i => {
                      const rec = recommendations[i];
                      return <tr key={i} className="border-b border-border"><td className="p-2 font-medium">{String(rec.name || 'Unnamed')}</td><td className="p-2">{String(rec.specs || '')}</td><td className="p-2 whitespace-nowrap">{String(rec.approxPrice || 'Not checked')}</td><td className="p-2">{Array.isArray(rec.cons) ? rec.cons.map(String).join('; ') : ''}</td></tr>;
                    })}</tbody>
                  </table>
                </div>
                {exportError && <p role="alert" className="text-sm mt-2">{exportError}</p>}
              </section>
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
