<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let videoElement: HTMLVideoElement;
	let canvasElement: HTMLCanvasElement;
	let photoDataUrl = $state<string | null>(null);
	let stream: MediaStream | null = null;
	let cameraActive = $state(false);
	let searchQuery = $state('');
	let showSearchResults = $state(false);
	let addingFromSearch = $state(false);
	let activeTab = $state('photo');

	// Tab switching
	function switchTab(tab: string) {
		activeTab = tab;
	}

	// Camera functions
	async function startCamera() {
		try {
			stream = await navigator.mediaDevices.getUserMedia({ 
				video: { facingMode: 'environment' } // Use back camera on mobile
			});
			videoElement.srcObject = stream;
			cameraActive = true;
		} catch (error) {
			console.error('Error accessing camera:', error);
			alert('Could not access camera. Please check permissions.');
		}
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			stream = null;
		}
		cameraActive = false;
		photoDataUrl = null;
	}

	function capturePhoto() {
		if (!videoElement || !canvasElement) return;
		
		const context = canvasElement.getContext('2d');
		if (!context) return;
		
		canvasElement.width = videoElement.videoWidth;
		canvasElement.height = videoElement.videoHeight;
		context.drawImage(videoElement, 0, 0);
		
		photoDataUrl = canvasElement.toDataURL('image/jpeg', 0.8);
		stopCamera();
	}

	function retakePhoto() {
		photoDataUrl = null;
		startCamera();
	}

	// Search functionality
	function handleSearchInput() {
		showSearchResults = searchQuery.length >= 2;
	}

	function selectIngredientFromSearch(ingredient: any) {
		addingFromSearch = true;
		const nameInput = document.querySelector('#search-name') as HTMLInputElement;
		const imageInput = document.querySelector('#search-image') as HTMLInputElement;
		const categoryInput = document.querySelector('#search-category') as HTMLInputElement;
		
		if (nameInput) nameInput.value = ingredient.name;
		if (imageInput) imageInput.value = ingredient.imageUrl || '';
		if (categoryInput) categoryInput.value = ingredient.category || '';
		
		showSearchResults = false;
		searchQuery = '';
	}

	onMount(() => {
		return () => {
			stopCamera();
		};
	});
</script>

<div class="ingredients">
	<Navigation user={data.user} />

	<main class="main">
		<!-- Success/Error Messages -->
		{#if form?.success}
			<div class="message success">{form.message}</div>
		{/if}
		{#if form?.error}
			<div class="message error">{form.error}</div>
		{/if}

		<!-- Add Ingredients Section -->
		<section class="add-section">
			<h2>Add Ingredients</h2>
			
			<div class="tabs">
				<button class="tab" class:active={activeTab === 'photo'} onclick={() => switchTab('photo')}>Camera</button>
				<button class="tab" class:active={activeTab === 'search'} onclick={() => switchTab('search')}>Search</button>
				<button class="tab" class:active={activeTab === 'manual'} onclick={() => switchTab('manual')}>Manual</button>
			</div>

			<!-- Photo Capture Tab -->
			<div class="tab-content" class:hidden={activeTab !== 'photo'}>
				{#if !cameraActive && !photoDataUrl}
					<div class="camera-placeholder">
						<p>Take a photo of your ingredient</p>
						<button type="button" class="button" onclick={startCamera}>
							Start Camera
						</button>
					</div>
				{/if}

				{#if cameraActive}
					<div class="camera-view">
						<video bind:this={videoElement} autoplay playsinline muted>
							<track kind="captions" src="" label="Camera feed (no audio)" />
						</video>
						<div class="camera-controls">
							<button type="button" class="button" onclick={capturePhoto}>
								Capture
							</button>
							<button type="button" class="button secondary" onclick={stopCamera}>
								Cancel
							</button>
						</div>
					</div>
				{/if}

				{#if photoDataUrl}
					<div class="photo-preview">
						<img src={photoDataUrl} alt="Captured ingredient" />
						<div class="photo-controls">
							<button type="button" class="button secondary" onclick={retakePhoto}>
								Retake
							</button>
							<button type="button" class="button">
								Analyze
							</button>
						</div>
						<p class="note">
							Photo analysis coming soon! Please add ingredients manually.
						</p>
					</div>
				{/if}

				<canvas bind:this={canvasElement} style="display: none;"></canvas>
			</div>

			<!-- Search Tab -->
			<div class="tab-content" class:hidden={activeTab !== 'search'}>
				<form method="post" action="?/search" use:enhance>
					<div class="search-container">
						<input 
							type="text" 
							name="query"
							bind:value={searchQuery}
							oninput={handleSearchInput}
							placeholder="Search for ingredients..."
							class="search-input"
						/>
						<button type="submit" class="button">Search</button>
					</div>
				</form>

				{#if showSearchResults && form?.searchResults}
					<div class="search-results">
						{#each form.searchResults as ingredient}
							<div class="search-result" role="button" tabindex="0" onclick={() => selectIngredientFromSearch(ingredient)} onkeydown={(e) => e.key === 'Enter' && selectIngredientFromSearch(ingredient)}>
								{#if ingredient.imageUrl}
									<img src={ingredient.imageUrl} alt={ingredient.name} class="result-image" />
								{:else}
									<div class="result-placeholder">No image</div>
								{/if}
								<div class="result-info">
									<h4>{ingredient.name}</h4>
									{#if ingredient.category}
										<span class="result-category">{ingredient.category}</span>
									{/if}
									{#if ingredient.brands?.length}
										<span class="result-brands">{ingredient.brands.join(', ')}</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}

				{#if addingFromSearch}
					<div class="add-form">
						<h3>Add Selected Ingredient</h3>
						<form method="post" action="?/addFromSearch" use:enhance>
							<input type="hidden" id="search-name" name="name" />
							<input type="hidden" id="search-image" name="imageUrl" />
							<input type="hidden" id="search-category" name="category" />
							
							<div class="field">
								<label for="search-quantity">Quantity (optional)</label>
								<input type="text" id="search-quantity" name="quantity" placeholder="2 cups, 500g, etc." />
							</div>
							
							<div class="field">
								<label for="search-unit">Unit (optional)</label>
								<input type="text" id="search-unit" name="unit" placeholder="cups, grams, pieces, etc." />
							</div>
							
							<div class="form-actions">
								<button type="submit" class="button">Add Ingredient</button>
								<button type="button" class="button secondary" onclick={() => addingFromSearch = false}>Cancel</button>
							</div>
						</form>
					</div>
				{/if}
			</div>

			<!-- Manual Tab -->
			<div class="tab-content" class:hidden={activeTab !== 'manual'}>
				<form method="post" action="?/addManual" use:enhance>
					<div class="field">
						<label for="name">Ingredient Name *</label>
						<input 
							type="text" 
							id="name" 
							name="name" 
							value={form?.name ?? ''}
							placeholder="e.g., Organic Tomatoes"
							required 
						/>
					</div>
					
					<div class="form-row">
						<div class="field">
							<label for="quantity">Quantity</label>
							<input 
								type="text" 
								id="quantity" 
								name="quantity" 
								value={form?.quantity ?? ''}
								placeholder="2 cups, 500g, etc."
							/>
						</div>
						
						<div class="field">
							<label for="unit">Unit</label>
							<input 
								type="text" 
								id="unit" 
								name="unit" 
								value={form?.unit ?? ''}
								placeholder="cups, grams, pieces"
							/>
						</div>
					</div>
					
					<button type="submit" class="button">Add Ingredient</button>
				</form>
			</div>
		</section>

		<!-- Current Ingredients List -->
		<section class="ingredients-list">
			<div class="list-header">
				<h2>Your Ingredients ({data.ingredients.length})</h2>
				{#if data.ingredients.length > 0}
					<a href="/recipes/generate" class="button primary">Generate Recipes</a>
				{/if}
			</div>

			{#if data.ingredients.length === 0}
				<div class="empty-state">
					<h3>No ingredients yet</h3>
					<p>Start by adding some ingredients using the tabs above!</p>
				</div>
			{:else}
				<div class="ingredients-grid">
					{#each data.ingredients as item}
						<div class="ingredient-card" class:unavailable={!item.isAvailable}>
							{#if item.ingredient.imageUrl}
								<img src={item.ingredient.imageUrl} alt={item.ingredient.name} class="ingredient-image" />
							{:else}
								<div class="ingredient-placeholder">No image</div>
							{/if}
							
							<div class="ingredient-info">
								<h3>{item.ingredient.name}</h3>
								{#if item.ingredient.category}
									<span class="ingredient-category">{item.ingredient.category}</span>
								{/if}
								{#if item.quantity}
									<span class="ingredient-quantity">{item.quantity} {item.unit || ''}</span>
								{/if}
							</div>
							
							<div class="ingredient-actions">
								<form method="post" action="?/toggleAvailability" use:enhance>
									<input type="hidden" name="ingredientId" value={item.id} />
									<input type="hidden" name="isAvailable" value={!item.isAvailable} />
									<button type="submit" class="button {item.isAvailable ? 'secondary' : 'success'}">
										{item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
									</button>
								</form>
								
								<form method="post" action="?/remove" use:enhance>
									<input type="hidden" name="ingredientId" value={item.id} />
									<button type="submit" class="button danger" title="Remove ingredient">Remove</button>
								</form>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</main>
</div>