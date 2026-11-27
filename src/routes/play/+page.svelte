<script lang="ts">
	import { onMount } from 'svelte';
	import { live, connect, send, money } from '#lib/game.svelte.ts';

	// Not crypto.randomUUID: it is missing on plain-http LAN addresses.
	const id = localStorage.getItem('id') ?? Math.random().toString(36).slice(2);
	localStorage.setItem('id', id);

	let name = $state(localStorage.getItem('name') ?? '');
	let joined = $state(!!localStorage.getItem('name'));
	let bid = $state<number | null>(null);
	let myBid = $state({ round: -1, amount: 0 });
	let changing = $state(false);

	onMount(() => connect(() => joined && send({ type: 'join', id, name })));

	const game = $derived(live.game);
	const me = $derived(game?.players.find((p) => p.id === id));
	const bidThisRound = $derived(me?.hasBid && myBid.round === game?.round);
	const rank = $derived(game && me ? game.players.filter((p) => p.score > me.score).length + 1 : 0);

	function join(e: SubmitEvent) {
		e.preventDefault();
		name = name.trim();
		if (!name) return;
		localStorage.setItem('name', name);
		joined = true;
		send({ type: 'join', id, name });
	}

	/** Keeps only digits and shows them as dollars while typing. */
	function formatBid(e: Event & { currentTarget: HTMLInputElement }) {
		const digits = e.currentTarget.value.replace(/\D/g, '').slice(0, 9);
		bid = digits ? Number(digits) : null;
		e.currentTarget.value = bid == null ? '' : money(bid);
	}

	function submitBid(e: SubmitEvent) {
		e.preventDefault();
		if (!game || bid == null || !Number.isInteger(bid) || bid < 0) return;
		send({ type: 'bid', amount: bid });
		myBid = { round: game.round, amount: bid };
		bid = null;
		changing = false;
	}
</script>

<main>
	<h1 class="logo">The Price<br />Is Right!</h1>

	{#if !joined || (game && !me)}
		<form onsubmit={join}>
			<label for="name">Your name</label>
			<input id="name" bind:value={name} maxlength="20" autocomplete="nickname" required />
			<button>Join the game</button>
		</form>
	{:else if !game || !me}
		<p>Connecting to the game…</p>
	{:else}
		<p class="tag"><span>{me.name}</span><b>{me.score} pt{me.score === 1 ? '' : 's'}</b></p>

		{#if game.phase === 'lobby'}
			<p class="call">Come on down!</p>
			<p>You're in. The game starts when the host is ready.</p>
		{:else if game.phase === 'over'}
			<p class="call">You finished #{rank}</p>
		{:else if game.item}
			<p class="muted">Item {game.round + 1} of {game.total}</p>
			<h2>{game.item.name}</h2>
			{#if game.phase === 'bidding'}
				{#if bidThisRound && !changing}
					<p class="said">Your bid is locked in</p>
					<p class="readout led">{money(myBid.amount)}</p>
					<p class="muted">You can change it until the price is revealed.</p>
					<button class="secondary" onclick={() => ((bid = myBid.amount), (changing = true))}>Change bid</button>
				{:else}
					<form onsubmit={submitBid}>
						<label for="bid">{changing ? 'Your new bid' : 'Your bid'}</label>
						<!-- title="" stops the browser's "Please fill out this field" hover tooltip -->
						<input
							id="bid"
							class="readout led"
							inputmode="numeric"
							autocomplete="off"
							placeholder="$0"
							title=""
							value={bid == null ? '' : money(bid)}
							oninput={formatBid}
							required
						/>
						<button>Lock in bid</button>
					</form>
				{/if}
			{:else}
				<p class="said">The actual retail price is</p>
				<p class="price marquee led">{money(game.item.price)}</p>
				{#if game.winners.includes(id)}
					<p class="call">You won this round!</p>
				{:else if me.bid == null}
					<p>You didn't bid this round.</p>
				{:else if me.bid > (game.item.price ?? 0)}
					<p>You bid {money(me.bid)}. That's over.</p>
				{:else}
					<p>You bid {money(me.bid)}. Someone was closer.</p>
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
		line-height: 1.4;
	}
	.logo {
		font-size: 1.7rem;
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
	.tag {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		border-radius: 0.75rem;
		background: var(--pink);
		color: var(--stage-deep);
		font-family: var(--display);
	}
	.tag b {
		font-weight: 400;
	}
	.muted,
	.said {
		opacity: 0.8;
	}
	.call {
		font-family: var(--display);
		font-size: 1.8rem;
		color: var(--yellow);
		transform: rotate(-2deg);
	}
	/* Podium readout, shared by the bid input and the locked-in bid. */
	.readout {
		width: 100%;
		margin: 0;
		padding: 0.75rem 1rem;
		border: 0.3rem solid #4a4a66;
		border-radius: 0.75rem;
		font-size: 3rem;
		text-align: center;
	}
	p.readout {
		border-color: var(--yellow);
		box-shadow: 0 0 1.5rem #ffd21f55;
	}
	.secondary {
		background: none;
		box-shadow: inset 0 0 0 0.15rem #ffffff55;
		color: #fff;
	}
	.readout::placeholder {
		color: #6a3410;
		text-shadow: none;
	}
	.price {
		align-self: center;
		padding: 0.2em 0.6em;
		font-size: 2.8rem;
	}
</style>
