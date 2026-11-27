import { readFileSync } from 'node:fs';
import { WebSocketServer } from 'ws';

/**
 * Closest bid without going over wins. Tied bids share the win; if everyone is over, nobody wins.
 * @param {{ id: string, amount: number }[]} bids
 * @param {number} price
 */
export function findWinners(bids, price) {
	const valid = bids.filter((b) => b.amount <= price);
	const best = Math.max(...valid.map((b) => b.amount));
	return valid.filter((b) => b.amount === best).map((b) => b.id);
}

/** @returns {{ name: string, price: number, image?: string, description?: string }[]} */
function loadItems() {
	const items = JSON.parse(readFileSync('items.json', 'utf8'));
	if (!Array.isArray(items)) throw new Error('items.json must be an array');
	return items.filter((i) => typeof i?.name === 'string' && typeof i?.price === 'number');
}

/** One global game per server. */
const game = {
	/** @type {'lobby' | 'bidding' | 'reveal' | 'over'} */
	phase: 'lobby',
	round: 0,
	/** @type {ReturnType<typeof loadItems>} */
	items: [],
	/** @type {Map<string, { id: string, name: string, score: number, bid: number | null }>} */
	players: new Map(),
	/** @type {string[]} */
	winners: [],
	error: ''
};

/** @type {WebSocketServer} */
let wss;

/** Price and bids stay off the wire until the reveal, except the price goes to the host. */
function view(isHost = false) {
	const item = game.items[game.round];
	const reveal = game.phase === 'reveal';
	return {
		phase: game.phase,
		round: game.round,
		total: game.items.length,
		item: item && { ...item, price: isHost || reveal ? item.price : undefined },
		players: [...game.players.values()].map((p) => ({
			id: p.id,
			name: p.name,
			score: p.score,
			hasBid: p.bid !== null,
			bid: reveal ? p.bid : undefined
		})),
		winners: game.winners,
		error: isHost ? game.error : undefined
	};
}

function broadcast() {
	for (const ws of wss.clients) ws.send(JSON.stringify(view(ws.isHost)));
}

function clearBids() {
	for (const p of game.players.values()) p.bid = null;
	game.winners = [];
}

/** @param {import('ws').WebSocket} ws @param {any} msg */
function handle(ws, msg) {
	switch (msg?.type) {
		case 'host':
			ws.isHost = true;
			break;
		case 'join': {
			const id = String(msg.id ?? '').slice(0, 40);
			const name = String(msg.name ?? '').trim().slice(0, 20);
			if (!id || !name) return;
			const p = game.players.get(id);
			if (p) p.name = name;
			else game.players.set(id, { id, name, score: 0, bid: null });
			ws.playerId = id;
			break;
		}
		case 'bid': {
			const p = game.players.get(ws.playerId);
			const amount = Number(msg.amount);
			if (!p || game.phase !== 'bidding' || !Number.isInteger(amount) || amount < 0 || amount > 1e9) return;
			p.bid = amount;
			break;
		}
		case 'start':
			if (game.phase !== 'lobby' && game.phase !== 'over') return;
			// Re-read each game so edits to items.json apply without a restart.
			try {
				game.items = loadItems();
				game.error = game.items.length ? '' : 'items.json has no valid items';
			} catch (e) {
				game.error = `Could not load items.json: ${e instanceof Error ? e.message : e}`;
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
				bids.map((p) => ({ id: p.id, amount: /** @type {number} */ (p.bid) })),
				game.items[game.round].price
			);
			for (const id of game.winners) /** @type {any} */ (game.players.get(id)).score++;
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

/** Serves the game on `/ws` of an existing HTTP server; other upgrades (e.g. Vite HMR) are left alone. */
export function attach(/** @type {import('node:http').Server} */ server) {
	wss = new WebSocketServer({ noServer: true });
	server.on('upgrade', (req, socket, head) => {
		if (req.url === '/ws') wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws));
	});
	wss.on('connection', (ws) => {
		ws.on('message', (data) => {
			try {
				handle(ws, JSON.parse(String(data)));
			} catch (e) {
				console.error('bad message', e);
			}
		});
		ws.send(JSON.stringify(view()));
	});
}
