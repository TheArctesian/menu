export interface IngredientSearchResult {
	id: string;
	name: string;
	category?: string;
	imageUrl?: string;
	brands?: string[];
}

export interface OpenFoodFactsProduct {
	code: string;
	product_name: string;
	product_name_en?: string;
	categories?: string;
	image_front_url?: string;
	brands?: string;
}

export interface OpenFoodFactsSearchResponse {
	products: OpenFoodFactsProduct[];
	count: number;
}

const OPENFOODFACTS_BASE_URL = 'https://world.openfoodfacts.org';
const USER_AGENT = 'MenuApp/1.0 (https://github.com/okita-dev/menu)';

export class IngredientAPIError extends Error {
	constructor(message: string, public status?: number) {
		super(message);
		this.name = 'IngredientAPIError';
	}
}

export async function searchIngredients(query: string, limit = 20): Promise<IngredientSearchResult[]> {
	if (!query || query.trim().length < 2) {
		return [];
	}

	const searchQuery = encodeURIComponent(query.trim());
	const url = `${OPENFOODFACTS_BASE_URL}/cgi/search.pl?search_terms=${searchQuery}&search_simple=1&action=process&json=1&page_size=${limit}`;

	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': USER_AGENT
			}
		});

		if (!response.ok) {
			throw new IngredientAPIError(
				`OpenFoodFacts API returned ${response.status}`,
				response.status
			);
		}

		const data: OpenFoodFactsSearchResponse = await response.json();

		return data.products
			.filter(product => product.product_name || product.product_name_en)
			.map(product => ({
				id: product.code,
				name: product.product_name_en || product.product_name || 'Unknown',
				category: product.categories?.split(',')[0]?.trim(),
				imageUrl: product.image_front_url,
				brands: product.brands?.split(',').map(b => b.trim()).filter(Boolean)
			}))
			.slice(0, limit);
	} catch (error) {
		if (error instanceof IngredientAPIError) {
			throw error;
		}
		
		console.error('Error searching ingredients:', error);
		throw new IngredientAPIError('Failed to search ingredients. Please try again.');
	}
}

export async function getIngredientById(id: string): Promise<IngredientSearchResult | null> {
	const url = `${OPENFOODFACTS_BASE_URL}/api/v0/product/${id}.json`;

	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': USER_AGENT
			}
		});

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new IngredientAPIError(
				`OpenFoodFacts API returned ${response.status}`,
				response.status
			);
		}

		const data = await response.json();
		
		if (!data.product) {
			return null;
		}

		const product: OpenFoodFactsProduct = data.product;

		return {
			id: product.code,
			name: product.product_name_en || product.product_name || 'Unknown',
			category: product.categories?.split(',')[0]?.trim(),
			imageUrl: product.image_front_url,
			brands: product.brands?.split(',').map(b => b.trim()).filter(Boolean)
		};
	} catch (error) {
		if (error instanceof IngredientAPIError) {
			throw error;
		}
		
		console.error('Error fetching ingredient:', error);
		throw new IngredientAPIError('Failed to fetch ingredient details.');
	}
}

export function validateIngredientName(name: string): boolean {
	if (!name || typeof name !== 'string') {
		return false;
	}
	
	const trimmed = name.trim();
	return trimmed.length >= 2 && trimmed.length <= 100;
}

export function normalizeIngredientName(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.replace(/[^a-z0-9\s-]/g, '');
}