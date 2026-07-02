import React from 'react';
import { ExternalLink, CheckCircle2, AlertCircle, TrendingUp, Wallet, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { ComponentRecommendation } from '../services/gemini';

interface Props {
  recommendation: ComponentRecommendation;
}

const tierConfig = {
  'Recommended': {
    color: 'border-2 border-blue-500 bg-white shadow-md',
    badge: 'bg-blue-100 text-blue-700',
    label: 'RECOMMENDED'
  },
  'Good Alternative': {
    color: 'border border-slate-200 bg-white',
    badge: 'bg-slate-100 text-slate-700',
    label: 'GOOD ALT'
  },
  'Budget-Friendly': {
    color: 'border border-slate-200 bg-white',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'BUDGET-FRIENDLY'
  },
  'Premium': {
    color: 'border border-slate-200 bg-white',
    badge: 'bg-purple-100 text-purple-700',
    label: 'UPGRADE'
  },
  'Savings': {
    color: 'border border-slate-200 bg-white border-dashed',
    badge: 'bg-orange-100 text-orange-700',
    label: 'SAVE MONEY'
  }
};

export const RecommendationCard: React.FC<Props> = ({ recommendation }) => {
  const config = tierConfig[recommendation.tier] || tierConfig['Recommended'];

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
        <h3 className="text-lg font-bold text-slate-800 leading-tight">{recommendation.name}</h3>
      </div>
      
      {recommendation.approxPrice && (
        <div className="text-[10px] text-slate-400 font-mono mb-4">
          Est. Price: {recommendation.approxPrice}
        </div>
      )}

      <ul className="text-[11px] space-y-2 text-slate-600 mb-4 flex-1">
        <li>• {recommendation.specs.substring(0, 100)}{recommendation.specs.length > 100 ? '...' : ''}</li>
        {recommendation.pros.slice(0, 2).map((pro, i) => (
          <li key={i}>• [Pro] {pro}</li>
        ))}
        {recommendation.cons.slice(0, 1).map((con, i) => (
          <li key={i}>• [Con] {con}</li>
        ))}
      </ul>

      {recommendation.sourceUrl && (
        <a
          href={recommendation.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-medium hover:bg-slate-100 transition-colors"
        >
          View Supplier <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </motion.div>
  );
};
