import demo from '../demo_data.json';

const categories = [
  { pattern: /\b(ldo|regulator|conversion)\b/i, label: 'voltage regulator', parts: ['AP2112K-3.3TRG1', 'TLV75533PDBVR', 'MCP1700T-3302E/TT'] },
  { pattern: /\b(mosfet|switching|transistor)\b/i, label: 'MOSFET', parts: ['IRLZ44NPBF', 'AO3400A', 'FQP30N06L'] },
  { pattern: /\b(op[ -]?amp|amplifier|conditioning)\b/i, label: 'operational amplifier', parts: ['OPA197IDBVR', 'MCP6002-I/SN', 'LM358DR'] },
  { pattern: /\b(microcontroller|mcu|arm|cortex|flash|stm32)\b/i, label: 'microcontroller', parts: [] },
];

export function demoReply(messages: { role: string; text: string }[]): string {
  let selected = categories[3];
  let matched = false;
  for (const message of messages) {
    if (message.role !== 'user') continue;
    const category = categories.find(item => item.pattern.test(message.text));
    if (category) { selected = category; matched = true; }
  }
  const recommendations = selected.parts.length ? selected.parts.map((name, i) => ({
    name, tier: ['Recommended', 'Good Alternative', 'Budget-Friendly'][i],
    specs: `Sample ${selected.label} candidate. Check its datasheet against your requirements.`,
    pros: ['Illustrative comparison candidate'],
    cons: ['Electrical suitability, footprint and lifecycle not verified'],
    approxPrice: 'Not checked',
  })) : demo.recommendations;
  return `Sample demo — no AI call or live search.\n\n${matched ? `Your query selected our ${selected.label} examples.` : 'This category is not in the sample catalog yet, so here are microcontroller examples.'} These are illustrative candidates, not electrically matched recommendations. Tiers are examples; price and stock are unverified. Select parts to compare and export a shortlist.\n---RECOMMENDATIONS---\n${JSON.stringify(recommendations)}\n---END---`;
}
