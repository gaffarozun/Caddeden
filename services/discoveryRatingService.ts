import { Business } from './types';
import { getOpenStatus } from './businessStatus';
export type DiscoveryRatingSort = 'recommended' | 'highest' | 'lowest';
export const discoveryRatingSorts = [
  { id: 'recommended', label: 'Önerilen' },
  { id: 'highest', label: 'En yüksek puan' },
  { id: 'lowest', label: 'En düşük puan' },
] as const;
export function sortDiscoveryBusinesses(items: Business[], sort: DiscoveryRatingSort): Business[] {
  return [...items].sort((first, second) => {
    if (sort === 'recommended') return Number(getOpenStatus(second).open) - Number(getOpenStatus(first).open);
    // Demo scores are not user votes. Rated real businesses lead; unrated ones follow; demos are last.
    const tier = (item: Business) => /^[0-9a-f-]{36}$/i.test(item.id) ? item.reviewCount > 0 ? 0 : 1 : 2;
    const rankDifference = tier(first) - tier(second);
    if (rankDifference) return rankDifference;
    if (tier(first) === 0) {
      const ratingDifference = sort === 'highest' ? second.rating - first.rating : first.rating - second.rating;
      if (ratingDifference) return ratingDifference;
      if (second.reviewCount !== first.reviewCount) return second.reviewCount - first.reviewCount;
    }
    return first.name.localeCompare(second.name, 'tr');
  });
}
