// src/services/aiService.js

export const generateSmartSuggestions = (transactions, budget) => {
  if (!transactions || transactions.length === 0) return "No data yet. Start adding transactions to get smart insights!";

  let totalSpent = 0;
  const categories = {};

  transactions.forEach(t => {
    if (t.type === 'expense') {
      totalSpent += t.amount;
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    }
  });

  const sortedCategories = Object.keys(categories).sort((a, b) => categories[b] - categories[a]);
  const topCategory = sortedCategories[0];
  
  if (budget && totalSpent > budget) {
    return `⚠️ You're over budget by $${(totalSpent - budget).toFixed(2)}. Consider cutting down on ${topCategory} expenses to balance your finances.`;
  }
  
  if (topCategory && categories[topCategory] > totalSpent * 0.4) {
    return `💡 You spend a large chunk (${Math.round((categories[topCategory]/totalSpent)*100)}%) of your money on ${topCategory}. Setting a strict limit here could boost your savings!`;
  }

  return "✅ You're doing great! Your spending is well balanced across categories.";
};
