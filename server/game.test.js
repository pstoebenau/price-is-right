import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findWinners } from './game.js';

test('closest without going over wins', () => {
	const bids = [{ id: 'a', amount: 90 }, { id: 'b', amount: 99 }, { id: 'c', amount: 101 }];
	assert.deepEqual(findWinners(bids, 100), ['b']);
});
test('exact bid wins, ties share', () => {
	assert.deepEqual(findWinners([{ id: 'a', amount: 100 }, { id: 'b', amount: 100 }], 100), ['a', 'b']);
});
test('everyone over or no bids means no winner', () => {
	assert.deepEqual(findWinners([{ id: 'a', amount: 101 }], 100), []);
	assert.deepEqual(findWinners([], 100), []);
});
