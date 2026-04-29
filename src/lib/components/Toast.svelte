<script lang="ts">
	import { toasts } from '$lib/toast.svelte';
	import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-svelte';

	const iconMap = {
		success: CheckCircle,
		error: XCircle,
		warning: AlertTriangle,
		info: Info
	};

	const colorMap = {
		success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
		error: 'border-red-500/30 bg-red-500/10 text-red-300',
		warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
		info: 'border-blue-500/30 bg-blue-500/10 text-blue-300'
	};
</script>

<div class="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
	{#each toasts as t (t.id)}
		{@const Icon = iconMap[t.type]}
		{@const cls = colorMap[t.type]}
		<div
			class="flex items-start gap-3 px-4 py-3 rounded-xl border pointer-events-auto shadow-xl max-w-sm
			bg-[#141414] {cls}"
		>
			<Icon size={16} class="mt-0.5 flex-shrink-0" />
			<p class="text-sm flex-1">{t.message}</p>
		</div>
	{/each}
</div>
