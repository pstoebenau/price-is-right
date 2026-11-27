<script>
	import { onMount } from 'svelte';
	import { live, connect, send, money } from '#lib/game.svelte.js';

	onMount(() => connect(() => send({ type: 'host' })));

	const game = $derived(live.game);
	const bidCount = $derived(game?.players.filter((p) => p.hasBid).length ?? 0);
	const winnerNames = $derived(
		game?.players.filter((p) => game.winners.includes(p.id)).map((p) => p.name).join(', ')
	);

	function reset() {
		if (confirm('Reset scores and go back to the lobby?')) send({ type: 'reset' });
	}
</script>

<main>
	<h1 class="logo">Host</h1>
	{#if !game}
		<p>Connecting…</p>
	{:else}
		{#if game.error}<p class="error" role="alert">{game.error}</p>{/if}

		{#if game.phase === 'lobby'}
			<p>{game.players.length} player(s) joined.</p>
			<button onclick={() => send({ type: 'start' })} disabled={!game.players.length}>Start game</button>
		{:else if game.phase === 'over'}
			<p>Game over!</p>
			<button onclick={() => send({ type: 'start' })}>Play again</button>
		{:else if game.item}
			<p class="muted">Item {game.round + 1} of {game.total}</p>
			<h2>{game.item.name}</h2>
			{#if game.phase === 'bidding'}
				<p>{bidCount} of {game.players.length} bids in</p>
				<button onclick={() => send({ type: 'reveal' })}>Reveal price</button>
			{:else}
				<p>Price: <b>{money(game.item.price)}</b></p>
				<p>Winner: <b>{winnerNames || 'nobody (all over)'}</b></p>
				<button onclick={() => send({ type: 'next' })}>
					{game.round + 1 < game.total ? 'Next item' : 'Final scores'}
				</button>
			{/if}
		{/if}

		{#if game.phase !== 'lobby'}
			<button class="secondary" onclick={reset}>Reset to lobby</button>
		{/if}
	{/if}
</main>

<style>
	main {
		max-width: 28rem;
		margin: 0 auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		font-size: 1.2rem;
	}
	h2,
	p {
		margin: 0;
	}
	.muted {
		opacity: 0.7;
	}
	.error {
		background: #d6001c;
		padding: 0.75rem;
		border-radius: 0.75rem;
	}
	.secondary {
		margin-top: 2rem;
		background: #ffffff22;
		color: #fff;
	}
</style>
