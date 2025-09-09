<script lang="ts">
	import type { PageData } from './$types';
	import Navigation from '$lib/components/Navigation.svelte';
	
	let { data }: { data: PageData } = $props();
</script>

<div class="dashboard">
	<Navigation user={data.user} />

	<main class="main">
		<div class="welcome-section">
			<h1 class="page-title">Smart Fridge Dashboard</h1>
			<p class="page-subtitle">Manage your ingredients and discover new recipes</p>
		</div>

		<div class="fridge">
			<div class="fridge-interior">
				<a href="/ingredients" class="nav-item">
					<h2>Ingredients</h2>
					<p>Manage your ingredient inventory</p>
				</a>
				
				<a href="/recipes" class="nav-item">
					<h2>Recipes</h2>
					<p>View your saved recipes</p>
				</a>
				
				<a href="/recipes/generate" class="nav-item">
					<h2>Generate</h2>
					<p>Create new recipes from ingredients</p>
				</a>
			</div>
		</div>
	</main>
</div>

<style>
	.welcome-section {
		text-align: center;
		padding: 40px 20px;
		margin-bottom: 20px;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 8px;
		letter-spacing: -0.025em;
	}

	.page-subtitle {
		font-size: 1.1rem;
		color: var(--text-secondary);
		margin-bottom: 0;
	}

	.fridge {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
	}

	@media (max-width: 768px) {
		.welcome-section {
			padding: 24px 16px;
		}

		.page-title {
			font-size: 1.6rem;
		}

		.page-subtitle {
			font-size: 1rem;
		}
	}
</style>