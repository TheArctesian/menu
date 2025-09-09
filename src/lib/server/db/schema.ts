import { pgTable, integer, text, timestamp, boolean, real, json } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull(),
	email: text('email').notNull().unique(),
	age: integer('age')
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const ingredients = pgTable('ingredients', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	category: text('category'),
	imageUrl: text('image_url'),
	userId: text('user_id').notNull().references(() => user.id),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const userIngredients = pgTable('user_ingredients', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	ingredientId: text('ingredient_id').notNull().references(() => ingredients.id),
	quantity: text('quantity'),
	unit: text('unit'),
	expiryDate: timestamp('expiry_date', { withTimezone: true, mode: 'date' }),
	isAvailable: boolean('is_available').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const recipes = pgTable('recipes', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	title: text('title').notNull(),
	description: text('description'),
	instructions: text('instructions').notNull(),
	ingredientsJson: json('ingredients_json').notNull(),
	prepTime: integer('prep_time'),
	cookTime: integer('cook_time'),
	servings: integer('servings'),
	rating: real('rating'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const recipeTags = pgTable('recipe_tags', {
	id: text('id').primaryKey(),
	recipeId: text('recipe_id').notNull().references(() => recipes.id),
	tagName: text('tag_name').notNull()
});

export const recipeCache = pgTable('recipe_cache', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	ingredientsHash: text('ingredients_hash').notNull(),
	recipesJson: json('recipes_json').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Ingredient = typeof ingredients.$inferSelect;
export type UserIngredient = typeof userIngredients.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type RecipeTag = typeof recipeTags.$inferSelect;
export type RecipeCache = typeof recipeCache.$inferSelect;
