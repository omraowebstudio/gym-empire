import { create } from 'zustand';
import { ACHIEVEMENT_MAP } from '@/game/config/achievements';
import { EXERCISE_MAP, PHYSIQUE_STAGES } from '@/game/config/exercises';
import { ITEM_MAP } from '@/game/config/items';
import { MISSION_MAP } from '@/game/config/missions';
import { act, type ActOptions, type ActionFn } from '@/game/engine';
import { createInitialState } from '@/game/state';
import type { ActionResult, GameEffect, GameState } from '@/game/types';
import { asyncStorageAdapter } from '@/storage/asyncStorageAdapter';
import { SaveManager } from '@/storage/saveManager';
import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';

export type ToastKind = 'achievement' | 'item' | 'mission' | 'info' | 'error' | 'level' | 'member';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  subtitle?: string;
  icon?: string;
  itemId?: string;
}

export type Celebration =
  | { id: number; kind: 'levelUp'; level: number; cash: number; gems: number; unlocks: string[] }
  | { id: number; kind: 'physique'; stage: number };

interface GameStore {
  hydrated: boolean;
  loadError: string | null;
  game: GameState;
  toasts: Toast[];
  celebrations: Celebration[];
  coinBurst: { id: number; amount: number } | null;
  hydrate: () => Promise<void>;
  dispatch: (fn: ActionFn, opts?: ActOptions & { silent?: boolean }) => ActionResult;
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
  dismissCelebration: (id: number) => void;
  triggerCoinBurst: (amount: number) => void;
  saveNow: () => Promise<void>;
  resetGame: () => Promise<void>;
}

export const saveManager = new SaveManager(asyncStorageAdapter);

let uid = 1;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(get: () => GameStore) {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    get().saveNow();
  }, 2500);
}

function applySettings(g: GameState) {
  audio.configure(g.settings.sound, g.settings.music);
  haptics.setEnabled(g.settings.haptics);
}

export const useGameStore = create<GameStore>((set, get) => ({
  hydrated: false,
  loadError: null,
  game: createInitialState(Date.now()),
  toasts: [],
  celebrations: [],
  coinBurst: null,

  hydrate: async () => {
    const now = Date.now();
    try {
      const r = await saveManager.load(now);
      if (r.status === 'loaded') {
        set({ game: r.state, hydrated: true });
        applySettings(r.state);
        if (r.fromBackup) get().pushToast({ kind: 'info', title: 'Save restored', subtitle: 'Recovered your progress from a backup.', icon: '💾' });
        return;
      }
      if (r.status === 'corrupt') {
        // Keep the corrupt data untouched in storage; start a fresh session in memory only
        // after informing the player, so progress is never silently overwritten.
        set({ loadError: r.error });
      }
    } catch (e) {
      set({ loadError: String(e) });
    }
    const fresh = createInitialState(now);
    set({ game: fresh, hydrated: true });
    applySettings(fresh);
  },

  dispatch: (fn, opts = {}) => {
    const { silent, ...actOpts } = opts;
    const result = act(get().game, Date.now(), fn, actOpts);
    if (!result.ok) {
      if (!silent) {
        get().pushToast({ kind: 'error', title: result.reason, icon: '⚠️' });
        haptics.error();
      }
      return result;
    }
    const settingsChanged = result.state.settings !== get().game.settings;
    set({ game: result.state });
    if (settingsChanged) applySettings(result.state);
    processEffects(result.effects, get, set);
    if (!get().loadError) scheduleSave(get);
    return result;
  },

  pushToast: (t) => {
    const toast = { ...t, id: uid++ };
    set((s) => ({ toasts: [...s.toasts.slice(-3), toast] }));
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  dismissCelebration: (id) => set((s) => ({ celebrations: s.celebrations.filter((c) => c.id !== id) })),
  triggerCoinBurst: (amount) => set({ coinBurst: { id: uid++, amount } }),

  saveNow: async () => {
    if (get().loadError) return; // never overwrite a save we failed to read
    try {
      await saveManager.save(get().game, Date.now());
    } catch {
      // storage full / unavailable: retry on the next change
    }
  },

  resetGame: async () => {
    await saveManager.reset();
    const fresh = createInitialState(Date.now());
    set({ game: fresh, loadError: null, toasts: [], celebrations: [] });
    applySettings(fresh);
  },
}));

function processEffects(effects: GameEffect[], get: () => GameStore, set: (p: Partial<GameStore> | ((s: GameStore) => Partial<GameStore>)) => void) {
  let levelUp = false;
  for (const e of effects) {
    switch (e.type) {
      case 'levelUp':
        levelUp = true;
        set((s) => ({ celebrations: [...s.celebrations, { id: uid++, kind: 'levelUp', level: e.level, cash: e.cash, gems: e.gems, unlocks: e.unlocks }] }));
        break;
      case 'physique':
        set((s) => ({ celebrations: [...s.celebrations, { id: uid++, kind: 'physique', stage: e.stage }] }));
        break;
      case 'achievement': {
        const a = ACHIEVEMENT_MAP[e.id];
        if (a) {
          get().pushToast({ kind: 'achievement', title: `Achievement: ${a.name}`, subtitle: 'Tap Achievements to claim your reward', icon: a.icon });
          audio.play('achievement');
        }
        break;
      }
      case 'item': {
        const it = ITEM_MAP[e.itemId];
        if (it) get().pushToast({ kind: 'item', title: `New ${it.rarity} item!`, subtitle: it.name, itemId: it.id });
        break;
      }
      case 'missionComplete': {
        const m = get().game.missions.missions.find((x) => x.id === e.missionId);
        const def = m ? MISSION_MAP[m.defId] : null;
        get().pushToast({ kind: 'mission', title: 'Mission complete!', subtitle: def ? def.title.replace('{n}', String(m!.target)) : undefined, icon: def?.icon ?? '✅' });
        break;
      }
      case 'exerciseLevel':
        get().pushToast({ kind: 'level', title: `${EXERCISE_MAP[e.exercise].name} level ${e.level}!`, subtitle: 'Your lift power increased', icon: '💪' });
        break;
      case 'memberJoined':
      case 'reward':
        break;
    }
  }
  if (levelUp) {
    audio.play('levelup');
    haptics.success();
  }
}

export function physiqueName(stage: number) {
  return PHYSIQUE_STAGES[stage]?.name ?? '';
}

/** Convenience selector hook. */
export function useGame<T>(selector: (g: GameState) => T): T {
  return useGameStore((s) => selector(s.game));
}

export const dispatch = (fn: ActionFn, opts?: ActOptions & { silent?: boolean }) => useGameStore.getState().dispatch(fn, opts);
