import { describe, it, expect, vi } from 'vitest';
import { createIngredientsHash } from './recipe-generator';

describe('recipe-generator', () => {

	describe('createIngredientsHash', () => {
		it('should create consistent hash for same ingredients', () => {
			const hash1 = createIngredientsHash(['apple', 'carrot', 'onion']);
			const hash2 = createIngredientsHash(['onion', 'apple', 'carrot']);
			
			expect(hash1).toBe(hash2);
		});

		it('should create different hash for different ingredients', () => {
			const hash1 = createIngredientsHash(['apple', 'carrot']);
			const hash2 = createIngredientsHash(['apple', 'onion']);
			
			expect(hash1).not.toBe(hash2);
		});

		it('should handle empty array', () => {
			const hash = createIngredientsHash([]);
			expect(typeof hash).toBe('string');
		});
	});
});