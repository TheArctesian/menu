import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchIngredients, getIngredientById, validateIngredientName, normalizeIngredientName, IngredientAPIError } from './ingredient-api';

global.fetch = vi.fn();
const mockFetch = fetch as any;

describe('ingredient-api', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('searchIngredients', () => {
		it('should return empty array for short query', async () => {
			const result = await searchIngredients('a');
			expect(result).toEqual([]);
		});

		it('should return empty array for empty query', async () => {
			const result = await searchIngredients('');
			expect(result).toEqual([]);
		});

		it('should fetch and format ingredients correctly', async () => {
			const mockResponse = {
				products: [
					{
						code: '123',
						product_name: 'Test Product',
						categories: 'fruits,organic',
						image_front_url: 'https://example.com/image.jpg',
						brands: 'Brand A,Brand B'
					}
				],
				count: 1
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await searchIngredients('apple');
			
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				id: '123',
				name: 'Test Product',
				category: 'fruits',
				imageUrl: 'https://example.com/image.jpg',
				brands: ['Brand A', 'Brand B']
			});
		});

		it('should handle API errors', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 500
			});

			await expect(searchIngredients('apple')).rejects.toThrow(IngredientAPIError);
		});

		it('should handle network errors', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));

			await expect(searchIngredients('apple')).rejects.toThrow(IngredientAPIError);
		});
	});

	describe('getIngredientById', () => {
		it('should fetch ingredient by id', async () => {
			const mockResponse = {
				product: {
					code: '123',
					product_name: 'Test Product',
					categories: 'fruits',
					image_front_url: 'https://example.com/image.jpg'
				}
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await getIngredientById('123');
			
			expect(result).toEqual({
				id: '123',
				name: 'Test Product',
				category: 'fruits',
				imageUrl: 'https://example.com/image.jpg',
				brands: undefined
			});
		});

		it('should return null for 404', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 404
			});

			const result = await getIngredientById('nonexistent');
			expect(result).toBeNull();
		});

		it('should return null for missing product', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({})
			});

			const result = await getIngredientById('123');
			expect(result).toBeNull();
		});
	});

	describe('validateIngredientName', () => {
		it('should validate correct names', () => {
			expect(validateIngredientName('apple')).toBe(true);
			expect(validateIngredientName('sweet potato')).toBe(true);
		});

		it('should reject invalid names', () => {
			expect(validateIngredientName('')).toBe(false);
			expect(validateIngredientName('a')).toBe(false);
			expect(validateIngredientName('a'.repeat(101))).toBe(false);
			expect(validateIngredientName(null as any)).toBe(false);
			expect(validateIngredientName(123 as any)).toBe(false);
		});
	});

	describe('normalizeIngredientName', () => {
		it('should normalize ingredient names', () => {
			expect(normalizeIngredientName('  Apple Pie  ')).toBe('apple pie');
			expect(normalizeIngredientName('Sweet-Potato')).toBe('sweet-potato');
			expect(normalizeIngredientName('Tômatö!')).toBe('tmat');
		});
	});
});