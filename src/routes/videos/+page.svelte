<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Video,
		Play,
		RefreshCw,
		Filter,
		Clock,
		MonitorPlay,
		AlertCircle,
		Loader,
		FileText,
		AlignLeft,
		ListOrdered,
		User
	} from 'lucide-svelte';
	import { base } from '$app/paths';
	import {
		getAllVideoAssets,
		getTeams,
		getVideoAssetsByTeam,
		getTranscriptionJob,
		type VideoAssetResponse,
		type TeamResponse,
		type TranscriptionJobResponse
	} from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import { getErrorMessage, formatDuration, formatBytes, formatDate, formatSeconds, initials } from '$lib/utils';
	import Badge from '$lib/components/Badge.svelte';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let assets = $state<VideoAssetResponse[]>([]);
	let teams = $state<TeamResponse[]>([]);
	let loading = $state(true);
	let selectedTeamId = $state('');

	let playingAsset = $state<VideoAssetResponse | null>(null);

	let transcriptionAsset = $state<VideoAssetResponse | null>(null);
	let transcriptionJob = $state<TranscriptionJobResponse | null>(null);
	let loadingTranscription = $state(false);
	let transcriptionTab = $state<'segments' | 'full'>('segments');

	const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

	function isJobId(refId: string): boolean {
		return UUID_RE.test(refId);
	}

	const speakerColors = [
		'text-indigo-400',
		'text-sky-400',
		'text-emerald-400',
		'text-amber-400',
		'text-rose-400',
		'text-violet-400',
		'text-teal-400'
	];

	function speakerColor(speaker: string): string {
		let hash = 0;
		for (const c of speaker) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
		return speakerColors[hash % speakerColors.length];
	}

	async function openTranscription(asset: VideoAssetResponse) {
		transcriptionAsset = asset;
		transcriptionJob = null;
		loadingTranscription = true;
		transcriptionTab = 'segments';
		try {
			transcriptionJob = await getTranscriptionJob(asset.refId);
		} catch (e: unknown) {
			const status = e && typeof e === 'object' && 'status' in e ? (e as { status: number }).status : 0;
			if (status === 404) {
				transcriptionJob = null;
			} else {
				toast(getErrorMessage(e), 'error');
				transcriptionAsset = null;
			}
		} finally {
			loadingTranscription = false;
		}
	}

	onMount(async () => {
		try {
			const [allAssets, allTeams] = await Promise.all([getAllVideoAssets(), getTeams()]);
			assets = allAssets;
			teams = allTeams;
		} catch (e) {
			toast(getErrorMessage(e), 'error');
		} finally {
			loading = false;
		}
	});

	async function filterByTeam() {
		loading = true;
		try {
			if (selectedTeamId) {
				assets = await getVideoAssetsByTeam(selectedTeamId);
			} else {
				assets = await getAllVideoAssets();
			}
		} catch (e) {
			toast(getErrorMessage(e), 'error');
		} finally {
			loading = false;
		}
	}

	async function reload() {
		loading = true;
		try {
			if (selectedTeamId) {
				assets = await getVideoAssetsByTeam(selectedTeamId);
			} else {
				assets = await getAllVideoAssets();
			}
		} catch (e) {
			toast(getErrorMessage(e), 'error');
		} finally {
			loading = false;
		}
	}

	function teamColor(name: string): string {
		const palette = [
			['#312e81', '#818cf8'],
			['#1e1b4b', '#a5b4fc'],
			['#0c4a6e', '#7dd3fc'],
			['#064e3b', '#6ee7b7'],
			['#4c1d95', '#c4b5fd'],
			['#7f1d1d', '#fca5a5'],
			['#713f12', '#fcd34d']
		];
		let hash = 0;
		for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
		return palette[hash % palette.length].join(',');
	}

	function getCardGradient(name: string): string {
		const colors = teamColor(name).split(',');
		return `linear-gradient(135deg, ${colors[0]} 0%, #0f0f0f 100%)`;
	}

	function getTextColor(name: string): string {
		return teamColor(name).split(',')[1];
	}
</script>

<div class="p-6 max-w-7xl">
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-3">
			<div class="w-9 h-9 rounded-lg bg-sky-500/15 flex items-center justify-center">
				<Video size={17} class="text-sky-400" />
			</div>
			<div>
				<h1 class="text-lg font-bold text-white">Vídeos</h1>
				<p class="text-xs text-zinc-500">
					{assets.length} vídeo{assets.length !== 1 ? 's' : ''}
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<div class="flex items-center gap-1.5">
				<Filter size={13} class="text-zinc-500" />
				<select
					bind:value={selectedTeamId}
					onchange={filterByTeam}
					class="bg-[#1a1a1a] border border-[#252525] text-zinc-300 rounded-lg px-2.5 py-1.5 text-sm
						focus:outline-none focus:border-indigo-500 transition-colors"
				>
					<option value="">Todos os times</option>
					{#each teams as t}
						<option value={t.id}>{t.name}</option>
					{/each}
				</select>
			</div>
			<button
				onclick={reload}
				class="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-[#1a1a1a] transition-colors"
				title="Recarregar"
			>
				<RefreshCw size={15} class={loading ? 'animate-spin' : ''} />
			</button>
			<a
				href="{base}/videos/upload"
				class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
					bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
			>
				<MonitorPlay size={15} />
				Enviar Vídeo
			</a>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center h-40">
			<span class="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></span>
		</div>
	{:else if assets.length === 0}
		<div class="flex flex-col items-center justify-center h-52 text-center">
			<div class="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center mb-3">
				<Video size={20} class="text-zinc-600" />
			</div>
			<p class="text-sm font-medium text-zinc-400">Nenhum vídeo encontrado</p>
			<p class="text-xs text-zinc-600 mt-1">
				{#if selectedTeamId}
					Este time ainda não tem vídeos
				{:else}
					Envie um vídeo para começar
				{/if}
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each assets as asset}
				<div
					class="bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl overflow-hidden hover:border-[#2a2a2a] transition-colors group"
				>
					<div
						class="h-40 relative flex items-center justify-center overflow-hidden"
						style="background: {getCardGradient(asset.teamName)}"
					>
						<div class="text-center">
							<div
								class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-1"
								style="background: rgba(0,0,0,0.3); color: {getTextColor(asset.teamName)}"
							>
								{#if asset.status === 'READY'}
									<Play size={24} />
								{:else if asset.status === 'PROCESSING' || asset.status === 'UPLOADED'}
									<Loader size={24} class="animate-spin" />
								{:else if asset.status === 'FAILED'}
									<AlertCircle size={24} class="text-red-400" />
								{:else}
									<Video size={24} />
								{/if}
							</div>
							<p
								class="text-xl font-bold"
								style="color: {getTextColor(asset.teamName)}"
							>
								{initials(asset.teamName)}
							</p>
						</div>

						{#if asset.status === 'READY' && asset.playbackUrl}
							<button
								onclick={() => (playingAsset = asset)}
								class="absolute inset-0 flex items-center justify-center
									bg-black/0 group-hover:bg-black/50 transition-all duration-200"
							>
								<div
									class="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center
										opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100"
								>
									<Play size={20} class="text-black ml-0.5" />
								</div>
							</button>
						{/if}
					</div>

					<div class="p-3 space-y-2">
						<div class="flex items-center justify-between">
							<p class="text-xs font-medium text-zinc-300 truncate">{asset.teamName}</p>
							<Badge status={asset.status} />
						</div>

						<div class="flex items-center gap-3 text-xs text-zinc-600">
							{#if asset.durationMs}
								<span class="flex items-center gap-1">
									<Clock size={10} />
									{formatDuration(asset.durationMs)}
								</span>
							{/if}
							{#if asset.width && asset.height}
								<span>{asset.width}×{asset.height}</span>
							{/if}
							{#if asset.playbackSizeBytes}
								<span>{formatBytes(asset.playbackSizeBytes)}</span>
							{/if}
						</div>

						{#if asset.errorMessage}
							<p class="text-xs text-red-400 truncate" title={asset.errorMessage}>
								{asset.errorMessage}
							</p>
						{/if}

						<p class="text-xs text-zinc-700">{formatDate(asset.createdAt)}</p>

					<div class="flex gap-2">
						{#if asset.status === 'READY' && asset.playbackUrl}
							<button
								onclick={() => (playingAsset = asset)}
								class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
									bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/20 transition-colors"
							>
								<Play size={11} />
								Reproduzir
							</button>
						{/if}
						{#if isJobId(asset.refId)}
							<button
								onclick={() => openTranscription(asset)}
								class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
									bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
							>
								<FileText size={11} />
								Transcrição
							</button>
						{/if}
					</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if transcriptionAsset}
	<Modal
		title="Transcrição — {transcriptionAsset.teamName}"
		size="xl"
		onclose={() => { transcriptionAsset = null; transcriptionJob = null; }}
	>
		{#if loadingTranscription}
			<div class="flex items-center justify-center py-16">
				<span class="w-6 h-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin"></span>
			</div>
		{:else if !transcriptionJob}
			<div class="flex flex-col items-center justify-center py-14 text-center">
				<div class="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
					<FileText size={20} class="text-zinc-600" />
				</div>
				<p class="text-sm font-medium text-zinc-400">Transcrição não encontrada</p>
				<p class="text-xs text-zinc-600 mt-1">Nenhum job de transcrição associado a este vídeo</p>
			</div>
		{:else if transcriptionJob.status === 'PROCESSING'}
			<div class="flex flex-col items-center justify-center py-14 text-center">
				<Loader size={28} class="text-zinc-500 animate-spin mb-3" />
				<p class="text-sm font-medium text-zinc-400">Transcrição em andamento</p>
				<p class="text-xs text-zinc-600 mt-1">Aguarde a conclusão do processamento</p>
			</div>
		{:else if transcriptionJob.status === 'FAILED'}
			<div class="flex flex-col items-center justify-center py-14 text-center">
				<AlertCircle size={28} class="text-red-400 mb-3" />
				<p class="text-sm font-medium text-zinc-300">Transcrição falhou</p>
				{#if transcriptionJob.error}
					<p class="text-xs text-zinc-500 mt-2 max-w-sm">{transcriptionJob.error}</p>
				{/if}
			</div>
		{:else if transcriptionJob.result}
			{@const result = transcriptionJob.result}
			<div class="space-y-4">
				<div class="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 w-fit">
					<button
						onclick={() => (transcriptionTab = 'segments')}
						class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
							{transcriptionTab === 'segments'
								? 'bg-zinc-700 text-white'
								: 'text-zinc-500 hover:text-zinc-300'}"
					>
						<ListOrdered size={12} />
						Segmentos ({result.segments?.length ?? 0})
					</button>
					<button
						onclick={() => (transcriptionTab = 'full')}
						class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
							{transcriptionTab === 'full'
								? 'bg-zinc-700 text-white'
								: 'text-zinc-500 hover:text-zinc-300'}"
					>
						<AlignLeft size={12} />
						Texto completo
					</button>
				</div>

				{#if transcriptionTab === 'segments'}
					<div class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
						{#if result.segments && result.segments.length > 0}
							{#each result.segments as seg}
								<div class="flex gap-3 py-2.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/60 transition-colors">
									<div class="flex-shrink-0 w-16 text-right">
										<span class="text-xs text-zinc-600 font-mono">{formatSeconds(seg.start)}</span>
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-1.5 mb-1">
											<User size={10} class="text-zinc-600 flex-shrink-0" />
											<span class="text-xs font-semibold {speakerColor(seg.speaker)}">{seg.speaker}</span>
										</div>
										<p class="text-sm text-zinc-300 leading-relaxed">{seg.text}</p>
									</div>
								</div>
							{/each}
						{:else}
							<p class="text-sm text-zinc-500 text-center py-8">Nenhum segmento disponível</p>
						{/if}
					</div>
				{:else}
					<div class="max-h-[60vh] overflow-y-auto">
						<p class="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-900 rounded-lg p-4">
							{result.transcription || 'Texto não disponível'}
						</p>
					</div>
				{/if}

				<div class="flex items-center gap-4 pt-1 border-t border-zinc-800 text-xs text-zinc-600">
					{#if result.totalChunks}
						<span>{result.totalChunks} chunk{result.totalChunks !== 1 ? 's' : ''}</span>
					{/if}
					{#if transcriptionJob.videoName}
						<span class="truncate">{transcriptionJob.videoName}</span>
					{/if}
				</div>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-14 text-center">
				<p class="text-sm text-zinc-500">Resultado não disponível</p>
			</div>
		{/if}
	</Modal>
{/if}

{#if playingAsset}
	<VideoPlayer
		src={playingAsset.playbackUrl ?? ''}
		title="{playingAsset.teamName} — {formatDate(playingAsset.createdAt)}"
		onclose={() => (playingAsset = null)}
	/>
{/if}
