<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from 'lucide-svelte';

	interface Props {
		title: string;
		onclose: () => void;
		children: Snippet;
		footer?: Snippet;
		size?: 'sm' | 'md' | 'lg';
	}

	let { title, onclose, children, footer, size = 'md' }: Props = $props();

	const sizeClass = {
		sm: 'max-w-sm',
		md: 'max-w-lg',
		lg: 'max-w-2xl'
	};

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
	<div
		class="absolute inset-0 bg-black/70 backdrop-blur-sm"
		role="button"
		tabindex="-1"
		aria-label="Fechar modal"
		onclick={handleBackdrop}
		onkeydown={(e) => e.key === 'Escape' && onclose()}
	></div>
	<div
		class="relative z-10 bg-[#141414] border border-[#252525] rounded-xl shadow-2xl w-full {sizeClass[size]}"
	>
		<div class="flex items-center justify-between px-5 py-4 border-b border-[#252525]">
			<h2 class="text-base font-semibold text-white">{title}</h2>
			<button
				onclick={onclose}
				class="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-[#1e1e1e] transition-colors"
				aria-label="Fechar"
			>
				<X size={16} />
			</button>
		</div>
		<div class="px-5 py-4">
			{@render children()}
		</div>
		{#if footer}
			<div class="flex items-center justify-end gap-3 px-5 py-3 border-t border-[#252525]">
				{@render footer()}
			</div>
		{/if}
	</div>
</div>
