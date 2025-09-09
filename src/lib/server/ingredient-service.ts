import { eq, and, desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

export interface AddIngredientData {
	name: string;
	category?: string;
	imageUrl?: string;
	quantity?: string;
	unit?: string;
	expiryDate?: Date;
}

export class IngredientServiceError extends Error {
	constructor(message: string, public code: string = 'INGREDIENT_ERROR') {
		super(message);
		this.name = 'IngredientServiceError';
	}
}

function generateId(): string {
	return crypto.getRandomValues(new Uint32Array(4)).join('');
}

export async function addIngredientToUser(userId: string, ingredientData: AddIngredientData): Promise<table.UserIngredient> {
	try {
		const ingredientId = generateId();
		const userIngredientId = generateId();

		const ingredient: typeof table.ingredients.$inferInsert = {
			id: ingredientId,
			userId,
			name: ingredientData.name,
			category: ingredientData.category || null,
			imageUrl: ingredientData.imageUrl || null
		};

		await db.insert(table.ingredients).values(ingredient).onConflictDoNothing();

		const userIngredient: typeof table.userIngredients.$inferInsert = {
			id: userIngredientId,
			userId,
			ingredientId,
			quantity: ingredientData.quantity || null,
			unit: ingredientData.unit || null,
			expiryDate: ingredientData.expiryDate || null,
			isAvailable: true
		};

		const [savedUserIngredient] = await db.insert(table.userIngredients).values(userIngredient).returning();
		
		if (!savedUserIngredient) {
			throw new IngredientServiceError('Failed to add ingredient', 'ADD_FAILED');
		}

		return savedUserIngredient;
	} catch (error) {
		console.error('Error adding ingredient:', error);
		if (error instanceof IngredientServiceError) {
			throw error;
		}
		throw new IngredientServiceError('Failed to add ingredient');
	}
}

export async function getUserIngredients(userId: string, availableOnly = false): Promise<Array<table.UserIngredient & { ingredient: table.Ingredient }>> {
	try {
		let whereCondition = eq(table.userIngredients.userId, userId);
		
		if (availableOnly) {
			whereCondition = and(
				eq(table.userIngredients.userId, userId),
				eq(table.userIngredients.isAvailable, true)
			);
		}

		const ingredients = await db
			.select({
				id: table.userIngredients.id,
				userId: table.userIngredients.userId,
				ingredientId: table.userIngredients.ingredientId,
				quantity: table.userIngredients.quantity,
				unit: table.userIngredients.unit,
				expiryDate: table.userIngredients.expiryDate,
				isAvailable: table.userIngredients.isAvailable,
				createdAt: table.userIngredients.createdAt,
				ingredient: {
					id: table.ingredients.id,
					name: table.ingredients.name,
					category: table.ingredients.category,
					imageUrl: table.ingredients.imageUrl,
					userId: table.ingredients.userId,
					createdAt: table.ingredients.createdAt
				}
			})
			.from(table.userIngredients)
			.innerJoin(table.ingredients, eq(table.userIngredients.ingredientId, table.ingredients.id))
			.where(whereCondition)
			.orderBy(desc(table.userIngredients.createdAt));

		return ingredients;
	} catch (error) {
		console.error('Error fetching user ingredients:', error);
		throw new IngredientServiceError('Failed to fetch ingredients');
	}
}

export async function updateIngredientAvailability(userId: string, userIngredientId: string, isAvailable: boolean): Promise<table.UserIngredient | null> {
	try {
		const [updatedIngredient] = await db
			.update(table.userIngredients)
			.set({ isAvailable })
			.where(
				and(
					eq(table.userIngredients.id, userIngredientId),
					eq(table.userIngredients.userId, userId)
				)
			)
			.returning();

		return updatedIngredient || null;
	} catch (error) {
		console.error('Error updating ingredient availability:', error);
		throw new IngredientServiceError('Failed to update ingredient availability');
	}
}

export async function updateIngredientQuantity(
	userId: string, 
	userIngredientId: string, 
	quantity: string, 
	unit?: string
): Promise<table.UserIngredient | null> {
	try {
		const [updatedIngredient] = await db
			.update(table.userIngredients)
			.set({ 
				quantity,
				unit: unit || null 
			})
			.where(
				and(
					eq(table.userIngredients.id, userIngredientId),
					eq(table.userIngredients.userId, userId)
				)
			)
			.returning();

		return updatedIngredient || null;
	} catch (error) {
		console.error('Error updating ingredient quantity:', error);
		throw new IngredientServiceError('Failed to update ingredient quantity');
	}
}

export async function removeIngredient(userId: string, userIngredientId: string): Promise<boolean> {
	try {
		const result = await db
			.delete(table.userIngredients)
			.where(
				and(
					eq(table.userIngredients.id, userIngredientId),
					eq(table.userIngredients.userId, userId)
				)
			);

		return result.rowCount > 0;
	} catch (error) {
		console.error('Error removing ingredient:', error);
		throw new IngredientServiceError('Failed to remove ingredient');
	}
}

export async function getAvailableIngredientNames(userId: string): Promise<string[]> {
	try {
		const ingredients = await getUserIngredients(userId, true);
		return ingredients.map(item => item.ingredient.name);
	} catch (error) {
		console.error('Error fetching available ingredient names:', error);
		throw new IngredientServiceError('Failed to fetch ingredient names');
	}
}