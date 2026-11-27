<script lang="ts">
	import '@fontsource/bowlby-one';
	import '@fontsource/doto/900.css';
	import '@fontsource-variable/rubik';
	import favicon from '#lib/assets/favicon.svg';
	import { live } from '#lib/game.svelte.ts';

	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>The Price Is Right</title>
</svelte:head>

{#if live.game && !live.connected}
	<p class="offline" role="status">Lost connection. Reconnecting…</p>
{/if}
{@render children()}

<style>
	:global(:root) {
		--stage: #1d1673;
		--stage-deep: #110b4a;
		--yellow: #ffd21f;
		--orange: #ff7a00;
		--pink: #ff2d87;
		--cyan: #00b4d8;
		--led: #ffa31a;
		--panel: #2b0f00;
		--display: 'Bowlby One', 'Arial Black', sans-serif;
	}
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		margin: 0;
		min-height: 100vh;
		font-family: 'Rubik Variable', system-ui, sans-serif;
		color: #fff;
		background: linear-gradient(var(--stage), var(--stage-deep)) fixed;
	}
	:global(h1),
	:global(h2) {
		font-family: var(--display);
		font-weight: 400;
		line-height: 1.1;
	}
	:global(button),
	:global(input),
	:global(select) {
		font: inherit;
		font-size: 1.25rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		border: none;
	}
	:global(button) {
		font-weight: 700;
		background: var(--yellow);
		color: var(--stage-deep);
		box-shadow: 0 0.3rem 0 var(--orange);
		cursor: pointer;
	}
	:global(button:active:not(:disabled)) {
		transform: translateY(0.2rem);
		box-shadow: 0 0.1rem 0 var(--orange);
	}
	:global(button:disabled) {
		opacity: 0.5;
		cursor: default;
	}
	:global(:focus-visible) {
		outline: 0.2rem solid var(--cyan);
		outline-offset: 0.2rem;
	}

	/* The show's wordmark: tilted oval ringed with bulbs. */
	:global(.logo) {
		position: relative;
		align-self: center;
		margin: 0.6em auto;
		padding: 0.45em 1.1em;
		border-radius: 50%;
		background: radial-gradient(var(--orange), var(--pink));
		box-shadow: 0 0 0 0.12em var(--cyan);
		transform: rotate(-4deg);
		color: var(--yellow);
		text-align: center;
		text-transform: uppercase;
		-webkit-text-stroke: 0.12em var(--stage-deep);
		paint-order: stroke fill;
		text-shadow: 0.06em 0.06em 0 var(--stage-deep);
	}
	:global(.logo)::before {
		content: '';
		position: absolute;
		inset: 0.12em;
		border: 0.12em dotted #fff3b0;
		border-radius: 50%;
		filter: drop-shadow(0 0 0.1em var(--yellow));
	}

	/* Podium readout: amber dot-matrix digits. */
	:global(.led) {
		font-family: 'Doto', monospace;
		font-weight: 900;
		font-variant-numeric: tabular-nums;
		color: var(--led);
		background: var(--panel);
		text-shadow: 0 0 0.3em #ff6a00;
	}

	/* Bulb frame; the bulbs chase by sliding the dot layer half a tile per step. */
	:global(.marquee) {
		border: 0.7rem solid transparent;
		border-radius: 0.75rem;
		background:
			linear-gradient(var(--panel), var(--panel)) padding-box,
			radial-gradient(circle, #fff8c0 25%, var(--yellow) 40%, transparent 55%) 0 0 / 1.4rem 1.4rem border-box,
			linear-gradient(var(--pink), var(--pink)) border-box;
	}
	@media (prefers-reduced-motion: no-preference) {
		:global(.marquee) {
			animation: chase 0.5s steps(2) infinite;
		}
	}
	@keyframes chase {
		to {
			background-position: 0 0, 1.4rem 0, 0 0;
		}
	}

	.offline {
		position: fixed;
		top: 0;
		inset-inline: 0;
		margin: 0;
		padding: 0.25rem;
		text-align: center;
		background: var(--pink);
		color: var(--stage-deep);
		font-weight: 700;
		z-index: 1;
	}
</style>
