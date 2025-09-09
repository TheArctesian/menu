<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import '../app.css';

	let { children } = $props();
	let darkMode = $state(false);
	let mounted = $state(false);

	// Initialize theme immediately to avoid flash
	if (browser) {
		const savedTheme = localStorage.getItem('theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const initialDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
		darkMode = initialDarkMode;
		document.documentElement.setAttribute('data-theme', initialDarkMode ? 'dark' : 'light');
	}

	onMount(() => {
		mounted = true;
		
		// Listen for system theme changes
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e: MediaQueryListEvent) => {
			if (!localStorage.getItem('theme')) {
				darkMode = e.matches;
				updateTheme();
			}
		};
		
		mediaQuery.addEventListener('change', handleChange);
		
		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	});

	function toggleTheme() {
		darkMode = !darkMode;
		updateTheme();
		localStorage.setItem('theme', darkMode ? 'dark' : 'light');
	}

	function updateTheme() {
		if (browser) {
			document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if mounted}
	<!-- Theme Toggle Button -->
	<button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
		{darkMode ? 'Light' : 'Dark'}
	</button>
{/if}

{@render children?.()}
