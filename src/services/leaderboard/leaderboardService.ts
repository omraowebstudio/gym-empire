import { ACHIEVEMENTS } from '../../game/config/achievements';
import { FIRST_NAMES, LIFTER_NICKNAMES, RIVAL_GYM_SUFFIX, RIVAL_GYM_WORDS, COUNTRIES } from '../../game/config/names';
import { gymScore, totalMembers } from '../../game/systems/gym';
import { overallStrength } from '../../game/systems/stats';
import type { GameState } from '../../game/types';
import { hashString, mulberry32, pick } from '../../game/utils/rng';
import { weekKey } from '../../game/utils/time';
import type { LeaderboardCategory } from './validation';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  subtitle: string;
  value: number;
  seed: number;
  isPlayer: boolean;
  country: string;
}

export interface LeaderboardService {
  readonly isOnline: boolean;
  getBoard(category: LeaderboardCategory, state: GameState, now: number): Promise<LeaderboardEntry[]>;
}

export const CATEGORY_INFO: Record<LeaderboardCategory, { label: string; unit: string; icon: string; min: number; max: number }> = {
  level: { label: 'Player Level', unit: 'LV', icon: '⭐', min: 1, max: 70 },
  gym: { label: 'Biggest Gym', unit: 'REP', icon: '🏢', min: 40, max: 30000 },
  members: { label: 'Most Members', unit: 'members', icon: '👥', min: 3, max: 520 },
  strength: { label: 'Strongest', unit: 'PWR', icon: '💪', min: 266, max: 3600 },
  achievements: { label: 'Achievements', unit: '🏅', icon: '🏅', min: 1, max: ACHIEVEMENTS.length - 2 },
  weekly: { label: 'Weekly League', unit: 'pts', icon: '👑', min: 0, max: 420 },
};

export function playerValue(category: LeaderboardCategory, state: GameState): number {
  switch (category) {
    case 'level': return state.level;
    case 'gym': return gymScore(state);
    case 'members': return totalMembers(state);
    case 'strength': return overallStrength(state);
    case 'achievements': return Object.keys(state.achievements).length;
    case 'weekly': return state.competition.leaguePoints;
  }
}

/**
 * Offline leaderboard against a fixed, seeded field of AI rivals. Rival scores do NOT
 * depend on the player's score, so the ranking is honest. Weekly boards reseed every week.
 */
export class LocalLeaderboardService implements LeaderboardService {
  readonly isOnline = false;

  async getBoard(category: LeaderboardCategory, state: GameState, now: number): Promise<LeaderboardEntry[]> {
    const info = CATEGORY_INFO[category];
    const seedKey = category === 'weekly' ? `${category}:${weekKey(now)}` : `${category}:season1`;
    const rng = mulberry32(hashString(seedKey));
    const rivals: Omit<LeaderboardEntry, 'rank'>[] = [];
    for (let i = 0; i < 49; i++) {
      const r = Math.pow(rng(), 2.2);
      const value = Math.round(info.min + (info.max - info.min) * r);
      const name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LIFTER_NICKNAMES)}`;
      rivals.push({
        name,
        subtitle: `${pick(rng, RIVAL_GYM_WORDS)} ${pick(rng, RIVAL_GYM_SUFFIX)}`,
        value,
        seed: Math.floor(rng() * 1e9),
        isPlayer: false,
        country: pick(rng, COUNTRIES),
      });
    }
    rivals.push({
      name: state.profile.name,
      subtitle: 'You',
      value: playerValue(category, state),
      seed: 0,
      isPlayer: true,
      country: '⭐',
    });
    rivals.sort((a, b) => b.value - a.value || (a.isPlayer ? -1 : 1));
    return rivals.map((e, i) => ({ ...e, rank: i + 1 }));
  }
}

export const leaderboardService: LeaderboardService = new LocalLeaderboardService();
