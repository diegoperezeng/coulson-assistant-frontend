<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { login, isAuthenticated } from '$lib/auth';
	import { Zap, Eye, EyeOff } from 'lucide-svelte';

	let password = $state('');
	let error = $state('');
	let busy = $state(false);
	let showPassword = $state(false);
	let inputEl: HTMLInputElement | undefined = $state();

	onMount(() => {
		if (isAuthenticated()) goto(`${base}/teams`);
		inputEl?.focus();
	});

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = '';
		const ok = login(password);
		if (ok) {
			goto(`${base}/teams`);
		} else {
			error = 'Senha incorreta.';
			password = '';
			busy = false;
			inputEl?.focus();
		}
	}
</script>

<div class="h-screen bg-[#080808] flex items-center justify-center p-4">
	<div class="w-full max-w-sm">
		<div class="text-center mb-8">
			<div
				class="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4"
			>
				<Zap size={24} class="text-indigo-400" />
			</div>
			<h1 class="text-xl font-bold text-white">COULSON</h1>
			<p class="text-sm text-zinc-500 mt-1">Meeting Assistant</p>
		</div>

		<div class="bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl p-6">
			<h2 class="text-sm font-semibold text-zinc-300 mb-4">Acesso restrito</h2>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label class="block text-xs text-zinc-500 mb-1.5" for="password">Senha</label>
					<div class="relative">
						<input
							bind:this={inputEl}
							bind:value={password}
							id="password"
							type={showPassword ? 'text' : 'password'}
							placeholder="Digite a senha de acesso"
							autocomplete="current-password"
							class="w-full bg-[#141414] border border-[#252525] text-white rounded-lg px-3 py-2.5 text-sm
								focus:outline-none focus:border-indigo-500 transition-colors pr-10
								{error ? 'border-red-500/50' : ''}"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
						>
							{#if showPassword}
								<EyeOff size={15} />
							{:else}
								<Eye size={15} />
							{/if}
						</button>
					</div>
					{#if error}
						<p class="text-xs text-red-400 mt-1.5">{error}</p>
					{/if}
				</div>

				<button
					type="submit"
					disabled={busy || !password}
					class="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed
						text-white font-medium rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
				>
					{#if busy}
						<span
							class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
						></span>
					{/if}
					Entrar
				</button>
			</form>
		</div>
	</div>
</div>
