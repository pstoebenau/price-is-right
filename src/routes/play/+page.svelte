<script>
	import { onMount } from 'svelte';
	import { live, connect, send, money } from '#lib/game.svelte.js';

	// Not crypto.randomUUID: it is missing on plain-http LAN addresses.
	const id = localStorage.getItem('id') ?? Math.random().toString(36).slice(2);
	localStorage.setItem('id', id);

	let name = $state(localStorage.getItem('name') ?? '');
	let joined = $state(!!localStorage.getItem('name'));
	/** @type {number | null} */
	let bid = $state(null);
	let myBid = $state({ round: -1, amount: 0 });

	onMount(() => connect(() => joined && send({ type: 'join', id, name })));

	const game = $derived(live.game);
	const me = $derived(game?.players.find((p) => p.id === id));
	const bidThisRound = $derived(me?.hasBid && myBid.round === game?.round);
	const rank = $derived(game && me ? game.players.filter((p) => p.score > me.score).length + 1 : 0);

	/** @param {SubmitEvent} e */
	function join(e) {
		e.preventDefault();
		name = name.trim();
		if (!name) return;
		localStorage.setItem('name', name);
		joined = true;
		send({ type: 'join', id, name });
	}

	/** @param {SubmitEvent} e */
	function submitBid(e) {
		e.preventDefault();
		if (!game || bid == null || !Number.isInteger(bid) || bid < 0) return;
		send({ type: 'bid', amount: bid });
		myBid = { round: game.round, amount: bid };
		bid = null;
	}
</script>

<main>
	<h1 class="logo">The Price Is Right</h1>

	{#if !joined || (game && !me)}
		<form onsubmit={join}>
			<label for="name">Your name</label>
			<input id="name" bind:value={name} maxlength="20" autocomplete="nickname" required />
			<button>Join</button>
		</form>
	{:else if !game || !me}
		<p>Connecting…</p>
	{:else}
		<p class="me">{me.name} · {me.score} pt{me.score === 1 ? '' : 's'}</p>

		{#if game.phase === 'lobby'}
			<p>You're in! Waiting for the host to start…</p>
		{:else if game.phase === 'over'}
			<p class="big">You finished #{rank}</p>
		{:else if game.item}
			<h2>{game.item.name}</h2>
			{#if game.phase === 'bidding'}
				{#if bidThisRound}
					<p>Your bid: <b>{money(myBid.amount)}</b></p>
					<p class="muted">You can change it until the host reveals the price.</p>
				{/if}
				<form onsubmit={submitBid}>
					<label for="bid">{bidThisRound ? 'Change bid' : 'Your bid'} ($)</label>
					<input id="bid" type="number" inputmode="numeric" min="0" step="1" bind:value={bid} required />
					<button>Lock it in</button>
				</form>
			{:else}
				<p>Actual price: <b>{money(game.item.price)}</b></p>
				{#if game.winners.includes(id)}
					<p class="big win">You won this round!</p>
				{:else if me.bid == null}
					<p>You didn't bid.</p>
				{:else if me.bid > (game.item.price ?? 0)}
					<p>You bid {money(me.bid)}. Overbid!</p>
				{:else}
					<p>You bid {money(me.bid)}. Not the closest.</p>
				{/if}
			{/if}
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
	form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.me,
	.muted {
		opacity: 0.75;
	}
	.big {
		font-size: 2rem;
		font-weight: 800;
	}
	.win {
		color: #ffcc00;
	}
</style>
