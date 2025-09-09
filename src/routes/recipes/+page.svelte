<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData, ActionData } from './$types';
	import Navigation from '$lib/components/Navigation.svelte';
	
	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let searchInput = $state(data.filters.search);
	let ratingFilter = $state(data.filters.minRating);
	let showFilters = $state(false);
	
	function formatTime(minutes: number | null): string {
		if (!minutes) return 'N/A';
		if (minutes < 60) {
			return `${minutes} min`;
		}
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
	
	function formatIngredients(ingredientsJson: any): string {
		if (!ingredientsJson || !Array.isArray(ingredientsJson)) return '';
		return ingredientsJson.map(ing => ing.name).join(', ');
	}
	
	function formatInstructions(instructions: string): string[] {
		return instructions.split('\n').filter(step => step.trim());
	}
	
	function getStarRating(rating: number | null): string {
		if (!rating) return 'Unrated';
		return `${rating}/5 stars`;
	}
	
	function applyFilters() {
		const params = new URLSearchParams();
		if (searchInput.trim()) {
			params.set('search', searchInput.trim());
		}
		if (ratingFilter > 0) {
			params.set('rating', ratingFilter.toString());
		}
		
		const queryString = params.toString();
		goto(queryString ? `?${queryString}` : '/recipes');
	}
	
	function clearFilters() {
		searchInput = '';
		ratingFilter = 0;
		goto('/recipes');
	}
	
	function deleteRecipe(recipeId: string, recipeTitle: string) {
		if (confirm(`Are you sure you want to delete "${recipeTitle}"?`)) {
			const form = document.createElement('form');
			form.method = 'post';
			form.action = '?/delete';
			
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = 'recipeId';
			input.value = recipeId;
			
			form.appendChild(input);
			document.body.appendChild(form);
			form.submit();
			document.body.removeChild(form);
		}
	}
</script>

<div class="recipes">
	<Navigation user={data.user} />

	<!-- Success/Error Messages -->
	{#if form?.success && form?.message}
		<div class="message success">{form.message}</div>
	{/if}
	{#if form?.error}
		<div class="message error">{form.error}</div>
	{/if}

	<main class="main">
		<!-- Filter Controls -->
		<section class="filter-section">
			<div class="filter-header">
				<h2>Your Recipes ({data.recipes.length})</h2>
				<div class="filter-actions">
					<button 
						type="button" 
						class="button secondary"
						onclick={() => showFilters = !showFilters}
					>
						{showFilters ? 'Hide' : 'Show'} Filters
					</button>
					<a href="/recipes/generate" class="button primary">
						Generate New Recipes
					</a>
				</div>
			</div>

			{#if showFilters}
				<div class="filter-controls">
					<div class="field">
						<label for="search">Search recipes:</label>
						<input 
							type="text" 
							id="search"
							bind:value={searchInput}
							placeholder="Search by title..."
						/>
					</div>
					
					<div class="field">
						<label for="rating">Minimum rating:</label>
						<select bind:value={ratingFilter}>
							<option value={0}>All ratings</option>
							<option value={1}>1+ stars</option>
							<option value={2}>2+ stars</option>
							<option value={3}>3+ stars</option>
							<option value={4}>4+ stars</option>
							<option value={5}>5 stars only</option>
						</select>
					</div>
					
					<div class="filter-buttons">
						<button type="button" class="button" onclick={applyFilters}>
							Apply Filters
						</button>
						<button type="button" class="button secondary" onclick={clearFilters}>
							Clear
						</button>
					</div>
				</div>
			{/if}
		</section>

		<!-- Recipes List -->
		{#if data.recipes.length === 0}
			<div class="empty-state">
				<h3>No recipes found</h3>
				{#if data.filters.search || data.filters.minRating > 0}
					<p>Try adjusting your filters or</p>
					<button type="button" class="button" onclick={clearFilters}>
						Clear all filters
					</button>
				{:else}
					<p>Start by generating some recipes from your ingredients!</p>
					<a href="/recipes/generate" class="button primary">Generate Recipes</a>
				{/if}
			</div>
		{:else}
			<div class="recipes-grid">
				{#each data.recipes as recipe}
					<article class="recipe-card">
						<div class="recipe-header">
							<h3>{recipe.title}</h3>
							<div class="recipe-rating">
								<span class="stars">{getStarRating(recipe.rating)}</span>
								{#if recipe.rating}
									<span class="rating-number">({recipe.rating}/5)</span>
								{/if}
							</div>
						</div>

						{#if recipe.description}
							<p class="recipe-description">{recipe.description}</p>
						{/if}

						<div class="recipe-meta">
							{#if recipe.prepTime}
								<div class="meta-item">
									<span>Prep: {formatTime(recipe.prepTime)}</span>
								</div>
							{/if}
							{#if recipe.cookTime}
								<div class="meta-item">
									<span>Cook: {formatTime(recipe.cookTime)}</span>
								</div>
							{/if}
							{#if recipe.servings}
								<div class="meta-item">
									<span>Serves: {recipe.servings}</span>
								</div>
							{/if}
						</div>

						<div class="recipe-summary">
							<div class="ingredients-summary">
								<h4>Key Ingredients:</h4>
								<p>{formatIngredients(recipe.ingredientsJson)}</p>
							</div>
						</div>

						<div class="recipe-actions">
							<details class="recipe-details">
								<summary>View Full Recipe</summary>
								<div class="full-recipe">
									<div class="ingredients-section">
										<h4>Ingredients:</h4>
										<ul>
											{#each recipe.ingredientsJson as ingredient}
												<li>
													{ingredient.quantity || ''} {ingredient.unit || ''} {ingredient.name}
												</li>
											{/each}
										</ul>
									</div>
									
									<div class="instructions-section">
										<h4>Instructions:</h4>
										<ol>
											{#each formatInstructions(recipe.instructions) as step}
												<li>{step}</li>
											{/each}
										</ol>
									</div>
								</div>
							</details>

							<div class="action-buttons">
								<!-- Rating Form -->
								<form method="post" action="?/rate" use:enhance class="rating-form">
									<input type="hidden" name="recipeId" value={recipe.id} />
									<label for="rating-{recipe.id}">Rate:</label>
									<select name="rating" id="rating-{recipe.id}" class="rating-select">
										<option value="">Rate</option>
										<option value="1">1 star</option>
										<option value="2">2 stars</option>
										<option value="3">3 stars</option>
										<option value="4">4 stars</option>
										<option value="5">5 stars</option>
									</select>
									<button type="submit" class="button small">Rate</button>
								</form>

								<button 
									type="button" 
									class="button danger small"
									onclick={() => deleteRecipe(recipe.id, recipe.title)}
									title="Delete recipe"
								>
									Delete
								</button>
							</div>
						</div>

						<div class="recipe-footer">
							<small class="recipe-date">
								Added: {new Date(recipe.createdAt).toLocaleDateString()}
							</small>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</main>
</div>