// SFX and music. Music is loud-ish on the menu, quiet in play, and ducks almost to
// silence while a Listen-mode number clip is playing.
import Phaser from 'phaser';

const LEVELS = { menu: 0.5, game: 0.12, ducked: 0.03 };
type MusicLevel = 'menu' | 'game';

let manager: Phaser.Sound.BaseSoundManager | null = null;
type Sound = Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.NoAudioSound;
let music: Sound | null = null;
let base: number = LEVELS.menu;
let ducked = false;

export function loadSounds(scene: Phaser.Scene): void {
  scene.load.audio('sfx-correct', 'assets/sfx/correct.wav');
  scene.load.audio('sfx-wrong', 'assets/sfx/wrong.wav');
  scene.load.audio('sfx-combo', 'assets/sfx/combo.wav');
  scene.load.audio('music', 'assets/sfx/music.wav');
}

/** Starts the music if needed (browsers only allow it after the first tap; Phaser queues it). */
export function playMusic(scene: Phaser.Scene, level: MusicLevel): void {
  manager = scene.sound;
  base = LEVELS[level];
  if (!music) {
    music = scene.sound.add('music', { loop: true, volume: 0 }) as Sound;
    music.play();
  }
  apply();
}

function apply(): void {
  if (!music) return;
  const target = ducked ? Math.min(base, LEVELS.ducked) : base;
  music.setVolume(target);
}

export function duck(on: boolean): void {
  ducked = on;
  apply();
}

export function sfx(key: 'correct' | 'wrong' | 'combo', volume = 0.6): void {
  manager?.play(`sfx-${key}`, { volume });
}
