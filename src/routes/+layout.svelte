<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { isAuthenticated } from '$lib/auth';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Toast from '$lib/components/Toast.svelte';

	let { children } = $props();

	const loginPath = `${base}/login`;

	let authed = $state(false);
	let checked = $state(false);

	$effect(() => {
		const pathname = page.url.pathname;
		authed = isAuthenticated();
		checked = true;
		if (!authed && pathname !== loginPath) {
			goto(loginPath);
		}
	});

	let isPublic = $derived(page.url.pathname === loginPath);
</script>

{#if isPublic}
	{@render children()}
{:else if checked && authed}
	<div class="flex h-screen overflow-hidden">
		<Sidebar />
		<main class="flex-1 overflow-y-auto bg-[#080808]">
			{@render children()}
		</main>
	</div>
	<Toast />
{:else if !checked}
	<div class="h-screen bg-[#080808]"></div>
{/if}
