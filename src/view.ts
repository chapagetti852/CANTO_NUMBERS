// The game is laid out in a 360×600 logical space, but rendered at the screen's real
// pixel density: the canvas is ZOOM× bigger and every camera zooms in to match.
// Without this the browser upscales a 360px canvas and the text goes soft.
import Phaser from 'phaser';

export const WIDTH = 360;
export const HEIGHT = 600;

function computeZoom(): number {
  const c = document.getElementById('game-container');
  const fit = c ? Math.min(c.clientWidth / WIDTH, c.clientHeight / HEIGHT) : 1;
  return Phaser.Math.Clamp(Math.ceil((fit || 1) * (window.devicePixelRatio || 1)), 1, 6);
}

export const ZOOM = computeZoom();

export function setupCamera(scene: Phaser.Scene): void {
  scene.cameras.main.setZoom(ZOOM).centerOn(WIDTH / 2, HEIGHT / 2);
}

/**
 * Screen shake in logical pixels. Phaser's camera.shake() misbehaves with our zoom
 * (it throws the view hundreds of pixels off-centre), so jiggle the scroll ourselves.
 */
export function shake(scene: Phaser.Scene, ms: number, px: number): void {
  const cam = scene.cameras.main;
  const end = scene.time.now + ms;
  const tick = scene.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      cam.centerOn(WIDTH / 2, HEIGHT / 2);
      if (scene.time.now >= end) {
        tick.remove();
        return;
      }
      cam.scrollX += Phaser.Math.FloatBetween(-px, px);
      cam.scrollY += Phaser.Math.FloatBetween(-px, px);
    },
  });
}
