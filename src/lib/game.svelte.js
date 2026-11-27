/** @typedef {{ id: string, name: string, score: number, hasBid: boolean, bid?: number | null }} Player */
/**
 * @typedef {{
 *   phase: 'lobby' | 'bidding' | 'reveal' | 'over',
 *   round: number,
 *   total: number,
 *   item?: { name: string, image?: string, description?: string, price?: number },
 *   players: Player[],
 *   winners: string[],
 *   error?: string
 * }} Game
 */

/** Latest state pushed by the server; `game` is null until the first message. */
export const live = $state(/** @type {{ game: Game | null, connected: boolean }} */ ({ game: null, connected: false }));

/** @type {WebSocket | undefined} */
let ws;

/** @param {object} msg */
export function send(msg) {
	if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

/** Connects and keeps reconnecting until the returned cleanup runs. `onOpen` runs on every (re)connect. */
export function connect(onOpen = () => {}) {
	let stopped = false;
	/** @type {ReturnType<typeof setTimeout>} */
	let retry;
	const open = () => {
		ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
		ws.onopen = () => {
			live.connected = true;
			onOpen();
		};
		ws.onmessage = (e) => (live.game = JSON.parse(e.data));
		ws.onclose = () => {
			live.connected = false;
			if (!stopped) retry = setTimeout(open, 1000);
		};
	};
	open();
	return () => {
		stopped = true;
		clearTimeout(retry);
		ws?.close();
	};
}

export const money = (/** @type {number | null | undefined} */ n) => '$' + (n ?? 0).toLocaleString();
