import adapter from '@sveltejs/adapter-bun';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { serveGame } from './server/game.ts';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ precompress: true })
		}),
		{
			name: 'game-websocket',
			// Vite's HTTP server isn't Bun.serve, so the game socket runs beside it and Vite proxies `/ws` to it.
			config(_, { command }) {
				if (command !== 'serve') return;
				const proxy = { '/ws': { target: `ws://localhost:${serveGame().port}`, ws: true } };
				return { server: { proxy }, preview: { proxy } };
			}
		}
	]
});
