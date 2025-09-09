<script lang="ts">
	import { page } from '$app/stores';
	
	let { user } = $props<{ user?: { username: string } | null }>();
	
	let currentPath = $derived($page.url.pathname);
	
	function isActive(path: string) {
		if (path === '/') {
			return currentPath === '/';
		}
		return currentPath.startsWith(path);
	}
</script>

<nav class="main-nav">
	<div class="nav-container">
		<a href="/" class="nav-brand">
			<h1>Smart Fridge</h1>
		</a>
		
		<div class="nav-links">
			<a href="/" class="nav-link" class:active={isActive('/')}>
				Dashboard
			</a>
			<a href="/ingredients" class="nav-link" class:active={isActive('/ingredients')}>
				Ingredients
			</a>
			<a href="/recipes" class="nav-link" class:active={isActive('/recipes')}>
				Recipes
			</a>
			<a href="/recipes/generate" class="nav-link" class:active={isActive('/recipes/generate')}>
				Generate
			</a>
		</div>
		
		<div class="nav-user">
			{#if user}
				<span class="user-name">Welcome, {user.username}</span>
				<a href="/logout" class="logout-btn">Logout</a>
			{:else}
				<a href="/login" class="login-btn">Login</a>
			{/if}
		</div>
	</div>
</nav>

<style>
	.main-nav {
		background: var(--surface-primary);
		border-bottom: 1px solid var(--border-primary);
		box-shadow: var(--shadow-sm);
		position: sticky;
		top: 0;
		z-index: 100;
		transition: all 0.3s ease;
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 64px;
	}

	.nav-brand h1 {
		color: var(--text-primary);
		font-size: 1.4rem;
		font-weight: 700;
		text-decoration: none;
		margin: 0;
	}

	.nav-brand {
		text-decoration: none;
	}

	.nav-links {
		display: flex;
		gap: 8px;
	}

	.nav-link {
		padding: 8px 16px;
		border-radius: 8px;
		color: var(--text-secondary);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9rem;
		transition: all 0.2s ease;
		position: relative;
	}

	.nav-link:hover {
		background: var(--surface-secondary);
		color: var(--text-primary);
	}

	.nav-link.active {
		background: var(--fridge-accent);
		color: white;
	}

	.nav-user {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.user-name {
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	.logout-btn,
	.login-btn {
		padding: 6px 12px;
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		background: var(--surface-secondary);
		color: var(--text-primary);
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.logout-btn:hover,
	.login-btn:hover {
		background: var(--surface-elevated);
		transform: translateY(-1px);
	}

	@media (max-width: 768px) {
		.nav-container {
			padding: 0 16px;
			flex-wrap: wrap;
			min-height: auto;
			padding-top: 12px;
			padding-bottom: 12px;
		}

		.nav-links {
			order: 3;
			width: 100%;
			margin-top: 12px;
			justify-content: center;
		}

		.nav-link {
			font-size: 0.85rem;
			padding: 6px 12px;
		}

		.user-name {
			display: none;
		}
	}
</style>