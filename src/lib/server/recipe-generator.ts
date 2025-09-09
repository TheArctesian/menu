import Anthropic from '@anthropic-ai/sdk';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { env } from '$env/dynamic/private';

let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
	if (!anthropic) {
		if (!env.ANTHROPIC_KEY) {
			throw new Error('ANTHROPIC_KEY is not set');
		}
		anthropic = new Anthropic({
			apiKey: env.ANTHROPIC_KEY
		});
	}
	return anthropic;
}

export interface RecipeIngredient {
	name: string;
	quantity?: string;
	unit?: string;
}

export interface GeneratedRecipe {
	title: string;
	description: string;
	ingredients: RecipeIngredient[];
	instructions: string[];
	prepTime: number;
	cookTime: number;
	servings: number;
}

const RECIPE_PROMPT = ChatPromptTemplate.fromTemplate(`
You are a professional vegan chef assistant. Generate 5 creative, delicious, and nutritionally balanced vegan recipes using the provided ingredients.

Available ingredients: {ingredients}

Requirements:
- All recipes must be 100% vegan (no animal products)
- Use as many of the available ingredients as possible
- Each recipe should be unique and interesting
- Include realistic prep and cook times
- Specify servings for each recipe
- Keep instructions clear and concise
- Ensure recipes are practical for home cooking

Format your response as valid JSON with this exact structure:
{{
  "recipes": [
    {{
      "title": "Recipe Name",
      "description": "Brief appetizing description",
      "ingredients": [
        {{"name": "ingredient name", "quantity": "amount", "unit": "measurement unit"}},
        ...
      ],
      "instructions": ["Step 1", "Step 2", ...],
      "prepTime": minutes_as_number,
      "cookTime": minutes_as_number,
      "servings": number_of_servings
    }},
    ...
  ]
}}

Only return the JSON, no additional text.
`);

export async function generateVeganRecipes(ingredients: string[]): Promise<GeneratedRecipe[]> {
	try {
		const prompt = await RECIPE_PROMPT.format({
			ingredients: ingredients.join(', ')
		});

		const client = getAnthropicClient();
		const message = await client.messages.create({
			model: 'claude-3-sonnet-20240229',
			max_tokens: 4000,
			messages: [
				{
					role: 'user',
					content: prompt
				}
			]
		});

		const content = message.content[0];
		if (content.type !== 'text') {
			throw new Error('Unexpected response format from Anthropic');
		}

		const response = JSON.parse(content.text);
		
		if (!response.recipes || !Array.isArray(response.recipes)) {
			throw new Error('Invalid recipe format in response');
		}

		return response.recipes as GeneratedRecipe[];
	} catch (error) {
		console.error('Error generating recipes:', error);
		throw new Error('Failed to generate recipes. Please try again.');
	}
}

export function createIngredientsHash(ingredients: string[]): string {
	return btoa(ingredients.sort().join('|'));
}