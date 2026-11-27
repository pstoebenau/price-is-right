import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { attach } from './server/game.js';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		}),
		{
			name: 'game-websocket',
			configureServer: (server) => server.httpServer && attach(/** @type {any} */ (server.httpServer)),
			configurePreviewServer: (server) => attach(/** @type {any} */ (server.httpServer))
		}
	]
});
