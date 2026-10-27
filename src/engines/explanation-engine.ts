import type { Explanation, Recommendation } from '../types/index.js';

/**
 * Explanation Engine
 * Every recommendation gets a full explainability layer.
 */

export function generateExplanation(rec: Recommendation): Explanation {
  return {
    recommendationId: rec.id,
    why: rec.reason,
    whyBn: rec.reasonBn,
    dataUsed: rec.evidence,
    confidence: rec.confidence,
    confidenceReason: generateConfidenceReason(rec.confidence),
    confidenceReasonBn: generateConfidenceReasonBn(rec.confidence),
    alternativeActions: rec.alternativeActions,
    expectedOutcome: rec.expectedOutcome,
    expectedOutcomeBn: rec.expectedOutcomeBn,
    whatIfIgnored: rec.ignoreConsequence,
    whatIfIgnoredBn: rec.ignoreConsequenceBn,
  };
}

function generateConfidenceReason(confidence: number): string {
  if (confidence >= 90) return 'Based on comprehensive real-time weather data, validated crop models, and historical patterns with strong correlation.';
  if (confidence >= 80) return 'Based on current weather observations and established agricultural science with minor uncertainty in long-range forecast.';
  if (confidence >= 70) return 'Based on current weather data and crop growth models with moderate uncertainty in extended forecast period.';
  return 'Based on available weather data with significant uncertainty. Conditions may change. Monitor closely.';
}

function generateConfidenceReasonBn(confidence: number): string {
  if (confidence >= 90) return 'ব্যাপক রিয়েল-টাইম আবহাওয়া তথ্য, যাচাইকৃত ফসল মডেল এবং শক্তিশালী সম্পর্কযুক্ত ঐতিহাসিক প্যাটার্নের উপর ভিত্তি করে।';
  if (confidence >= 80) return 'বর্তমান আবহাওয়া পর্যবেক্ষণ এবং প্রতিষ্ঠিত কৃষি বিজ্ঞানের উপর ভিত্তি করে, দীর্ঘমেয়াদী পূর্বাভাসে সামান্য অনিশ্চয়তা সহ।';
  if (confidence >= 70) return 'বর্তমান আবহাওয়া তথ্য এবং ফসল বৃদ্ধি মডেলের উপর ভিত্তি করে, বর্ধিত পূর্বাভাস সময়ে মাঝারি অনিশ্চয়তা সহ।';
  return 'উপলব্ধ আবহাওয়া তথ্যের উপর ভিত্তি করে যা উল্লেখযোগ্য অনিশ্চয়তা বহন করে। পরিস্থিতি পরিবর্তন হতে পারে। ঘনিষ্ঠভাবে পর্যবেক্ষণ করুন।';
}

export function formatExplanationForAI(explanation: Explanation, lang: 'en' | 'bn' = 'en'): string {
  const isBn = lang === 'bn';
  return [
    `**${isBn ? 'কেন?' : 'Why?'}** ${isBn ? explanation.whyBn : explanation.why}`,
    `**${isBn ? 'প্রমাণ' : 'Data Used'}:** ${explanation.dataUsed.map(d => `• ${d}`).join('\n')}`,
    `**${isBn ? 'আত্মবিশ্বাস' : 'Confidence'}:** ${explanation.confidence}% — ${isBn ? explanation.confidenceReasonBn : explanation.confidenceReason}`,
    `**${isBn ? 'প্রত্যাশিত ফলাফল' : 'Expected Outcome'}:** ${isBn ? explanation.expectedOutcomeBn : explanation.expectedOutcome}`,
    `**${isBn ? 'উপেক্ষা করলে কী হবে?' : 'What if Ignored?'}:** ${isBn ? explanation.whatIfIgnoredBn : explanation.whatIfIgnored}`,
    explanation.alternativeActions.length > 0
      ? `**${isBn ? 'বিকল্প পদক্ষেপ' : 'Alternatives'}:** ${explanation.alternativeActions.map(a => `• ${isBn ? a.actionBn : a.action} (${a.effectiveness}%)`).join('\n')}`
      : '',
  ].filter(Boolean).join('\n\n');
}