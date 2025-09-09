<script lang="ts">
	import { onMount } from 'svelte';
	
	let retryCount = $state(0);
	let isRetrying = $state(false);
	
	function checkConnection() {
		isRetrying = true;
		retryCount++;
		
		// Try to fetch a small resource to test connectivity
		fetch('/', { method: 'HEAD', cache: 'no-cache' })
			.then(() => {
				// Connection restored, reload the page
				window.location.reload();
			})
			.catch(() => {
				isRetrying = false;
				setTimeout(() => {
					if (retryCount < 5) {
						checkConnection();
					}
				}, 2000 * retryCount); // Exponential backoff
			});
	}
	
	onMount(() => {
		// Listen for online event
		window.addEventListener('online', () => {
			window.location.reload();
		});
		
		// Auto-retry connection check
		setTimeout(checkConnection, 1000);
	});
</script>

<svelte:head>
	<title>Offline - Kitchen Assistant</title>
</svelte:head>

<div class="offline">
	<div class="content">
		<h1>You're Offline</h1>
		<p>It looks like you've lost your internet connection. Don't worry, you can still:</p>
		
		<div class="features">
			<div class="feature">
				<span>View your saved recipes</span>
			</div>
			<div class="feature">
				<span>Browse your ingredient list</span>
			</div>
			<div class="feature">
				<span>Access cached content</span>
			</div>
		</div>
		
		<div class="status">
			{#if isRetrying}
				<div class="retrying">
					<span>Checking connection... (Attempt {retryCount})</span>
				</div>
			{:else}
				<button type="button" onclick={checkConnection}>
					Try Again
				</button>
			{/if}
		</div>
		
		<div class="actions">
			<a href="/">Go Home</a>
			<a href="/recipes">View Recipes</a>
			<a href="/ingredients">View Ingredients</a>
		</div>
		
		<div class="tip">
			<h3>Tip</h3>
			<p>
				When you're back online, any new ingredients or saved recipes will sync automatically. 
				The app works best with a stable internet connection for generating new recipes.
			</p>
		</div>
	</div>
</div>

