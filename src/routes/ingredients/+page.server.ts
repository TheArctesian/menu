import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as ingredientService from '$lib/server/ingredient-service';
import * as ingredientAPI from '$lib/server/ingredient-api';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}
	
	try {
		const userIngredients = await ingredientService.getUserIngredients(locals.user.id);
		return {
			user: locals.user,
			ingredients: userIngredients
		};
	} catch (error) {
		console.error('Error loading ingredients:', error);
		return {
			user: locals.user,
			ingredients: []
		};
	}
};

export const actions: Actions = {
	addManual: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const data = await request.formData();
		const name = data.get('name')?.toString();
		const quantity = data.get('quantity')?.toString();
		const unit = data.get('unit')?.toString();

		if (!name) {
			return {
				error: 'Ingredient name is required',
				name,
				quantity,
				unit
			};
		}

		if (!ingredientAPI.validateIngredientName(name)) {
			return {
				error: 'Please enter a valid ingredient name (2-100 characters)',
				name,
				quantity,
				unit
			};
		}

		try {
			await ingredientService.addIngredientToUser(locals.user.id, {
				name: name.trim(),
				quantity: quantity || undefined,
				unit: unit || undefined
			});

			return {
				success: true,
				message: `Added ${name} to your ingredients!`
			};
		} catch (error) {
			console.error('Error adding ingredient:', error);
			return {
				error: 'Failed to add ingredient. Please try again.',
				name,
				quantity,
				unit
			};
		}
	},

	search: async ({ request }) => {
		const data = await request.formData();
		const query = data.get('query')?.toString();

		if (!query || query.length < 2) {
			return {
				searchResults: [],
				searchQuery: query
			};
		}

		try {
			const results = await ingredientAPI.searchIngredients(query, 10);
			return {
				searchResults: results,
				searchQuery: query
			};
		} catch (error) {
			console.error('Error searching ingredients:', error);
			return {
				searchError: 'Failed to search ingredients. Please try again.',
				searchQuery: query
			};
		}
	},

	addFromSearch: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const data = await request.formData();
		const name = data.get('name')?.toString();
		const imageUrl = data.get('imageUrl')?.toString();
		const category = data.get('category')?.toString();
		const quantity = data.get('quantity')?.toString();
		const unit = data.get('unit')?.toString();

		if (!name) {
			return {
				error: 'Ingredient name is required'
			};
		}

		try {
			await ingredientService.addIngredientToUser(locals.user.id, {
				name: name.trim(),
				imageUrl: imageUrl || undefined,
				category: category || undefined,
				quantity: quantity || undefined,
				unit: unit || undefined
			});

			return {
				success: true,
				message: `Added ${name} to your ingredients!`
			};
		} catch (error) {
			console.error('Error adding ingredient from search:', error);
			return {
				error: 'Failed to add ingredient. Please try again.'
			};
		}
	},

	toggleAvailability: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const data = await request.formData();
		const ingredientId = data.get('ingredientId')?.toString();
		const isAvailable = data.get('isAvailable') === 'true';

		if (!ingredientId) {
			return {
				error: 'Invalid ingredient ID'
			};
		}

		try {
			await ingredientService.updateIngredientAvailability(
				locals.user.id,
				ingredientId,
				isAvailable
			);

			return {
				success: true,
				message: `Ingredient ${isAvailable ? 'marked as available' : 'marked as unavailable'}`
			};
		} catch (error) {
			console.error('Error toggling ingredient availability:', error);
			return {
				error: 'Failed to update ingredient. Please try again.'
			};
		}
	},

	remove: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const data = await request.formData();
		const ingredientId = data.get('ingredientId')?.toString();

		if (!ingredientId) {
			return {
				error: 'Invalid ingredient ID'
			};
		}

		try {
			const success = await ingredientService.removeIngredient(locals.user.id, ingredientId);
			
			if (success) {
				return {
					success: true,
					message: 'Ingredient removed successfully'
				};
			} else {
				return {
					error: 'Ingredient not found or already removed'
				};
			}
		} catch (error) {
			console.error('Error removing ingredient:', error);
			return {
				error: 'Failed to remove ingredient. Please try again.'
			};
		}
	}
};