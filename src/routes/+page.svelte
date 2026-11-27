<script>
	import { onMount } from 'svelte';
	import { live, connect, money } from '#lib/game.svelte.js';

	onMount(() => connect());

	const game = $derived(live.game);
	const ranked = $derived(game ? game.players.toSorted((a, b) => b.score - a.score) : []);
	const bids = $derived(
		game ? game.players.filter((p) => p.bid != null).toSorted((a, b) => (b.bid ?? 0) - (a.bid ?? 0)) : []
	);
</script>

<main>
	{#if !game}
		<p class="hint">Connecting…</p>
	{:else if game.phase === 'lobby'}
		<h1 class="logo big">The Price<br />Is Right!</h1>
		<p class="hint">Join on your phone: <strong>{location.host}/play</strong></p>
		<ul class="names">
			{#each game.players as p (p.id)}
				<li>{p.name}</li>
			{:else}
				<li class="muted">Waiting for players…</li>
			{/each}
		</ul>
	{:else if game.phase === 'over'}
		<h1 class="logo">Final Scores</h1>
		<ol class="scores">
			{#each ranked as p (p.id)}
				<li class={{ win: p.score === ranked[0].score }}><span>{p.name}</span><b>{p.score}</b></li>
			{/each}
		</ol>
	{:else if game.item}
		<div class="stage">
			<section class="item">
				<p class="muted">Item {game.round + 1} of {game.total}</p>
				{#if game.item.image}<img src={game.item.image} alt={game.item.name} />{/if}
				<h1>{game.item.name}</h1>
				{#if game.item.description}<p class="desc">{game.item.description}</p>{/if}

				{#if game.phase === 'bidding'}
					<ul class="names">
						{#each game.players as p (p.id)}
							<li class={{ done: p.hasBid }}>{p.name} {p.hasBid ? '✓' : '…'}</li>
						{/each}
					</ul>
				{:else}
					<p class="price">Actual retail price: <b>{money(game.item.price)}</b></p>
					<ol class="scores">
						{#each bids as p (p.id)}
							<li class={{ win: game.winners.includes(p.id), over: (p.bid ?? 0) > (game.item.price ?? 0) }}>
								<span>{p.name}</span><b>{money(p.bid)}</b>
							</li>
						{/each}
					</ol>
					{#if !game.winners.length}<p class="hint">Everyone overbid!</p>{/if}
				{/if}
			</section>

			<aside>
				<h2>Scores</h2>
				<ol class="scores small">
					{#each ranked as p (p.id)}
						<li><span>{p.name}</span><b>{p.score}</b></li>
					{/each}
				</ol>
			</aside>
		</div>
	{/if}
</main>

<style>
	main {
		min-height: 100vh;
		padding: 3vw;
		display: flex;
		flex-direction: column;
		justify-content: center;
		font-size: 2vw;
	}
	.big {
		font-size: 9vw;
		line-height: 1;
	}
	.logo {
		font-size: 5vw;
	}
	.hint {
		text-align: center;
		font-size: 2.5vw;
	}
	.muted {
		opacity: 0.7;
	}
	.names {
		list-style: none;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1vw;
	}
	.names li {
		background: #ffffff22;
		padding: 0.5vw 1.5vw;
		border-radius: 99px;
	}
	.names li.done {
		background: #1db954;
	}
	.stage {
		display: grid;
		grid-template-columns: 1fr 22vw;
		gap: 3vw;
		align-items: start;
	}
	.item {
		text-align: center;
	}
	.item h1 {
		font-size: 4.5vw;
		margin: 0.5vw 0;
	}
	.item img {
		max-height: 35vh;
		max-width: 100%;
		border-radius: 1vw;
		background: #fff;
	}
	.desc {
		font-size: 2.2vw;
		opacity: 0.85;
	}
	.price {
		font-size: 3.5vw;
	}
	.price b {
		color: #ffcc00;
	}
	.scores {
		list-style: none;
		padding: 0;
		margin: 1vw auto;
		max-width: 50vw;
		display: grid;
		gap: 0.6vw;
	}
	.scores li {
		display: flex;
		justify-content: space-between;
		background: #ffffff18;
		padding: 0.6vw 1.5vw;
		border-radius: 0.8vw;
		font-size: 2.6vw;
	}
	.scores li.win {
		background: #ffcc00;
		color: #1a1a1a;
	}
	.scores li.over {
		opacity: 0.45;
		text-decoration: line-through;
	}
	.scores.small li {
		font-size: 1.8vw;
	}
	aside h2 {
		margin: 0;
		font-size: 2.2vw;
	}
</style>
