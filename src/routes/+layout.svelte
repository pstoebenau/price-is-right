<script>
	import favicon from '#lib/assets/favicon.svg';
	import { live } from '#lib/game.svelte.js';

	/** @type {{children: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>The Price Is Right</title>
</svelte:head>

{#if live.game && !live.connected}
	<p class="offline" role="status">Reconnecting…</p>
{/if}
{@render children()}

<style>
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		margin: 0;
		min-height: 100vh;
		font-family: system-ui, sans-serif;
		color: #fff;
		background: radial-gradient(circle at top, #2a3fd6, #0b1257 70%);
	}
	:global(button),
	:global(input) {
		font: inherit;
		font-size: 1.25rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		border: none;
	}
	:global(button) {
		background: #ffcc00;
		color: #1a1a1a;
		font-weight: 700;
		cursor: pointer;
	}
	:global(button:disabled) {
		opacity: 0.5;
	}
	:global(.logo) {
		font-weight: 900;
		color: #ffcc00;
		text-shadow: 0 0.08em 0 #d6001c;
		text-align: center;
		margin: 0;
	}
	.offline {
		position: fixed;
		top: 0;
		inset-inline: 0;
		margin: 0;
		padding: 0.25rem;
		text-align: center;
		background: #d6001c;
		z-index: 1;
	}
</style>
