import { hashString } from '../game/utils/rng';
import type { GameState } from '../game/types';
import { CURRENT_SAVE_VERSION, migrateSave } from './migrations';
import type { StorageAdapter } from './storageAdapter';

export const SAVE_KEY = 'gym-empire/save';
export const BACKUP_KEY = 'gym-empire/save.backup';

export interface SaveEnvelope {
  format: 'gym-empire-save';
  saveVersion: number;
  savedAt: number;
  checksum: number;
  data: string; // JSON of GameState
}

export type LoadResult =
  | { status: 'loaded'; state: GameState; fromBackup: boolean }
  | { status: 'empty' }
  | { status: 'corrupt'; error: string };

export class SaveManager {
  constructor(private storage: StorageAdapter) {}

  serialize(state: GameState, now: number): string {
    const data = JSON.stringify(state);
    const env: SaveEnvelope = {
      format: 'gym-empire-save',
      saveVersion: CURRENT_SAVE_VERSION,
      savedAt: now,
      checksum: hashString(data),
      data,
    };
    return JSON.stringify(env);
  }

  parse(raw: string, now: number): GameState {
    const env = JSON.parse(raw) as Partial<SaveEnvelope>;
    if (env.format !== 'gym-empire-save' || typeof env.data !== 'string') throw new Error('Unrecognised save format');
    if (hashString(env.data) !== env.checksum) throw new Error('Checksum mismatch');
    return migrateSave(JSON.parse(env.data), now);
  }

  async save(state: GameState, now: number): Promise<void> {
    const payload = this.serialize(state, now);
    const previous = await this.storage.getItem(SAVE_KEY);
    if (previous) await this.storage.setItem(BACKUP_KEY, previous);
    await this.storage.setItem(SAVE_KEY, payload);
  }

  async load(now: number): Promise<LoadResult> {
    const primary = await this.storage.getItem(SAVE_KEY);
    const backup = await this.storage.getItem(BACKUP_KEY);
    if (!primary && !backup) return { status: 'empty' };
    if (primary) {
      try {
        return { status: 'loaded', state: this.parse(primary, now), fromBackup: false };
      } catch (e) {
        if (!backup) return { status: 'corrupt', error: String(e) };
      }
    }
    try {
      return { status: 'loaded', state: this.parse(backup as string, now), fromBackup: true };
    } catch (e) {
      return { status: 'corrupt', error: String(e) };
    }
  }

  async reset(): Promise<void> {
    await this.storage.removeItem(SAVE_KEY);
    await this.storage.removeItem(BACKUP_KEY);
  }
}
