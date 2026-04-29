<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { logout } from '$lib/auth';
	import { Users, User, Video, Upload, LogOut, Zap } from 'lucide-svelte';

	const navItems = [
		{ path: '/teams', label: 'Times', icon: Users },
		{ path: '/participants', label: 'Participantes', icon: User },
		{ path: '/videos', label: 'Vídeos', icon: Video },
		{ path: '/videos/upload', label: 'Enviar Vídeo', icon: Upload }
	];

	function handleLogout() {
		logout();
		goto(`${base}/login`);
	}

	function isActive(path: string): boolean {
		return page.url.pathname === `${base}${path}`;
	}
</script>

<aside class="w-56 h-screen flex flex-col flex-shrink-0 bg-[#0c0c0c] border-r border-[#1e1e1e]">
	<div class="px-4 py-5 border-b border-[#1e1e1e]">
		<div class="flex items-center gap-2.5">
			<div
				class="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0"
			>
				<Zap size={15} class="text-indigo-400" />
			</div>
			<div>
				<p class="text-sm font-bold text-white tracking-wide">COULSON</p>
				<p class="text-[10px] text-zinc-500 leading-none">Meeting Assistant</p>
			</div>
		</div>
	</div>

	<nav class="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
		{#each navItems as item}
			{@const active = isActive(item.path)}
			{@const Icon = item.icon}
			<a
				href="{base}{item.path}"
				class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150
					{active
					? 'bg-indigo-500/15 text-indigo-300 font-medium'
					: 'text-zinc-400 hover:text-zinc-100 hover:bg-[#181818]'}"
			>
				<Icon size={15} />
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="px-2.5 py-3 border-t border-[#1e1e1e]">
		<button
			onclick={handleLogout}
			class="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm
				text-zinc-500 hover:text-zinc-200 hover:bg-[#181818] transition-all duration-150"
		>
			<LogOut size={15} />
			Sair
		</button>
	</div>
</aside>
