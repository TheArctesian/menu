import { eq, and, desc, like } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { GeneratedRecipe } from './recipe-generator';
import { createIngredientsHash } from './recipe-generator';

export interface SaveRecipeData {
	title: string;
	description?: string;
	instructions: string;
	ingredients: Array<{
		name: string;
		quantity?: string;
		unit?: string;
	}>;
	prepTime?: number;
	cookTime?: number;
	servings?: number;
}

export interface RecipeFilters {
	search?: string;
	minRating?: number;
	hasIngredients?: string[];
}

export class RecipeServiceError extends Error {
	constructor(message: string, public code: string = 'RECIPE_ERROR') {
		super(message);
		this.name = 'RecipeServiceError';
	}
}

function generateId(): string {
	return crypto.getRandomValues(new Uint32Array(4)).join('');
}

export async function saveRecipe(userId: string, recipeData: SaveRecipeData): Promise<table.Recipe> {
	try {
		const recipeId = generateId();
		
		const recipe: typeof table.recipes.$inferInsert = {
			id: recipeId,
			userId,
			title: recipeData.title,
			description: recipeData.description || null,
			instructions: Array.isArray(recipeData.instructions) 
				? recipeData.instructions.join('\n') 
				: recipeData.instructions,
			ingredientsJson: recipeData.ingredients,
			prepTime: recipeData.prepTime || null,
			cookTime: recipeData.cookTime || null,
			servings: recipeData.servings || null,
			rating: null
		};

		const [savedRecipe] = await db.insert(table.recipes).values(recipe).returning();
		
		if (!savedRecipe) {
			throw new RecipeServiceError('Failed to save recipe', 'SAVE_FAILED');
		}

		return savedRecipe;
	} catch (error) {
		console.error('Error saving recipe:', error);
		if (error instanceof RecipeServiceError) {
			throw error;
		}
		throw new RecipeServiceError('Failed to save recipe');
	}
}

export async function saveGeneratedRecipe(userId: string, generatedRecipe: GeneratedRecipe): Promise<table.Recipe> {
	return saveRecipe(userId, {
		title: generatedRecipe.title,
		description: generatedRecipe.description,
		instructions: generatedRecipe.instructions.join('\n'),
		ingredients: generatedRecipe.ingredients,
		prepTime: generatedRecipe.prepTime,
		cookTime: generatedRecipe.cookTime,
		servings: generatedRecipe.servings
	});
}

export async function getUserRecipes(userId: string, filters?: RecipeFilters): Promise<table.Recipe[]> {
	try {
		let query = db.select().from(table.recipes).where(eq(table.recipes.userId, userId));

		if (filters?.search) {
			query = query.where(
				like(table.recipes.title, `%${filters.search}%`)
			);
		}

		if (filters?.minRating) {
			query = query.where(
				and(
					eq(table.recipes.userId, userId),
					// @ts-ignore - drizzle typing issue with real comparison
					table.recipes.rating >= filters.minRating
				)
			);
		}

		const recipes = await query.orderBy(desc(table.recipes.createdAt));
		return recipes;
	} catch (error) {
		console.error('Error fetching user recipes:', error);
		throw new RecipeServiceError('Failed to fetch recipes');
	}
}

export async function getRecipeById(userId: string, recipeId: string): Promise<table.Recipe | null> {
	try {
		const [recipe] = await db
			.select()
			.from(table.recipes)
			.where(
				and(
					eq(table.recipes.id, recipeId),
					eq(table.recipes.userId, userId)
				)
			);

		return recipe || null;
	} catch (error) {
		console.error('Error fetching recipe:', error);
		throw new RecipeServiceError('Failed to fetch recipe');
	}
}

export async function updateRecipeRating(userId: string, recipeId: string, rating: number): Promise<table.Recipe | null> {
	if (rating < 1 || rating > 5) {
		throw new RecipeServiceError('Rating must be between 1 and 5', 'INVALID_RATING');
	}

	try {
		const [updatedRecipe] = await db
			.update(table.recipes)
			.set({ rating })
			.where(
				and(
					eq(table.recipes.id, recipeId),
					eq(table.recipes.userId, userId)
				)
			)
			.returning();

		return updatedRecipe || null;
	} catch (error) {
		console.error('Error updating recipe rating:', error);
		throw new RecipeServiceError('Failed to update recipe rating');
	}
}

export async function deleteRecipe(userId: string, recipeId: string): Promise<boolean> {
	try {
		const result = await db
			.delete(table.recipes)
			.where(
				and(
					eq(table.recipes.id, recipeId),
					eq(table.recipes.userId, userId)
				)
			);

		return result.rowCount > 0;
	} catch (error) {
		console.error('Error deleting recipe:', error);
		throw new RecipeServiceError('Failed to delete recipe');
	}
}

export async function cacheRecipeGeneration(
	userId: string, 
	ingredients: string[], 
	recipes: GeneratedRecipe[]
): Promise<void> {
	try {
		const cacheId = generateId();
		const ingredientsHash = createIngredientsHash(ingredients);

		const cache: typeof table.recipeCache.$inferInsert = {
			id: cacheId,
			userId,
			ingredientsHash,
			recipesJson: recipes
		};

		await db.insert(table.recipeCache).values(cache);
	} catch (error) {
		console.error('Error caching recipe generation:', error);
	}
}

export async function getCachedRecipes(userId: string, ingredients: string[]): Promise<GeneratedRecipe[] | null> {
	try {
		const ingredientsHash = createIngredientsHash(ingredients);
		
		const [cached] = await db
			.select()
			.from(table.recipeCache)
			.where(
				and(
					eq(table.recipeCache.userId, userId),
					eq(table.recipeCache.ingredientsHash, ingredientsHash)
				)
			)
			.orderBy(desc(table.recipeCache.createdAt));

		if (!cached) {
			return null;
		}

		const isExpired = Date.now() - cached.createdAt.getTime() > 24 * 60 * 60 * 1000; // 24 hours
		if (isExpired) {
			await db.delete(table.recipeCache).where(eq(table.recipeCache.id, cached.id));
			return null;
		}

		return cached.recipesJson as GeneratedRecipe[];
	} catch (error) {
		console.error('Error fetching cached recipes:', error);
		return null;
	}
}