<script lang="ts">
	import { onMount } from 'svelte';
	import { renderSVG } from 'uqr';
	import { live, connect, money, type Player } from '#lib/game.svelte.ts';

	onMount(() => connect());

	const joinUrl = `${location.origin}/play`;
	const qr = `data:image/svg+xml,${encodeURIComponent(renderSVG(joinUrl, { border: 2 }))}`;

	const game = $derived(live.game);
	const ranked = $derived(game ? game.players.toSorted((a, b) => b.score - a.score) : []);
	const champs = $derived(ranked.filter((p) => p.score === ranked[0]?.score));
	const roundWinners = $derived(game ? game.players.filter((p) => game.winners.includes(p.id)) : []);

	const wins = (players: Player[]) => `${players.map((p) => p.name).join(' & ')} ${players.length > 1 ? 'win' : 'wins'}!`;

	/** What a contestant's podium readout shows in the current phase. */
	function readout(p: Player): { text: string; win?: boolean; bust?: boolean } {
		if (game?.phase === 'bidding') return { text: p.hasBid ? 'Bid in' : '' };
		if (game?.phase === 'reveal')
			return {
				text: p.bid == null ? 'No bid' : money(p.bid),
				win: game.winners.includes(p.id),
				bust: (p.bid ?? 0) > (game.item?.price ?? 0)
			};
		if (game?.phase === 'over') return { text: String(p.score), win: champs.includes(p) };
		return { text: '' };
	}
</script>

{#snippet row(players: Player[])}
	<ol class="row" aria-label="Contestants">
		{#each players as p (p.id)}
			{@const r = readout(p)}
			<li class={{ podium: true, win: r.win, bust: r.bust }}>
				<span class="readout led">{r.text}</span>
				<span class="front">
					<span class="name">{p.name}</span>
					{#if game?.phase !== 'lobby' && game?.phase !== 'over'}
						<span class="pts" title="{p.score} points">{p.score}</span>
					{/if}
				</span>
			</li>
		{/each}
	</ol>
{/snippet}

<main class={game?.phase}>
	{#if !game}
		<p class="hint">Connecting to the game…</p>
	{:else if game.phase === 'lobby'}
		<h1 class="logo big">The Price<br />Is Right!</h1>
		<div class="join">
			<img class="qr" src={qr} alt="QR code to join at {joinUrl}" />
			<p>Scan to play, or go to<br /><strong>{location.host}/play</strong></p>
		</div>
		<h2 class="call">{game.players.length ? 'Come on down!' : 'Waiting for contestants…'}</h2>
		{@render row(game.players)}
	{:else if game.phase === 'over'}
		<section class="headline">
			<h1 class="logo">Final scores</h1>
			{#if champs.length}<p class="call">{wins(champs)}</p>{/if}
		</section>
		{@render row(ranked)}
	{:else if game.item}
		<section class="prize">
			{#if game.item.image}<img src={game.item.image} alt={game.item.name} />{/if}
		</section>
		<section class="headline">
			<p class="count">Item {game.round + 1} of {game.total}</p>
			<h1>{game.item.name}</h1>
			{#if game.item.description}<p class="desc">{game.item.description}</p>{/if}
			{#if game.phase === 'bidding'}
				<p class="call">Place your bids!</p>
			{:else}
				<p class="said">The actual retail price is</p>
				<p class="price marquee led">{money(game.item.price)}</p>
				<p class="call">{roundWinners.length ? wins(roundWinners) : 'Everyone overbid!'}</p>
			{/if}
		</section>
		{@render row(game.players)}
	{/if}
</main>

<style>
	main {
		height: 100vh;
		padding: 3vw 3vw 0;
		display: grid;
		/* minmax(0, …) keeps the contestants' row on screen however long the headline gets. */
		grid-template: minmax(0, 1fr) auto / 1fr 1fr;
		gap: 2vw 4vw;
		align-items: center;
		font-size: 2vw;
		overflow: hidden;
	}
	/* Lobby and final scores stack in one centered column. */
	main.lobby,
	main.over {
		grid-template: minmax(0, 1fr) auto auto auto / 1fr;
		justify-items: center;
		gap: 1.5vw;
	}
	main.over {
		grid-template-rows: minmax(0, 1fr) auto;
	}
	.hint {
		grid-column: 1 / -1;
		text-align: center;
	}
	.big {
		font-size: 5.5vw;
	}
	.logo {
		font-size: 5vw;
	}
	.join {
		display: flex;
		align-items: center;
		gap: 2.5vw;
		font-size: 2.4vw;
	}
	.join strong {
		color: var(--yellow);
	}
	.qr {
		width: 12vw;
		border-radius: 1vw;
		border: 0.5vw solid var(--yellow);
	}
	.call {
		margin: 0;
		font-family: var(--display);
		font-size: 3vw;
		color: var(--yellow);
		transform: rotate(-2deg);
	}

	.prize {
		display: grid;
		place-items: center;
		min-height: 0;
		height: 100%;
	}
	.prize img {
		max-width: 100%;
		max-height: 55vh;
		padding: 1vw;
		border-radius: 1vw;
		background: #fff;
		box-shadow: 0 0 0 0.6vw var(--yellow), 0 2vw 4vw #0008;
	}
	.headline {
		text-align: center;
	}
	.headline h1 {
		margin: 0.3em 0;
		font-size: 3.6vw;
	}
	.count,
	.said {
		margin: 0;
		opacity: 0.8;
	}
	.desc {
		max-width: 32em;
		margin: 0 auto 1.5vw;
		font-size: 1.8vw;
		line-height: 1.4;
		opacity: 0.85;
	}
	.price {
		display: inline-block;
		margin: 0.5vw 0 1.5vw;
		padding: 0.3em 0.6em;
		font-size: 6vw;
	}

	/* Contestants' Row: one podium per player across the bottom of the screen. */
	.row {
		grid-column: 1 / -1;
		width: 100%;
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		justify-content: center;
		align-items: flex-end;
		gap: 1vw;
	}
	.podium {
		--c: var(--orange);
		flex: 1 1 0;
		min-width: 0;
		max-width: 18vw;
		display: flex;
		flex-direction: column;
		transition: transform 0.3s;
	}
	.podium:nth-child(4n + 2) {
		--c: var(--pink);
	}
	.podium:nth-child(4n + 3) {
		--c: var(--cyan);
	}
	.podium:nth-child(4n + 4) {
		--c: var(--yellow);
	}
	.readout {
		height: 5vw;
		display: grid;
		place-items: center;
		margin: 0 1vw;
		border: 0.35vw solid #4a4a66;
		border-bottom: none;
		border-radius: 0.8vw 0.8vw 0 0;
		font-size: 2.6vw;
		white-space: nowrap;
	}
	.front {
		position: relative;
		height: 7vw;
		padding: 1.2vw 1vw;
		background: var(--c);
		color: var(--stage-deep);
		text-align: center;
		clip-path: polygon(0 0, 100% 0, 92% 100%, 8% 100%);
	}
	.name {
		display: block;
		font-family: var(--display);
		font-size: 2vw;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pts {
		display: inline-block;
		min-width: 2.2em;
		margin-top: 0.3vw;
		padding: 0.1em 0.5em;
		border-radius: 99px;
		background: var(--stage-deep);
		color: var(--yellow);
		font-weight: 700;
		font-size: 1.5vw;
	}
	.podium.win {
		transform: translateY(-1.5vw);
	}
	.podium.win .readout {
		border-color: var(--yellow);
		box-shadow: 0 0 2.5vw var(--yellow);
	}
	.podium.bust .readout {
		color: #a8622a;
		text-shadow: none;
		text-decoration: line-through;
	}
	@media (prefers-reduced-motion: reduce) {
		.podium {
			transition: none;
		}
	}
</style>
