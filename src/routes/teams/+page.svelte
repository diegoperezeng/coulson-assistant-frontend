<script lang="ts">
	import { onMount } from 'svelte';
	import { Users, Plus, Trash2, UserPlus, UserMinus, RefreshCw } from 'lucide-svelte';
	import {
		getTeams,
		getTeam,
		createTeam,
		deleteTeam,
		getParticipants,
		addTeamMember,
		removeTeamMember,
		type TeamResponse,
		type ParticipantResponse
	} from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import { getErrorMessage, formatDate, initials } from '$lib/utils';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	let teams = $state<TeamResponse[]>([]);
	let loading = $state(true);
	let busy = $state(false);

	let showCreateModal = $state(false);
	let showMembersModal = $state(false);
	let selectedTeam = $state<TeamResponse | null>(null);
	let allParticipants = $state<ParticipantResponse[]>([]);

	let newTeamName = $state('');
	let selectedParticipantId = $state('');
	let confirmDeleteId = $state<string | null>(null);

	let availableParticipants = $derived(
		allParticipants.filter(
			(p) => !selectedTeam?.members.some((m) => m.participant.id === p.id)
		)
	);

	onMount(loadTeams);

	async function loadTeams() {
		loading = true;
		try {
			teams = await getTeams();
		} catch (e) {
			toast(getErrorMessage(e), 'error');
		} finally {
			loading = false;
		}
	}

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		if (!newTeamName.trim()) return;
		busy = true;
		try {
			const team = await createTeam(newTeamName.trim());
			teams.push({ ...team, members: [] });
			newTeamName = '';
			showCreateModal = false;
			toast('Time criado com sucesso', 'success');
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
			await deleteTeam(confirmDeleteId);
			const idx = teams.findIndex((t) => t.id === confirmDeleteId);
			if (idx !== -1) teams.splice(idx, 1);
			toast('Time excluído', 'success');
		} catch (e) {
			toast(getErrorMessage(e), 'error');
		} finally {
			busy = false;
			confirmDeleteId = null;
		}
	}

	async function openMembers(team: TeamResponse) {
		busy = true;
		try {
			const [full, participants] = await Promise.all([getTeam(team.id), getParticipants()]);
			selectedTeam = full;
			allParticipants = participants;
			selectedParticipantId = '';
			showMembersModal = true;
		} catch (e) {
			toast(getErrorMessage(e), 'error');
		} finally {
			busy = false;
		}
	}

	async function handleAddMember(e: SubmitEvent) {
		e.preventDefault();
		if (!selectedTeam || !selectedParticipantId) return;
		busy = true;
		try {
			await addTeamMember(selectedTeam.id, selectedParticipantId);
			selectedTeam = await getTeam(selectedTeam.id);
			const idx = teams.findIndex((t) => t.id === selectedTeam!.id);
			if (idx !== -1) teams[idx] = selectedTeam;
			selectedParticipantId = '';
			toast('Participante adicionado', 'success');
		} catch (e) {
			toast(getErrorMessage(e), 'error');
		} finally {
			busy = false;
		}
	}

	async function handleRemoveMember(participantId: string) {
		if (!selectedTeam) return;
		busy = true;
		try {
			await removeTeamMember(selectedTeam.id, participantId);
			selectedTeam = await getTeam(selectedTeam.id);
			const idx = teams.findIndex((t) => t.id === selectedTeam!.id);
			if (idx !== -1) teams[idx] = selectedTeam;
			toast('Participante removido', 'success');
		} catch (e) {
			toast(getErrorMessage(e), 'error');
		} finally {
			busy = false;
		}
	}

	function teamColor(name: string): string {
		const colors = [
			'bg-indigo-500/20 text-indigo-300',
			'bg-violet-500/20 text-violet-300',
			'bg-sky-500/20 text-sky-300',
			'bg-emerald-500/20 text-emerald-300',
			'bg-rose-500/20 text-rose-300',
			'bg-amber-500/20 text-amber-300',
			'bg-teal-500/20 text-teal-300'
		];
		let hash = 0;
		for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
		return colors[hash % colors.length];
	}
</script>

<div class="p-6 max-w-6xl">
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-3">
			<div class="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
				<Users size={17} class="text-indigo-400" />
			</div>
			<div>
				<h1 class="text-lg font-bold text-white">Times</h1>
				<p class="text-xs text-zinc-500">{teams.length} time{teams.length !== 1 ? 's' : ''} cadastrado{teams.length !== 1 ? 's' : ''}</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={loadTeams}
				class="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-[#1a1a1a] transition-colors"
				title="Recarregar"
			>
				<RefreshCw size={15} class={loading ? 'animate-spin' : ''} />
			</button>
			<button
				onclick={() => (showCreateModal = true)}
				class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
					bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
			>
				<Plus size={15} />
				Novo Time
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center h-40">
			<span class="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></span>
		</div>
	{:else if teams.length === 0}
		<div class="flex flex-col items-center justify-center h-52 text-center">
			<div class="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center mb-3">
				<Users size={20} class="text-zinc-600" />
			</div>
			<p class="text-sm font-medium text-zinc-400">Nenhum time cadastrado</p>
			<p class="text-xs text-zinc-600 mt-1">Crie o primeiro time para começar</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each teams as team}
				<div class="bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl p-4 hover:border-[#2a2a2a] transition-colors">
					<div class="flex items-start gap-3 mb-4">
						<div
							class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 {teamColor(team.name)}"
						>
							{initials(team.name)}
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-semibold text-white truncate">{team.name}</p>
							<p class="text-xs text-zinc-500 mt-0.5">
								{team.members?.length ?? 0} membro{(team.members?.length ?? 0) !== 1 ? 's' : ''}
							</p>
						</div>
					</div>

					<p class="text-xs text-zinc-600 mb-4">Criado em {formatDate(team.createdAt)}</p>

					<div class="flex items-center gap-2">
						<button
							onclick={() => openMembers(team)}
							disabled={busy}
							class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
								bg-[#1a1a1a] hover:bg-[#222] border border-[#252525] text-zinc-300 transition-colors disabled:opacity-50"
						>
							<UserPlus size={13} />
							Membros
						</button>
						<button
							onclick={() => (confirmDeleteId = team.id)}
							disabled={busy}
							class="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
							title="Excluir time"
						>
							<Trash2 size={14} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showCreateModal}
	<Modal
		title="Novo Time"
		onclose={() => {
			showCreateModal = false;
			newTeamName = '';
		}}
	>
		{#snippet children()}
			<form id="team-form" onsubmit={handleCreate} class="space-y-4">
				<div>
					<label class="block text-xs text-zinc-500 mb-1.5" for="team-name">Nome do time</label>
					<input
						id="team-name"
						bind:value={newTeamName}
						type="text"
						placeholder="ex: Time de Produto"
						maxlength="255"
						class="w-full bg-[#1a1a1a] border border-[#252525] text-white rounded-lg px-3 py-2.5 text-sm
							focus:outline-none focus:border-indigo-500 transition-colors"
					/>
				</div>
			</form>
		{/snippet}
		{#snippet footer()}
			<button
				onclick={() => {
					showCreateModal = false;
					newTeamName = '';
				}}
				class="px-3 py-1.5 rounded-lg text-sm text-zinc-300 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#2a2a2a] transition-colors"
			>
				Cancelar
			</button>
			<button
				type="submit"
				form="team-form"
				disabled={busy || !newTeamName.trim()}
				class="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white
					transition-colors disabled:opacity-50 flex items-center gap-2"
			>
				{#if busy}
					<span class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
				{/if}
				Criar Time
			</button>
		{/snippet}
	</Modal>
{/if}

{#if showMembersModal && selectedTeam}
	<Modal
		title="Membros — {selectedTeam.name}"
		size="lg"
		onclose={() => {
			showMembersModal = false;
			selectedTeam = null;
		}}
	>
		{#snippet children()}
			<div class="space-y-4">
				<div>
					<p class="text-xs text-zinc-500 uppercase tracking-wider mb-2">
						Membros atuais ({selectedTeam.members.length})
					</p>
					{#if selectedTeam.members.length === 0}
						<p class="text-sm text-zinc-600 py-3 text-center">Nenhum membro neste time ainda.</p>
					{:else}
						<div class="space-y-1.5">
							{#each selectedTeam.members as member}
								<div
									class="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#252525]"
								>
									<div>
										<p class="text-sm text-white">{member.participant.name}</p>
										<p class="text-xs text-zinc-500">{member.participant.role}</p>
									</div>
									<button
										onclick={() => handleRemoveMember(member.participant.id)}
										disabled={busy}
										class="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
										title="Remover do time"
									>
										<UserMinus size={14} />
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div class="border-t border-[#252525] pt-4">
					<p class="text-xs text-zinc-500 uppercase tracking-wider mb-2">Adicionar participante</p>
					{#if availableParticipants.length === 0}
						<p class="text-sm text-zinc-600 py-2 text-center">
							Todos os participantes já estão no time.
						</p>
					{:else}
						<form onsubmit={handleAddMember} class="flex gap-2">
							<select
								bind:value={selectedParticipantId}
								class="flex-1 bg-[#1a1a1a] border border-[#252525] text-white rounded-lg px-3 py-2 text-sm
									focus:outline-none focus:border-indigo-500 transition-colors"
							>
								<option value="">Selecionar participante...</option>
								{#each availableParticipants as p}
									<option value={p.id}>{p.name} — {p.role}</option>
								{/each}
							</select>
							<button
								type="submit"
								disabled={busy || !selectedParticipantId}
								class="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white
									transition-colors disabled:opacity-50 flex items-center gap-1.5"
							>
								{#if busy}
									<span
										class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
									></span>
								{:else}
									<UserPlus size={14} />
								{/if}
								Adicionar
							</button>
						</form>
					{/if}
				</div>
			</div>
		{/snippet}
	</Modal>
{/if}

{#if confirmDeleteId}
	<ConfirmDialog
		message="Esta ação removerá permanentemente o time e todos os seus membros."
		onconfirm={handleDelete}
		oncancel={() => (confirmDeleteId = null)}
		{busy}
	/>
{/if}
