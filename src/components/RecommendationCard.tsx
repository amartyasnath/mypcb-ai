import React from 'react';
import { ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { ComponentRecommendation } from '../services/gemini';

interface Props {
  recommendation: ComponentRecommendation;
}

const tierConfig = {
  'Recommended': {
    color: 'border-2 border-primary bg-card shadow-md',
    badge: 'bg-primary/10 text-primary',
    label: 'RECOMMENDED'
  },
  'Good Alternative': {
    color: 'border border-border bg-card',
    badge: 'bg-secondary text-secondary-foreground',
    label: 'GOOD ALT'
  },
  'Budget-Friendly': {
    color: 'border border-border bg-card',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'BUDGET-FRIENDLY'
  },
  'Premium': {
    color: 'border border-border bg-card',
    badge: 'bg-purple-100 text-purple-700',
    label: 'UPGRADE'
  },
  'Savings': {
    color: 'border border-dashed border-border bg-card',
    badge: 'bg-orange-100 text-orange-700',
    label: 'SAVE MONEY'
  }
};

/** Only http(s) links are rendered, so a model-supplied `javascript:` URL cannot execute. */
const isSafeHttpUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const RecommendationCard: React.FC<Props> = ({ recommendation }) => {
  const config = tierConfig[recommendation.tier] || tierConfig['Recommended'];

  // Everything below is model-generated JSON, so no field is guaranteed to exist
  // or to have the expected type. Normalize before touching it.
  const name = typeof recommendation.name === 'string' && recommendation.name.trim()
    ? recommendation.name
    : 'Unnamed part';
  const specs = typeof recommendation.specs === 'string' ? recommendation.specs : '';
  const pros = Array.isArray(recommendation.pros) ? recommendation.pros : [];
  const cons = Array.isArray(recommendation.cons) ? recommendation.cons : [];
  const sourceUrl =
    typeof recommendation.sourceUrl === 'string' && isSafeHttpUrl(recommendation.sourceUrl)
      ? recommendation.sourceUrl
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col rounded-xl p-4 ${config.color} h-full`}
    >
      <div className={`text-[10px] font-bold px-2 py-1 rounded w-fit mb-3 uppercase ${config.badge}`}>
        {config.label}
      </div>

      <div className="flex justify-between items-start mb-1">
        <h3 className="text-lg font-bold text-card-foreground leading-tight break-words">{name}</h3>
      </div>

      {recommendation.approxPrice && (
        <div className="text-[10px] text-muted-foreground font-mono mb-4">
          Est. Price: {recommendation.approxPrice}
        </div>
      )}

      <ul className="text-[11px] space-y-2 text-muted-foreground mb-4 flex-1">
        {specs && (
          <li>• {specs.length > 100 ? `${specs.substring(0, 100)}...` : specs}</li>
        )}
        {pros.slice(0, 2).map((pro, i) => (
          <li key={`pro-${i}`}>• [Pro] {String(pro)}</li>
        ))}
        {cons.slice(0, 1).map((con, i) => (
          <li key={`con-${i}`}>• [Con] {String(con)}</li>
        ))}
      </ul>

      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-secondary text-secondary-foreground border border-border rounded-lg text-[10px] font-medium hover:bg-secondary/70 transition-colors"
        >
          View Supplier <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </motion.div>
  );
};
