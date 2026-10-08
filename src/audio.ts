// Number audio: Azure clips from public/assets/audio/clips when generated,
// otherwise the browser's own Cantonese voice as a stand-in for development.
import type { Item } from './yale/items';

let manifest: Record<string, string> = {};
let current: HTMLAudioElement | null = null;

export async function loadManifest(): Promise<void> {
  try {
    const res = await fetch('assets/audio/manifest.json');
    if (res.ok) manifest = await res.json();
  } catch {
    manifest = {};
  }
}

export function hasClips(): boolean {
  return Object.keys(manifest).length > 0;
}

export function hasClip(item: Item): boolean {
  return item.id in manifest;
}

export function speak(item: Item, rate = 1): void {
  stop();
  const file = manifest[item.id];
  if (file) {
    current = new Audio(`assets/audio/clips/${file}`);
    current.playbackRate = rate;
    current.preservesPitch = true;
    void current.play().catch(() => undefined);
    return;
  }
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(item.tts.replace(/<[^>]+>/g, ''));
  u.lang = 'zh-HK';
  u.rate = rate;
  const voice = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-') === 'zh-HK');
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

export function stop(): void {
  current?.pause();
  current = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
