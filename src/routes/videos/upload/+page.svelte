<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Upload,
		FileVideo,
		CheckCircle2,
		XCircle,
		Loader,
		RefreshCw,
		ChevronDown,
		ChevronUp,
		Clock
	} from 'lucide-svelte';
	import {
		getTeams,
		transcribeVideo,
		getTranscriptionJob,
		type TeamResponse,
		type TranscriptionJobResponse
	} from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import { getErrorMessage, formatDate, formatSeconds } from '$lib/utils';

	let teams = $state<TeamResponse[]>([]);
	let selectedTeamId = $state('');
	let forceRetranscribe = $state(false);
	let videoFile = $state<File | null>(null);
	let busy = $state(false);
	let isDragging = $state(false);

	let job = $state<TranscriptionJobResponse | null>(null);
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let pollCount = $state(0);
	let showFullTranscript = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();

	onMount(async () => {
		try {
			teams = await getTeams();
		} catch (e) {
			toast(getErrorMessage(e), 'error');
		}
	});

	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
	});

	function startPolling(jobId: string) {
		if (pollInterval) clearInterval(pollInterval);
		pollCount = 0;
		pollInterval = setInterval(async () => {
			pollCount++;
			try {
				const updated = await getTranscriptionJob(jobId);
				job = updated;
				if (updated.status === 'DONE' || updated.status === 'FAILED') {
					clearInterval(pollInterval!);
					pollInterval = null;
					if (updated.status === 'DONE') {
						toast('Transcrição concluída com sucesso', 'success');
					} else {
						toast('Falha na transcrição: ' + (updated.error ?? 'erro desconhecido'), 'error');
					}
				}
			} catch (e) {
				toast(getErrorMessage(e), 'error');
				clearInterval(pollInterval!);
				pollInterval = null;
			}
		}, 4000);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!videoFile) return;
		busy = true;
		job = null;
		showFullTranscript = false;

		const formData = new FormData();
		formData.append('file', videoFile);

		try {
			const submitted = await transcribeVideo(
				formData,
				selectedTeamId || undefined,
				forceRetranscribe
			);
			job = submitted;
			toast('Vídeo enviado para transcrição', 'info');
			if (submitted.status === 'PROCESSING') {
				startPolling(submitted.jobId);
			}
		} catch (e) {
			toast(getErrorMessage(e), 'error');
		} finally {
			busy = false;
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) videoFile = file;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleFileInput(e: Event) {
		videoFile = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
		return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
	}

	function resetForm() {
		videoFile = null;
		selectedTeamId = '';
		forceRetranscribe = false;
		job = null;
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
		if (fileInput) fileInput.value = '';
	}

	let isPolling = $derived(pollInterval !== null);
</script>

<div class="p-6 max-w-3xl">
	<div class="flex items-center gap-3 mb-6">
		<div class="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
			<Upload size={17} class="text-indigo-400" />
		</div>
		<div>
			<h1 class="text-lg font-bold text-white">Enviar Vídeo para Transcrição</h1>
			<p class="text-xs text-zinc-500">Envie uma reunião para ser transcrita com identificação de locutores</p>
		</div>
	</div>

	<div class="bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl p-5 space-y-5">
		<form onsubmit={handleSubmit} class="space-y-5">
			<div>
				<label class="block text-xs text-zinc-500 mb-1.5" for="team-select">
					Time <span class="text-zinc-600">(opcional)</span>
				</label>
				<select
					id="team-select"
					bind:value={selectedTeamId}
					class="w-full bg-[#1a1a1a] border border-[#252525] text-zinc-300 rounded-lg px-3 py-2.5 text-sm
						focus:outline-none focus:border-indigo-500 transition-colors"
				>
					<option value="">Selecionar time...</option>
					{#each teams as t}
						<option value={t.id}>{t.name}</option>
					{/each}
				</select>
				<p class="text-xs text-zinc-600 mt-1">
					Ao selecionar um time, os participantes são usados para identificar locutores e o vídeo é salvo no storage.
				</p>
			</div>

			<div>
			<label class="block text-xs text-zinc-500 mb-1.5" for="video-file-input">Arquivo de vídeo *</label>
			<div
				class="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
					{isDragging
					? 'border-indigo-500 bg-indigo-500/5'
					: videoFile
						? 'border-emerald-500/40 bg-emerald-500/5'
						: 'border-[#252525] hover:border-[#333] bg-[#141414]'}"
				role="button"
				tabindex="0"
				ondrop={handleDrop}
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				onclick={() => fileInput?.click()}
				onkeydown={(e) => e.key === 'Enter' && fileInput?.click()}
			>
					{#if videoFile}
						<div class="flex flex-col items-center gap-2">
							<div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
								<FileVideo size={22} class="text-emerald-400" />
							</div>
							<div>
								<p class="text-sm font-medium text-white">{videoFile.name}</p>
								<p class="text-xs text-zinc-500 mt-0.5">{formatFileSize(videoFile.size)}</p>
							</div>
							<button
								type="button"
								onclick={(e) => {
									e.stopPropagation();
									videoFile = null;
									if (fileInput) fileInput.value = '';
								}}
								class="text-xs text-zinc-500 hover:text-red-400 transition-colors mt-1"
							>
								Remover arquivo
							</button>
						</div>
					{:else}
						<div class="flex flex-col items-center gap-2">
							<div class="w-12 h-12 rounded-xl bg-[#1e1e1e] flex items-center justify-center">
								<FileVideo size={22} class="text-zinc-500" />
							</div>
							<div>
								<p class="text-sm font-medium text-zinc-300">
									Arraste o arquivo aqui ou <span class="text-indigo-400">clique para selecionar</span>
								</p>
								<p class="text-xs text-zinc-600 mt-1">MP4, MOV, MKV, AVI, WEBM · Máx 4 GB</p>
							</div>
						</div>
					{/if}
				</div>
				<input
					bind:this={fileInput}
					id="video-file-input"
					type="file"
					accept="video/*"
					onchange={handleFileInput}
					class="hidden"
				/>
			</div>

			<div>
				<label class="flex items-center gap-2.5 cursor-pointer group">
					<div class="relative">
						<input
							type="checkbox"
							bind:checked={forceRetranscribe}
							class="w-4 h-4 rounded border border-[#252525] bg-[#1a1a1a] accent-indigo-500 cursor-pointer"
						/>
					</div>
					<div>
						<p class="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
							Forçar nova transcrição
						</p>
						<p class="text-xs text-zinc-600">
							Reprocessa mesmo que este arquivo já tenha sido transcrito anteriormente
						</p>
					</div>
				</label>
			</div>

			<div class="flex items-center justify-between pt-2 border-t border-[#1e1e1e]">
				{#if job}
					<button
						type="button"
						onclick={resetForm}
						class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400
							hover:text-zinc-200 hover:bg-[#1a1a1a] transition-colors"
					>
						<RefreshCw size={14} />
						Novo envio
					</button>
				{:else}
					<span></span>
				{/if}
				<button
					type="submit"
					disabled={busy || !videoFile || isPolling}
					class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
						bg-indigo-500 hover:bg-indigo-600 text-white transition-colors
						disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if busy}
						<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
						Enviando...
					{:else}
						<Upload size={15} />
						Enviar e Transcrever
					{/if}
				</button>
			</div>
		</form>
	</div>

	{#if job}
		<div class="mt-5 bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl overflow-hidden">
			<div class="px-5 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
				<div class="flex items-center gap-3">
					{#if job.status === 'PROCESSING'}
						<Loader size={16} class="text-blue-400 animate-spin" />
						<span class="text-sm font-semibold text-blue-400">Processando...</span>
					{:else if job.status === 'DONE'}
						<CheckCircle2 size={16} class="text-emerald-400" />
						<span class="text-sm font-semibold text-emerald-400">Transcrição Concluída</span>
					{:else if job.status === 'FAILED'}
						<XCircle size={16} class="text-red-400" />
						<span class="text-sm font-semibold text-red-400">Falha na Transcrição</span>
					{/if}
				</div>
				{#if isPolling}
					<span class="text-xs text-zinc-600">
						Verificando... ({pollCount})
					</span>
				{/if}
			</div>

			<div class="px-5 py-4 space-y-2">
				<div class="grid grid-cols-2 gap-3 text-sm">
					<div>
						<p class="text-xs text-zinc-600 mb-0.5">Arquivo</p>
						<p class="text-zinc-300 truncate">{job.videoName}</p>
					</div>
					<div>
						<p class="text-xs text-zinc-600 mb-0.5">Job ID</p>
						<p class="text-zinc-500 font-mono text-xs truncate">{job.jobId}</p>
					</div>
					<div>
						<p class="text-xs text-zinc-600 mb-0.5">Criado em</p>
						<p class="text-zinc-400 text-xs">{formatDate(job.createdAt)}</p>
					</div>
					<div>
						<p class="text-xs text-zinc-600 mb-0.5">Atualizado em</p>
						<p class="text-zinc-400 text-xs">{formatDate(job.updatedAt)}</p>
					</div>
				</div>

				{#if job.status === 'PROCESSING'}
					<div class="mt-3">
						<div class="h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
							<div class="h-full bg-blue-500 rounded-full animate-pulse w-1/2"></div>
						</div>
						<p class="text-xs text-zinc-600 mt-1.5">
							Processando áudio e identificando locutores... isso pode levar alguns minutos.
						</p>
					</div>
				{/if}

				{#if job.status === 'FAILED' && job.error}
					<div class="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
						<p class="text-xs text-red-400">{job.error}</p>
					</div>
				{/if}

				{#if job.status === 'DONE' && job.result}
					<div class="mt-4 space-y-4">
						<div>
							<div class="flex items-center justify-between mb-2">
								<p class="text-xs text-zinc-500 uppercase tracking-wider font-medium">
									Segmentos ({job.result.segments.length}) — {job.result.totalChunks} chunk{job.result.totalChunks !== 1 ? 's' : ''} processados
								</p>
							</div>
							<div class="space-y-1.5 max-h-72 overflow-y-auto pr-1">
								{#each job.result.segments as seg}
									<div class="flex items-start gap-3 px-3 py-2 rounded-lg bg-[#141414] border border-[#1e1e1e]">
										<div class="flex-shrink-0 text-right min-w-[70px]">
											<span class="text-xs font-mono text-zinc-600">
												{formatSeconds(seg.start)} → {formatSeconds(seg.end)}
											</span>
										</div>
										<div class="flex-shrink-0">
											<span
												class="px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
											>
												{seg.speaker}
											</span>
										</div>
										<p class="text-sm text-zinc-300 leading-relaxed">{seg.text}</p>
									</div>
								{/each}
							</div>
						</div>

						<div>
							<button
								onclick={() => (showFullTranscript = !showFullTranscript)}
								class="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-2"
							>
								{#if showFullTranscript}
									<ChevronUp size={13} />
									Ocultar transcrição completa
								{:else}
									<ChevronDown size={13} />
									Ver transcrição completa
								{/if}
							</button>
							{#if showFullTranscript}
								<div class="p-4 rounded-lg bg-[#141414] border border-[#1e1e1e] max-h-60 overflow-y-auto">
									<p class="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
										{job.result.transcription}
									</p>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
