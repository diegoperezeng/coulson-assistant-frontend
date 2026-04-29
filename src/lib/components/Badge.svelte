<script lang="ts">
	interface Props {
		status: string;
	}

	let { status }: Props = $props();

	const colorMap: Record<string, string> = {
		READY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
		DONE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
		PROCESSING: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
		UPLOADED: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
		FAILED: 'bg-red-500/15 text-red-400 border-red-500/25'
	};

	const labelMap: Record<string, string> = {
		READY: 'Pronto',
		DONE: 'Concluído',
		PROCESSING: 'Processando',
		UPLOADED: 'Enviado',
		FAILED: 'Falhou'
	};

	let cls = $derived(
		colorMap[status] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25'
	);
	let label = $derived(labelMap[status] ?? status);
</script>

<span
	class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border {cls}"
>
	{#if status === 'PROCESSING'}
		<span
			class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"
		></span>
	{/if}
	{label}
</span>
