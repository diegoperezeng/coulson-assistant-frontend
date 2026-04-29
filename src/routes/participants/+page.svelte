<script lang="ts">
	import { onMount } from 'svelte';
	import { User, Plus, Trash2, Pencil, Mic, Download, RefreshCw, MicOff } from 'lucide-svelte';
	import {
		getParticipants,
		createParticipant,
		updateParticipant,
		patchParticipantVoice,
		deleteParticipant,
		getVoiceSampleUrl,
		type ParticipantResponse
	} from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import { getErrorMessage, formatDate, initials } from '$lib/utils';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	let participants = $state<ParticipantResponse[]>([]);
	let loading = $state(true);
	let busy = $state(false);

	let showFormModal = $state(false);
	let showVoiceModal = $state(false);
	let editingParticipant = $state<ParticipantResponse | null>(null);
	let confirmDeleteId = $state<string | null>(null);

	let formName = $state('');
	let formRole = $state('');
	let formVoiceFile = $state<File | null>(null);
	let voiceOnlyFile = $state<File | null>(null);
	let voiceFileInput: HTMLInputElement | undefined = $state();
	let voiceOnlyInput: HTMLInputElement | undefined = $state();

	const VOICE_FORMATS = '.m4a,.mp3,.wav,.ogg,.flac';

	onMount(loadParticipants);

	async function loadParticipants() {
		loading = true;
		try {
			participants = await getParticipants();
		} catch (e) {
			toast(getErrorMessage(e), 'error');
		} finally {
			loading = false;
		}
	}

	function openCreate() {
		editingParticipant = null;
		formName = '';
		formRole = '';
		formVoiceFile = null;
		showFormModal = true;
	}

	function openEdit(p: ParticipantResponse) {
		editingParticipant = p;
		formName = p.name;
		formRole = p.role;
		formVoiceFile = null;
		showFormModal = true;
	}

	function openVoice(p: ParticipantResponse) {
		editingParticipant = p;
		voiceOnlyFile = null;
		showVoiceModal = true;
	}

	async function handleSubmitForm(e: SubmitEvent) {
		e.preventDefault();
		if (!formName.trim()) return;
		busy = true;
		const data = new FormData();
		data.append('name', formName.trim());
		if (formRole.trim()) data.append('role', formRole.trim());
		if (formVoiceFile) data.append('voiceSample', formVoiceFile);

		try {
			if (editingParticipant) {
				const updated = await updateParticipant(editingParticipant.id, data);
				const idx = participants.findIndex((p) => p.id === editingParticipant!.id);
				if (idx !== -1) participants[idx] = updated;
				toast('Participante atualizado', 'success');
			} else {
				const created = await createParticipant(data);
				participants.push(created);
				toast('Participante cadastrado com sucesso', 'success');
			}
			showFormModal = false;
		} catch (e) {
			toast(getErrorMessage(e), 'error');
		} finally {
			busy = false;
		}
	}

	async function handleSubmitVoice(e: SubmitEvent) {
		e.preventDefault();
		if (!editingParticipant || !voiceOnlyFile) return;
		busy = true;
		const data = new FormData();
		data.append('voiceSample', voiceOnlyFile);
		try {
			const updated = await patchParticipantVoice(editingParticipant.id, data);
			const idx = participants.findIndex((p) => p.id === editingParticipant!.id);
			if (idx !== -1) participants[idx] = updated;
			toast('Amostra de voz atualizada', 'success');
			showVoiceModal = false;
		} catch (e) {
			toast(getErrorMessage(e), 'error');
		} finally {
			busy = false;
		}
	}

	async function handleDelete() {
		if (!confirmDeleteId) return;
		busy = true;
		try {
			await deleteParticipant(confirmDeleteId);
			const idx = participants.findIndex((p) => p.id === confirmDeleteId);
			if (idx !== -1) participants.splice(idx, 1);
			toast('Participante excluído', 'success');
		} catch (e) {
			toast(getErrorMessage(e), 'error');
		} finally {
			busy = false;
			confirmDeleteId = null;
		}
	}

	function participantColor(name: string): string {
		const colors = [
			'bg-indigo-500/20 text-indigo-300',
			'bg-violet-500/20 text-violet-300',
			'bg-sky-500/20 text-sky-300',
			'bg-emerald-500/20 text-emerald-300',
			'bg-rose-500/20 text-rose-300',
			'bg-amber-500/20 text-amber-300'
		];
		let hash = 0;
		for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
		return colors[hash % colors.length];
	}
</script>

<div class="p-6 max-w-6xl">
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-3">
			<div class="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
				<User size={17} class="text-violet-400" />
			</div>
			<div>
				<h1 class="text-lg font-bold text-white">Participantes</h1>
				<p class="text-xs text-zinc-500">
					{participants.length} participante{participants.length !== 1 ? 's' : ''} cadastrado{participants.length !== 1 ? 's' : ''}
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={loadParticipants}
				class="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-[#1a1a1a] transition-colors"
				title="Recarregar"
			>
				<RefreshCw size={15} class={loading ? 'animate-spin' : ''} />
			</button>
			<button
				onclick={openCreate}
				class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
					bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
			>
				<Plus size={15} />
				Novo Participante
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center h-40">
			<span class="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></span>
		</div>
	{:else if participants.length === 0}
		<div class="flex flex-col items-center justify-center h-52 text-center">
			<div class="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center mb-3">
				<User size={20} class="text-zinc-600" />
			</div>
			<p class="text-sm font-medium text-zinc-400">Nenhum participante cadastrado</p>
			<p class="text-xs text-zinc-600 mt-1">Cadastre participantes para associá-los a times</p>
		</div>
	{:else}
		<div class="bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl overflow-hidden">
			<table class="w-full">
				<thead>
					<tr class="border-b border-[#1e1e1e]">
						<th class="text-left text-xs text-zinc-600 font-medium uppercase tracking-wider px-4 py-3">Participante</th>
						<th class="text-left text-xs text-zinc-600 font-medium uppercase tracking-wider px-4 py-3">Cargo</th>
						<th class="text-left text-xs text-zinc-600 font-medium uppercase tracking-wider px-4 py-3">Times</th>
						<th class="text-left text-xs text-zinc-600 font-medium uppercase tracking-wider px-4 py-3">Voz</th>
						<th class="text-left text-xs text-zinc-600 font-medium uppercase tracking-wider px-4 py-3">Cadastrado em</th>
						<th class="text-right text-xs text-zinc-600 font-medium uppercase tracking-wider px-4 py-3">Ações</th>
					</tr>
				</thead>
				<tbody>
					{#each participants as p}
						<tr class="border-b border-[#1e1e1e] last:border-0 hover:bg-[#131313] transition-colors">
							<td class="px-4 py-3">
								<div class="flex items-center gap-2.5">
									<div
										class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 {participantColor(p.name)}"
									>
										{initials(p.name)}
									</div>
									<span class="text-sm text-white font-medium">{p.name}</span>
								</div>
							</td>
							<td class="px-4 py-3">
								<span class="text-sm text-zinc-400">{p.role || '—'}</span>
							</td>
							<td class="px-4 py-3">
								{#if p.teams && p.teams.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each p.teams as t}
											<span class="px-2 py-0.5 rounded-md text-xs bg-[#1e1e1e] text-zinc-400 border border-[#2a2a2a]">{t.name}</span>
										{/each}
									</div>
								{:else}
									<span class="text-xs text-zinc-600">—</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								{#if p.voiceSampleKey}
									<div class="flex items-center gap-2">
										<span class="flex items-center gap-1 text-xs text-emerald-400">
											<Mic size={12} /> Sim
										</span>
										<a
											href={getVoiceSampleUrl(p.id)}
											download
											class="p-1 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
											title="Baixar amostra"
										>
											<Download size={13} />
										</a>
									</div>
								{:else}
									<span class="flex items-center gap-1 text-xs text-zinc-600">
										<MicOff size={12} /> Sem amostra
									</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								<span class="text-xs text-zinc-600">{formatDate(p.createdAt)}</span>
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-end gap-1">
									<button
										onclick={() => openEdit(p)}
										class="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-200 hover:bg-[#1e1e1e] transition-colors"
										title="Editar"
									>
										<Pencil size={13} />
									</button>
									<button
										onclick={() => openVoice(p)}
										class="p-1.5 rounded-lg text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
										title="Amostra de voz"
									>
										<Mic size={13} />
									</button>
									<button
										onclick={() => (confirmDeleteId = p.id)}
										class="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
										title="Excluir"
									>
										<Trash2 size={13} />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if showFormModal}
	<Modal
		title={editingParticipant ? 'Editar Participante' : 'Novo Participante'}
		onclose={() => (showFormModal = false)}
	>
		{#snippet children()}
			<form id="participant-form" onsubmit={handleSubmitForm} class="space-y-4">
				<div>
					<label class="block text-xs text-zinc-500 mb-1.5" for="p-name">Nome completo *</label>
					<input
						id="p-name"
						bind:value={formName}
						type="text"
						placeholder="Nome do participante"
						required
						class="w-full bg-[#1a1a1a] border border-[#252525] text-white rounded-lg px-3 py-2.5 text-sm
							focus:outline-none focus:border-indigo-500 transition-colors"
					/>
				</div>
				<div>
					<label class="block text-xs text-zinc-500 mb-1.5" for="p-role">Cargo</label>
					<input
						id="p-role"
						bind:value={formRole}
						type="text"
						placeholder="ex: Engenheiro de Software"
						class="w-full bg-[#1a1a1a] border border-[#252525] text-white rounded-lg px-3 py-2.5 text-sm
							focus:outline-none focus:border-indigo-500 transition-colors"
					/>
				</div>
				<div>
					<label class="block text-xs text-zinc-500 mb-1.5" for="p-voice">
						Amostra de voz (opcional)
					</label>
					<input
						bind:this={voiceFileInput}
						id="p-voice"
						type="file"
						accept={VOICE_FORMATS}
						onchange={(e) => {
							formVoiceFile = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
						}}
						class="w-full bg-[#1a1a1a] border border-[#252525] text-zinc-400 rounded-lg px-3 py-2 text-sm
							focus:outline-none focus:border-indigo-500 transition-colors"
					/>
					<p class="text-xs text-zinc-600 mt-1">Formatos: M4A, MP3, WAV, OGG, FLAC</p>
					{#if editingParticipant?.voiceSampleKey}
						<p class="text-xs text-zinc-500 mt-1">
							Amostra atual: {editingParticipant.voiceSampleKey} — enviar novo arquivo para substituir
						</p>
					{/if}
				</div>
			</form>
		{/snippet}
		{#snippet footer()}
			<button
				onclick={() => (showFormModal = false)}
				class="px-3 py-1.5 rounded-lg text-sm text-zinc-300 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#2a2a2a] transition-colors"
			>
				Cancelar
			</button>
			<button
				form="participant-form"
				type="submit"
				disabled={busy || !formName.trim()}
				class="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white
					transition-colors disabled:opacity-50 flex items-center gap-2"
			>
				{#if busy}
					<span class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
				{/if}
				{editingParticipant ? 'Salvar' : 'Cadastrar'}
			</button>
		{/snippet}
	</Modal>
{/if}

{#if showVoiceModal && editingParticipant}
	<Modal
		title="Amostra de Voz — {editingParticipant.name}"
		onclose={() => (showVoiceModal = false)}
		size="sm"
	>
		{#snippet children()}
			<form id="voice-form" onsubmit={handleSubmitVoice} class="space-y-4">
				<p class="text-sm text-zinc-400">
					{#if editingParticipant.voiceSampleKey}
						Substituir a amostra de voz existente ({editingParticipant.voiceSampleKey}).
					{:else}
						Nenhuma amostra de voz cadastrada. Envie um arquivo de áudio.
					{/if}
				</p>
				<div>
					<input
						bind:this={voiceOnlyInput}
						type="file"
						accept={VOICE_FORMATS}
						required
						onchange={(e) => {
							voiceOnlyFile = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
						}}
						class="w-full bg-[#1a1a1a] border border-[#252525] text-zinc-400 rounded-lg px-3 py-2 text-sm
							focus:outline-none focus:border-indigo-500 transition-colors"
					/>
					<p class="text-xs text-zinc-600 mt-1">Formatos: M4A, MP3, WAV, OGG, FLAC</p>
				</div>
			</form>
		{/snippet}
		{#snippet footer()}
			<button
				onclick={() => (showVoiceModal = false)}
				class="px-3 py-1.5 rounded-lg text-sm text-zinc-300 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#2a2a2a] transition-colors"
			>
				Cancelar
			</button>
			<button
				form="voice-form"
				type="submit"
				disabled={busy || !voiceOnlyFile}
				class="px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white
					transition-colors disabled:opacity-50 flex items-center gap-2"
			>
				{#if busy}
					<span class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
				{/if}
				Enviar
			</button>
		{/snippet}
	</Modal>
{/if}

{#if confirmDeleteId}
	<ConfirmDialog
		message="Esta ação removerá o participante permanentemente."
		onconfirm={handleDelete}
		oncancel={() => (confirmDeleteId = null)}
		{busy}
	/>
{/if}
