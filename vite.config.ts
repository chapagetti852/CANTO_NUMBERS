import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

const REVIEW_FILE = 'scripts/clip-review.json';

/**
 * Dev-only endpoint for review.html: stores your good/bad verdicts on audio clips in
 * scripts/clip-review.json, which `npm run tts:clips` reads to re-voice or drop bad clips.
 */
function clipReview(): Plugin {
  const read = () => (existsSync(REVIEW_FILE) ? JSON.parse(readFileSync(REVIEW_FILE, 'utf8')) : {});
  return {
    name: 'clip-review',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__clip-review', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            const { file, verdict } = JSON.parse(body) as { file: string; verdict: 'good' | 'bad' | null };
            const all = read();
            if (verdict) all[file] = verdict;
            else delete all[file];
            writeFileSync(REVIEW_FILE, JSON.stringify(all, null, 1) + '\n');
            res.end('{}');
          });
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(read()));
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [clipReview()],
  build: {
    outDir: 'dist',
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
  },
  server: {
    port: 5173,
    host: true, // reachable from your phone on the same Wi-Fi
  },
});
