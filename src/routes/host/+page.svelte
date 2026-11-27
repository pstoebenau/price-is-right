<script lang="ts">
	import { onMount } from 'svelte';
	import { live, connect, send, money } from '#lib/game.svelte.ts';

	onMount(() => connect(() => send({ type: 'host' })));

	const game = $derived(live.game);
	const bidCount = $derived(game?.players.filter((p) => p.hasBid).length ?? 0);
	const winnerNames = $derived(
		game?.players.filter((p) => game.winners.includes(p.id)).map((p) => p.name).join(', ')
	);

	let picked = $state('');
	const set = $derived(picked || game?.sets?.[0] || '');

	function reset() {
		if (confirm('Reset scores and go back to the lobby?')) send({ type: 'reset' });
	}
</script>

<main>
	<h1>Host controls</h1>
	{#if !game}
		<p>Connecting to the game…</p>
	{:else}
		{#if game.error}<p class="error" role="alert">{game.error}</p>{/if}

		{#if game.phase === 'lobby' || game.phase === 'over'}
			<p>{game.phase === 'over' ? 'Game over! ' : ''}{game.players.length} player(s) joined.</p>
			<label for="set">Items to play</label>
			<select id="set" value={set} onchange={(e) => (picked = e.currentTarget.value)}>
				{#each game.sets ?? [] as name (name)}
					<option value={name}>{name}</option>
				{/each}
			</select>
			<button onclick={() => send({ type: 'start', set })} disabled={!game.players.length || !set}>
				{game.phase === 'over' ? 'Play again' : 'Start game'}
			</button>
		{:else if game.item}
			<p class="muted">Item {game.round + 1} of {game.total}</p>
			<h2>{game.item.name}</h2>
			{#if game.phase === 'bidding'}
				<p>{bidCount} of {game.players.length} bids in</p>
				<button onclick={() => send({ type: 'reveal' })}>Reveal price</button>
			{:else}
				<p>Price: <b>{money(game.item.price)}</b></p>
				<p>Won by: <b>{winnerNames || 'nobody (all over)'}</b></p>
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
	h1 {
		margin: 0 0 0.5rem;
		color: var(--yellow);
	}
	.muted {
		opacity: 0.7;
	}
	.error {
		background: var(--pink);
		color: var(--stage-deep);
		padding: 0.75rem;
		border-radius: 0.75rem;
	}
	.secondary {
		margin-top: 2rem;
		background: none;
		box-shadow: inset 0 0 0 0.15rem #ffffff55;
		color: #fff;
	}
</style>
