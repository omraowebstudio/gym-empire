// "What should I do next?" — always gives the player a clear, achievable goal.
import { xpForLevel } from '../config/economy';
import { EQUIPMENT } from '../config/equipment';
import { LOCATIONS, LOCATION_MAP } from '../config/locations';
import { PHYSIQUE_STAGES } from '../config/exercises';
import type { GameState } from '../types';
import { equipmentPrice, ownedLocations } from './gym';
import { canClaimDaily } from './retention';
import { overallStrength, physiqueProgress } from './stats';

export interface Objective {
  icon: string;
  title: string;
  subtitle: string;
  progress: number; // 0..1
  route: string;
  cta: string;
}

export function nextObjective(state: GameState, now: number): Objective {
  if (canClaimDaily(state, now)) {
    return { icon: '🎁', title: 'Claim your daily reward', subtitle: 'A free gift is waiting for you today.', progress: 1, route: '/daily', cta: 'CLAIM' };
  }
  const claimable = state.missions.missions.find((m) => !m.claimed && m.progress >= m.target);
  if (claimable) {
    return { icon: '📋', title: 'Mission complete!', subtitle: 'Collect your mission reward.', progress: 1, route: '/missions', cta: 'CLAIM' };
  }
  const loc = state.locations[state.currentLocation];
  if (loc) {
    const empty = Object.keys(loc.slots).find((s) => !loc.slots[s]);
    if (empty) {
      const tier = LOCATION_MAP[loc.id].tier;
      const cheapest = Math.min(...EQUIPMENT.filter((e) => e.minLocationTier <= tier).map((e) => equipmentPrice(loc, e.id)));
      return {
        icon: '🏋️',
        title: 'Fill your gym with equipment',
        subtitle: `More equipment = more members. Cheapest: $${Math.round(cheapest).toLocaleString()}`,
        progress: Math.min(1, state.cash / cheapest),
        route: '/gym',
        cta: state.cash >= cheapest ? 'BUY' : 'VIEW',
      };
    }
  }
  const owned = ownedLocations(state).length;
  const nextLoc = LOCATIONS[owned];
  if (nextLoc && state.level >= nextLoc.unlockLevel) {
    return {
      icon: '🏢',
      title: `Open the ${nextLoc.name}`,
      subtitle: `Save $${nextLoc.unlockCost.toLocaleString()} to expand your empire.`,
      progress: Math.min(1, state.cash / nextLoc.unlockCost),
      route: '/expansion',
      cta: state.cash >= nextLoc.unlockCost ? 'OPEN' : 'VIEW',
    };
  }
  const phys = physiqueProgress(overallStrength(state));
  if (phys.next !== null && phys.progress > 0.6) {
    return {
      icon: '💪',
      title: `Reach the ${PHYSIQUE_STAGES[phys.stage + 1].name} physique`,
      subtitle: `Overall Strength ${overallStrength(state)} / ${phys.next}. Keep training!`,
      progress: phys.progress,
      route: '/train',
      cta: 'TRAIN',
    };
  }
  const target = nextLoc ? nextLoc.unlockLevel : state.level + 1;
  return {
    icon: '⭐',
    title: nextLoc ? `Reach level ${target} to unlock the ${nextLoc.name}` : `Reach level ${state.level + 1}`,
    subtitle: 'Train, complete missions and upgrade your gym to earn XP.',
    progress: state.xp / xpForLevel(state.level),
    route: '/train',
    cta: 'TRAIN',
  };
}
