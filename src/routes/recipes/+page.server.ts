import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as recipeService from '$lib/server/recipe-service';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}
	
	const search = url.searchParams.get('search') || undefined;
	const minRating = url.searchParams.get('rating') ? parseInt(url.searchParams.get('rating')!) : undefined;
	
	try {
		const recipes = await recipeService.getUserRecipes(locals.user.id, {
			search,
			minRating
		});
		
		return {
			user: locals.user,
			recipes,
			filters: {
				search: search || '',
				minRating: minRating || 0
			}
		};
	} catch (error) {
		console.error('Error loading recipes:', error);
		return {
			user: locals.user,
			recipes: [],
			filters: {
				search: '',
				minRating: 0
			}
		};
	}
};

export const actions: Actions = {
	rate: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const data = await request.formData();
		const recipeId = data.get('recipeId')?.toString();
		const rating = data.get('rating')?.toString();

		if (!recipeId || !rating) {
			return {
				error: 'Recipe ID and rating are required.'
			};
		}

		const ratingNum = parseInt(rating);
		if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
			return {
				error: 'Rating must be between 1 and 5.'
			};
		}

		try {
			const updatedRecipe = await recipeService.updateRecipeRating(
				locals.user.id,
				recipeId,
				ratingNum
			);

			if (!updatedRecipe) {
				return {
					error: 'Recipe not found.'
				};
			}

			return {
				success: true,
				message: `Recipe rated ${ratingNum} star${ratingNum !== 1 ? 's' : ''}!`
			};
		} catch (error) {
			console.error('Error rating recipe:', error);
			return {
				error: 'Failed to rate recipe. Please try again.'
			};
		}
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const data = await request.formData();
		const recipeId = data.get('recipeId')?.toString();

		if (!recipeId) {
			return {
				error: 'Recipe ID is required.'
			};
		}

		try {
			const deleted = await recipeService.deleteRecipe(locals.user.id, recipeId);

			if (!deleted) {
				return {
					error: 'Recipe not found or already deleted.'
				};
			}

			return {
				success: true,
				message: 'Recipe deleted successfully.'
			};
		} catch (error) {
			console.error('Error deleting recipe:', error);
			return {
				error: 'Failed to delete recipe. Please try again.'
			};
		}
	}
};