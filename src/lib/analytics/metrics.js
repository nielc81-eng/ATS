/**
 * Analytics Utility Functions
 */

export function calculateConversionRate(currentStageCount, previousStageCount) {
  if (!previousStageCount || previousStageCount === 0) return '0%';
  const rate = (currentStageCount / previousStageCount) * 100;
  return `${Math.round(rate)}%`;
}

export function groupItemsByStatus(items, statusKey = 'status') {
  return items.reduce((acc, item) => {
    const status = item[statusKey] || 'Unknown';
    if (!acc[status]) acc[status] = 0;
    acc[status]++;
    return acc;
  }, {});
}

export function calculatePercentage(part, total) {
  if (!total || total === 0) return 0;
  return Math.round((part / total) * 100);
}

export function getTrendDirection(current, previous) {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'neutral';
}

export function calculateAgeInDays(dateString) {
  if (!dateString) return 0;
  const created = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
