import { expect, test } from 'bun:test';
import { findWinners } from './game.ts';

test('closest without going over wins', () => {
	const bids = [{ id: 'a', amount: 90 }, { id: 'b', amount: 99 }, { id: 'c', amount: 101 }];
	expect(findWinners(bids, 100)).toEqual(['b']);
});
test('exact bid wins, ties share', () => {
	expect(findWinners([{ id: 'a', amount: 100 }, { id: 'b', amount: 100 }], 100)).toEqual(['a', 'b']);
});
test('everyone over or no bids means no winner', () => {
	expect(findWinners([{ id: 'a', amount: 101 }], 100)).toEqual([]);
	expect(findWinners([], 100)).toEqual([]);
});
