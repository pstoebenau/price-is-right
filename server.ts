// adapter-bun calls Bun.serve without a `websocket` option, so wrap it to add the game socket on /ws.
import { upgrade, websocket } from './server/game.ts';

const serve = Bun.serve;
Bun.serve = ((options: any) =>
	serve({
		...options,
		websocket,
		fetch: (req, server) => (upgrade(req, server) ? undefined : options.fetch(req, server))
	})) as typeof Bun.serve;

await import('./build/index.js');
