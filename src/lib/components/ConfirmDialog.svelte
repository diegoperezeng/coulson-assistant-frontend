<script lang="ts">
	import { AlertTriangle } from 'lucide-svelte';

	interface Props {
		message: string;
		onconfirm: () => void;
		oncancel: () => void;
		busy?: boolean;
		confirmLabel?: string;
	}

	let { message, onconfirm, oncancel, busy = false, confirmLabel = 'Excluir' }: Props = $props();
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
	<div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
	<div
		class="relative z-10 bg-[#141414] border border-[#252525] rounded-xl shadow-2xl w-full max-w-sm"
	>
		<div class="p-5">
			<div class="flex items-start gap-3">
				<div class="flex-shrink-0 w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center mt-0.5">
					<AlertTriangle size={16} class="text-red-400" />
				</div>
				<div>
					<p class="text-sm font-semibold text-white mb-1">Confirmar exclusão</p>
					<p class="text-sm text-zinc-400">{message}</p>
				</div>
			</div>
		</div>
		<div class="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#252525]">
			<button
				onclick={oncancel}
				disabled={busy}
				class="px-3 py-1.5 rounded-lg text-sm text-zinc-300 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#2a2a2a] transition-colors disabled:opacity-50"
			>
				Cancelar
			</button>
			<button
				onclick={onconfirm}
				disabled={busy}
				class="px-3 py-1.5 rounded-lg text-sm text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
			>
				{#if busy}
					<span class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
				{/if}
				{confirmLabel}
			</button>
		</div>
	</div>
</div>
