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
		Loader
	} from 'lucide-svelte';
	import { base } from '$app/paths';
	import {
		getAllVideoAssets,
		getTeams,
		getVideoAssetsByTeam,
		type VideoAssetResponse,
		type TeamResponse
	} from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import { getErrorMessage, formatDuration, formatBytes, formatDate, initials } from '$lib/utils';
	import Badge from '$lib/components/Badge.svelte';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';

	let assets = $state<VideoAssetResponse[]>([]);
	let teams = $state<TeamResponse[]>([]);
	let loading = $state(true);
	let selectedTeamId = $state('');

	let playingAsset = $state<VideoAssetResponse | null>(null);

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

						{#if asset.status === 'READY' && asset.playbackUrl}
							<button
								onclick={() => (playingAsset = asset)}
								class="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
									bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/20 transition-colors"
							>
								<Play size={12} />
								Reproduzir
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if playingAsset}
	<VideoPlayer
		src={playingAsset.playbackUrl ?? ''}
		title="{playingAsset.teamName} — {formatDate(playingAsset.createdAt)}"
		onclose={() => (playingAsset = null)}
	/>
{/if}
