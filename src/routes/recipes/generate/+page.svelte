<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import Navigation from '$lib/components/Navigation.svelte';
	
	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let selectedIngredients = $state<string[]>([]);
	let generatingRecipes = $state(false);
	
	function toggleIngredient(ingredient: string) {
		if (selectedIngredients.includes(ingredient)) {
			selectedIngredients = selectedIngredients.filter(i => i !== ingredient);
		} else {
			selectedIngredients = [...selectedIngredients, ingredient];
		}
	}
	
	function selectAll() {
		selectedIngredients = [...data.availableIngredientNames];
	}
	
	function clearAll() {
		selectedIngredients = [];
	}
	
	function formatTime(minutes: number): string {
		if (minutes < 60) {
			return `${minutes} min`;
		}
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
	
	function saveRecipe(recipe: any) {
		const form = document.createElement('form');
		form.method = 'post';
		form.action = '?/save';
		
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = 'recipeData';
		input.value = JSON.stringify(recipe);
		
		form.appendChild(input);
		document.body.appendChild(form);
		form.submit();
		document.body.removeChild(form);
	}
</script>

<div class="generate">
	<Navigation user={data.user} />

	<!-- Success/Error Messages -->
	{#if form?.success && form?.message}
		<div class="message success">{form.message}</div>
	{/if}
	{#if form?.error}
		<div class="message error">{form.error}</div>
	{/if}

	<main class="main">
		{#if data.availableIngredientNames.length === 0}
			<div class="empty-state">
				<h2>No ingredients available</h2>
				<p>You need to add some ingredients first before generating recipes.</p>
				<a href="/ingredients" class="button primary">Add Ingredients</a>
			</div>
		{:else}
			<!-- Ingredient Selection -->
			<section class="ingredient-selection">
				<div class="selection-header">
					<h2>Select Ingredients ({selectedIngredients.length}/{data.availableIngredientNames.length})</h2>
					<div class="selection-actions">
						<button type="button" class="button secondary" onclick={selectAll}>Select All</button>
						<button type="button" class="button secondary" onclick={clearAll}>Clear All</button>
					</div>
				</div>

				<div class="ingredients-grid">
					{#each data.ingredients as item}
						<div 
							class="ingredient-tile" 
							class:selected={selectedIngredients.includes(item.ingredient.name)}
							role="button" 
							tabindex="0"
							onclick={() => toggleIngredient(item.ingredient.name)}
							onkeydown={(e) => e.key === 'Enter' && toggleIngredient(item.ingredient.name)}
						>
							{#if item.ingredient.imageUrl}
								<img src={item.ingredient.imageUrl} alt={item.ingredient.name} class="tile-image" />
							{:else}
								<div class="tile-placeholder">No image</div>
							{/if}
							<div class="tile-info">
								<h3>{item.ingredient.name}</h3>
								{#if item.quantity}
									<span class="tile-quantity">{item.quantity} {item.unit || ''}</span>
								{/if}
							</div>
							<div class="tile-checkbox">
								{selectedIngredients.includes(item.ingredient.name) ? '✓' : ''}
							</div>
						</div>
					{/each}
				</div>

				{#if selectedIngredients.length > 0}
					<form method="post" action="?/generate" use:enhance={() => {
						generatingRecipes = true;
						return async ({ update }) => {
							await update();
							generatingRecipes = false;
						};
					}}>
						{#each selectedIngredients as ingredient}
							<input type="hidden" name="selectedIngredients" value={ingredient} />
						{/each}
						<button type="submit" class="button primary large" disabled={generatingRecipes}>
							{#if generatingRecipes}
								Generating recipes...
							{:else}
								Generate {selectedIngredients.length === 1 ? '1 Recipe' : '5 Recipes'}
							{/if}
						</button>
					</form>
				{/if}
			</section>

			<!-- Generated Recipes -->
			{#if form?.success && form?.recipes}
				<section class="generated-recipes">
					<div class="recipes-header">
						<h2>Your Generated Recipes</h2>
						<p>Using: {form.selectedIngredients.join(', ')}</p>
					</div>

					<div class="recipes-grid">
						{#each form.recipes as recipe}
							<div class="recipe-card">
								<div class="recipe-header">
									<h3>{recipe.title}</h3>
									<button 
										type="button" 
										class="button success"
										onclick={() => saveRecipe(recipe)}
										title="Save to your recipe collection"
									>
										Save
									</button>
								</div>

								<p class="recipe-description">{recipe.description}</p>

								<div class="recipe-meta">
									<div class="meta-item">
										<span>Prep: {formatTime(recipe.prepTime)}</span>
									</div>
									<div class="meta-item">
										<span>Cook: {formatTime(recipe.cookTime)}</span>
									</div>
									<div class="meta-item">
										<span>Serves: {recipe.servings}</span>
									</div>
								</div>

								<div class="recipe-ingredients">
									<h4>Ingredients:</h4>
									<ul>
										{#each recipe.ingredients as ingredient}
											<li>
												{ingredient.quantity || ''} {ingredient.unit || ''} {ingredient.name}
											</li>
										{/each}
									</ul>
								</div>

								<div class="recipe-instructions">
									<h4>Instructions:</h4>
									<ol>
										{#each recipe.instructions as instruction}
											<li>{instruction}</li>
										{/each}
									</ol>
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		{/if}
	</main>
</div>