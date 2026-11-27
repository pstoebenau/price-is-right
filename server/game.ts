import { readdirSync, readFileSync } from 'node:fs';
import type { Server, ServerWebSocket, WebSocketHandler } from 'bun';

type Item = { name: string; price: number; image?: string; description?: string };
type Data = { isHost?: boolean; playerId?: string };
type Client = ServerWebSocket<Data>;

/**
 * Closest bid without going over wins. Tied bids share the win; if everyone is over, nobody wins.
 */
export function findWinners(bids: { id: string; amount: number }[], price: number) {
	const valid = bids.filter((b) => b.amount <= price);
	const best = Math.max(...valid.map((b) => b.amount));
	return valid.filter((b) => b.amount === best).map((b) => b.id);
}

/** Item sets are the `items/*.json` files, named without the extension. */
function listSets() {
	try {
		return readdirSync('items').filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
	} catch {
		return [];
	}
}

function loadItems(set: string): Item[] {
	// Only names from the directory listing, so a crafted name can't read other files.
	if (!listSets().includes(set)) throw new Error(`no item set "${set}"`);
	const items = JSON.parse(readFileSync(`items/${set}.json`, 'utf8'));
	if (!Array.isArray(items)) throw new Error(`items/${set}.json must be an array`);
	return items.filter((i: any) => typeof i?.name === 'string' && typeof i?.price === 'number');
}

/** One global game per server. */
const game = {
	phase: 'lobby' as 'lobby' | 'bidding' | 'reveal' | 'over',
	round: 0,
	items: [] as Item[],
	players: new Map<string, { id: string; name: string; score: number; bid: number | null }>(),
	winners: [] as string[],
	error: ''
};

const clients = new Set<Client>();

/** Price and bids stay off the wire until the reveal, even for the host, so the host can play too. */
function view(isHost = false) {
	const item = game.items[game.round];
	const reveal = game.phase === 'reveal';
	return {
		phase: game.phase,
		round: game.round,
		total: game.items.length,
		item: item && { ...item, price: reveal ? item.price : undefined },
		players: [...game.players.values()].map((p) => ({
			id: p.id,
			name: p.name,
			score: p.score,
			hasBid: p.bid !== null,
			bid: reveal ? p.bid : undefined
		})),
		winners: game.winners,
		error: isHost ? game.error : undefined,
		sets: isHost ? listSets() : undefined
	};
}

function broadcast() {
	for (const ws of clients) ws.send(JSON.stringify(view(ws.data.isHost)));
}

function clearBids() {
	for (const p of game.players.values()) p.bid = null;
	game.winners = [];
}

function handle(ws: Client, msg: any) {
	switch (msg?.type) {
		case 'host':
			ws.data.isHost = true;
			break;
		case 'join': {
			const id = String(msg.id ?? '').slice(0, 40);
			const name = String(msg.name ?? '').trim().slice(0, 20);
			if (!id || !name) return;
			const p = game.players.get(id);
			if (p) p.name = name;
			else game.players.set(id, { id, name, score: 0, bid: null });
			ws.data.playerId = id;
			break;
		}
		case 'bid': {
			const p = game.players.get(ws.data.playerId ?? '');
			const amount = Number(msg.amount);
			if (!p || game.phase !== 'bidding' || !Number.isInteger(amount) || amount < 0 || amount > 1e9) return;
			p.bid = amount;
			break;
		}
		case 'start':
			if (game.phase !== 'lobby' && game.phase !== 'over') return;
			// Re-read each game so edits to item files apply without a restart.
			try {
				game.items = loadItems(String(msg.set));
				game.error = game.items.length ? '' : `items/${msg.set}.json has no valid items`;
			} catch (e) {
				game.error = `Could not load items: ${e instanceof Error ? e.message : e}`;
			}
			if (game.error) break;
			for (const p of game.players.values()) p.score = 0;
			clearBids();
			game.round = 0;
			game.phase = 'bidding';
			break;
		case 'reveal': {
			if (game.phase !== 'bidding') return;
			const bids = [...game.players.values()].filter((p) => p.bid !== null);
			game.winners = findWinners(
				bids.map((p) => ({ id: p.id, amount: p.bid! })),
				game.items[game.round].price
			);
			for (const id of game.winners) game.players.get(id)!.score++;
			game.phase = 'reveal';
			break;
		}
		case 'next':
			if (game.phase !== 'reveal') return;
			clearBids();
			if (game.round + 1 < game.items.length) {
				game.round++;
				game.phase = 'bidding';
			} else game.phase = 'over';
			break;
		case 'reset':
			for (const p of game.players.values()) p.score = 0;
			clearBids();
			game.round = 0;
			game.phase = 'lobby';
			break;
		default:
			return;
	}
	broadcast();
}

/** Bun's `websocket` handler for `Bun.serve`; sockets get here via `upgrade`. */
export const websocket: WebSocketHandler<Data> = {
	open(ws) {
		clients.add(ws);
		ws.send(JSON.stringify(view()));
	},
	message(ws, data) {
		try {
			handle(ws, JSON.parse(String(data)));
		} catch (e) {
			console.error('bad message', e);
		}
	},
	close(ws) {
		clients.delete(ws);
	}
};

/** Upgrades `/ws` requests to the game socket; true when it did. */
export function upgrade(req: Request, server: Server<Data>) {
	return new URL(req.url).pathname === '/ws' && server.upgrade(req, { data: {} });
}

/** Game socket alone, for dev where Vite owns the HTTP server and proxies `/ws` here. */
export function serveGame(port = 0) {
	return Bun.serve({
		port,
		fetch: (req, server) => (upgrade(req, server) ? undefined : new Response('Not found', { status: 404 })),
		websocket
	});
}
