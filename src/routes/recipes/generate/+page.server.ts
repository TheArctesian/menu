import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as ingredientService from '$lib/server/ingredient-service';
import * as recipeService from '$lib/server/recipe-service';
import { generateVeganRecipes, type GeneratedRecipe } from '$lib/server/recipe-generator';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}
	
	try {
		const userIngredients = await ingredientService.getUserIngredients(locals.user.id, true);
		const availableIngredientNames = userIngredients.map(item => item.ingredient.name);
		
		return {
			user: locals.user,
			ingredients: userIngredients,
			availableIngredientNames
		};
	} catch (error) {
		console.error('Error loading ingredients:', error);
		return {
			user: locals.user,
			ingredients: [],
			availableIngredientNames: []
		};
	}
};

export const actions: Actions = {
	generate: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const data = await request.formData();
		const selectedIngredients = data.getAll('selectedIngredients') as string[];

		if (!selectedIngredients || selectedIngredients.length === 0) {
			return {
				error: 'Please select at least one ingredient to generate recipes.'
			};
		}

		try {
			// Check cache first
			let recipes = await recipeService.getCachedRecipes(locals.user.id, selectedIngredients);
			
			if (!recipes) {
				// Generate new recipes
				recipes = await generateVeganRecipes(selectedIngredients);
				
				// Cache the results
				await recipeService.cacheRecipeGeneration(locals.user.id, selectedIngredients, recipes);
			}

			return {
				success: true,
				recipes,
				selectedIngredients
			};
		} catch (error) {
			console.error('Error generating recipes:', error);
			return {
				error: 'Failed to generate recipes. Please try again later.'
			};
		}
	},

	save: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const data = await request.formData();
		const recipeData = data.get('recipeData')?.toString();

		if (!recipeData) {
			return {
				error: 'Invalid recipe data.'
			};
		}

		try {
			const recipe: GeneratedRecipe = JSON.parse(recipeData);
			const savedRecipe = await recipeService.saveGeneratedRecipe(locals.user.id, recipe);

			return {
				success: true,
				message: `Recipe "${recipe.title}" saved to your collection!`,
				savedRecipeId: savedRecipe.id
			};
		} catch (error) {
			console.error('Error saving recipe:', error);
			return {
				error: 'Failed to save recipe. Please try again.'
			};
		}
	}
};