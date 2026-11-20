import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const SOURCES = {
  click: require('../../assets/sounds/click.wav'),
  coin: require('../../assets/sounds/coin.wav'),
  purchase: require('../../assets/sounds/purchase.wav'),
  upgrade: require('../../assets/sounds/upgrade.wav'),
  levelup: require('../../assets/sounds/levelup.wav'),
  achievement: require('../../assets/sounds/achievement.wav'),
  perfect: require('../../assets/sounds/perfect.wav'),
  good: require('../../assets/sounds/good.wav'),
  miss: require('../../assets/sounds/miss.wav'),
  clank: require('../../assets/sounds/clank.wav'),
  whoosh: require('../../assets/sounds/whoosh.wav'),
  victory: require('../../assets/sounds/victory.wav'),
  defeat: require('../../assets/sounds/defeat.wav'),
  cheer: require('../../assets/sounds/cheer.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;

class AudioService {
  private players = new Map<SoundName, AudioPlayer>();
  private music: AudioPlayer | null = null;
  private soundOn = true;
  private musicOn = true;
  private musicStarted = false;
  private initialised = false;

  private init() {
    if (this.initialised) return;
    this.initialised = true;
    setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false }).catch(() => {});
  }

  configure(sound: boolean, music: boolean) {
    this.soundOn = sound;
    this.musicOn = music;
    if (!music) this.music?.pause();
    else if (this.musicStarted) this.music?.play();
  }

  play(name: SoundName, volume = 1) {
    if (!this.soundOn) return;
    try {
      this.init();
      let p = this.players.get(name);
      if (!p) {
        p = createAudioPlayer(SOURCES[name]);
        this.players.set(name, p);
      }
      p.volume = volume;
      p.seekTo(0).catch(() => {});
      p.play();
    } catch {
      // Audio is non-critical; never crash gameplay because of it.
    }
  }

  /** Starts background music. Call after a user gesture (required on web). */
  startMusic() {
    this.musicStarted = true;
    if (!this.musicOn) return;
    try {
      this.init();
      if (!this.music) {
        this.music = createAudioPlayer(require('../../assets/sounds/music_loop.wav'));
        this.music.loop = true;
        this.music.volume = 0.35;
      }
      this.music.play();
    } catch {}
  }

  pauseMusic() {
    this.music?.pause();
  }
}

export const audio = new AudioService();
