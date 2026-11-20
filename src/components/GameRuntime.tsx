import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { tick } from '@/game/systems/offline';
import { useGameStore } from '@/store/gameStore';
import { audio } from '@/services/audio';
import { adService } from '@/services/monetization';

/**
 * Drives the simulation clock: a 1s live tick while the app is active, an immediate tick
 * on resume (which produces the offline earnings report), and saves on background.
 */
export function GameRuntime() {
  const onboarded = useGameStore((s) => s.game.profile.onboarded);
  const personalized = useGameStore((s) => s.game.settings.personalizedAds);

  useEffect(() => {
    adService.initialize({ personalized }).catch(() => {});
  }, [personalized]);

  useEffect(() => {
    if (!onboarded) return;
    const store = useGameStore.getState;
    store().dispatch((d, ctx) => tick(d, ctx), { silent: true });
    const id = setInterval(() => {
      store().dispatch((d, ctx) => tick(d, ctx), { silent: true });
    }, 1000);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        store().dispatch((d, ctx) => tick(d, ctx), { silent: true });
        audio.startMusic();
      } else {
        store().saveNow();
        audio.pauseMusic();
      }
    });
    let unload: (() => void) | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const h = () => {
        store().saveNow();
      };
      window.addEventListener('beforeunload', h);
      window.addEventListener('pagehide', h);
      unload = () => {
        window.removeEventListener('beforeunload', h);
        window.removeEventListener('pagehide', h);
      };
    }
    return () => {
      clearInterval(id);
      sub.remove();
      unload?.();
    };
  }, [onboarded]);

  return null;
}
