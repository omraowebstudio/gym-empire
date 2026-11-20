import { SaveManager, SAVE_KEY, BACKUP_KEY } from '../src/storage/saveManager';
import { MemoryStorageAdapter } from '../src/storage/storageAdapter';
import { mergeDefaults, migrateSave, CURRENT_SAVE_VERSION } from '../src/storage/migrations';
import { buyEquipment, completeTraining, createInitialState, tick } from '../src/game';
import { MIN, must, newPlayer, T0 } from './helpers';

describe('save system', () => {
  test('save/load round-trips the full game state', async () => {
    const storage = new MemoryStorageAdapter();
    const mgr = new SaveManager(storage);
    let s = newPlayer();
    s.cash = 5000;
    s = must(s, T0, (d, ctx) => buyEquipment(d, ctx, 'garage', 's2', 'squat_rack'));
    s = must(s, T0, (d, ctx) => completeTraining(d, ctx, 'bench', { challenge: 'timing', reps: 5, perfects: 5, goods: 0, misses: 0, score: 1 }));
    await mgr.save(s, T0);
    const r = await mgr.load(T0);
    expect(r.status).toBe('loaded');
    if (r.status === 'loaded') expect(r.state).toEqual(s);
  });

  test('empty storage reports empty (fresh install)', async () => {
    const mgr = new SaveManager(new MemoryStorageAdapter());
    expect((await mgr.load(T0)).status).toBe('empty');
  });

  test('a corrupted primary save falls back to the backup', async () => {
    const storage = new MemoryStorageAdapter();
    const mgr = new SaveManager(storage);
    const a = newPlayer();
    await mgr.save(a, T0);
    const b = { ...a, cash: 999 };
    await mgr.save(b, T0 + 1);
    storage.raw().set(SAVE_KEY, storage.raw().get(SAVE_KEY)!.replace('"checksum":', '"checksum":1'));
    const r = await mgr.load(T0);
    expect(r.status).toBe('loaded');
    if (r.status === 'loaded') {
      expect(r.fromBackup).toBe(true);
      expect(r.state.cash).toBe(a.cash);
    }
    expect(storage.raw().has(BACKUP_KEY)).toBe(true);
  });

  test('fully corrupt data is reported, never silently replaced', async () => {
    const storage = new MemoryStorageAdapter();
    storage.raw().set(SAVE_KEY, '{not json');
    const r = await new SaveManager(storage).load(T0);
    expect(r.status).toBe('corrupt');
  });

  test('offline timestamp survives save/load so earnings are computed after reopening', async () => {
    const storage = new MemoryStorageAdapter();
    const mgr = new SaveManager(storage);
    const s = newPlayer();
    await mgr.save(s, T0);
    const loaded = await mgr.load(T0 + 30 * MIN);
    if (loaded.status !== 'loaded') throw new Error('load failed');
    expect(loaded.state.lastTickAt).toBe(s.lastTickAt);
    const after = must(loaded.state, T0 + 30 * MIN, (d, ctx) => tick(d, ctx));
    expect(after.pendingOffline!.seconds).toBe(1800);
  });

  test('migrates legacy v0 saves and fills missing fields with defaults', () => {
    const legacy: Record<string, unknown> = { version: 0, money: 1234, level: 3, profile: { name: 'Old', onboarded: true } };
    const s = migrateSave(legacy, T0);
    expect(s.version).toBe(CURRENT_SAVE_VERSION);
    expect(s.cash).toBe(1234);
    expect(s.level).toBe(3);
    expect(s.profile.name).toBe('Old');
    expect(s.profile.appearance).toBeDefined();
    expect(s.exercises.bench.level).toBe(1);
    expect(s.settings.sound).toBe(true);
  });

  test('rejects saves from a newer app version', () => {
    expect(() => migrateSave({ version: CURRENT_SAVE_VERSION + 1 }, T0)).toThrow();
  });

  test('mergeDefaults keeps loaded values and nulls but fills gaps', () => {
    const d = { a: 1, b: { c: 2, d: 3 }, e: null as null | number };
    expect(mergeDefaults(d, { b: { c: 9 }, e: 5 })).toEqual({ a: 1, b: { c: 9, d: 3 }, e: 5 });
    expect(mergeDefaults(createInitialState(T0).locations.garage, { slots: { s0: null } })!.slots.s0).toBeNull();
  });
});
