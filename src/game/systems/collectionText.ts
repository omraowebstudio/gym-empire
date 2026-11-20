import { ACHIEVEMENT_MAP } from '../config/achievements';
import { COMPETITION_TIERS, COMPETITION_TYPE_MAP } from '../config/competitions';
import type { Unlock } from '../config/items';
import { PRODUCT_MAP } from '../config/products';
import { EVENT_MAP } from '../config/rewards';

/** Transparent, human-readable unlock requirement for any collectible. */
export function unlockText(u: Unlock): string {
  switch (u.kind) {
    case 'default': return 'Starter item';
    case 'level': return `Reach player level ${u.level}`;
    case 'gems': return `Buy for ${u.cost} gems`;
    case 'daily': return `Daily login reward (day ${u.day})`;
    case 'achievement': return `Achievement: ${ACHIEVEMENT_MAP[u.id]?.name ?? u.id}`;
    case 'competition': return `Win the ${COMPETITION_TIERS[u.tier].name} ${COMPETITION_TYPE_MAP[u.compType].name}`;
    case 'event': return `Weekly event reward: ${EVENT_MAP[u.eventId]?.name ?? u.eventId} (returns in rotation)`;
    case 'iap': return `Optional purchase: ${PRODUCT_MAP[u.productId]?.name ?? u.productId}`;
    case 'missions': return `Complete ${u.count} daily missions`;
    case 'strength': return `Reach ${u.value} Overall Strength`;
  }
}

