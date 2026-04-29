import {
	PUBLIC_API_BASE_URL,
	PUBLIC_API_BEARER_TOKEN,
	PUBLIC_COULSON_API_TOKEN
} from '$env/static/public';

export const API_BASE = (PUBLIC_API_BASE_URL || 'http://localhost:8080') + '/api/v1';

const API_TOKEN = PUBLIC_COULSON_API_TOKEN;
const BEARER_TOKEN = PUBLIC_API_BEARER_TOKEN;

function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	if (!API_TOKEN && !BEARER_TOKEN) return fetch(input, init);
	const headers = new Headers(init?.headers);
	if (API_TOKEN) headers.set('X-App-Token', API_TOKEN);
	if (BEARER_TOKEN) headers.set('Authorization', `Bearer ${BEARER_TOKEN}`);
	return fetch(input, { ...init, headers });
}

// --- Types ---

export interface TeamResponse {
	id: string;
	name: string;
	createdAt: string;
	members: TeamMemberResponse[];
}

export interface ParticipantResponse {
	id: string;
	name: string;
	role: string;
	voiceSampleKey: string | null;
	createdAt: string;
	teams: { id: string; name: string }[];
}

export interface TeamMemberResponse {
	teamId: string;
	teamName: string;
	participant: ParticipantResponse;
	addedAt: string;
}

export interface TranscriptionSegment {
	speaker: string;
	start: number;
	end: number;
	text: string;
}

export interface TranscriptionResult {
	videoId: string;
	transcription: string;
	totalChunks: number;
	segments: TranscriptionSegment[];
}

export interface TranscriptionJobResponse {
	jobId: string;
	status: 'PROCESSING' | 'DONE' | 'FAILED';
	videoName: string;
	error: string | null;
	result: TranscriptionResult | null;
	createdAt: string;
	updatedAt: string;
}

export interface VideoAssetResponse {
	id: string;
	refId: string;
	teamId: string;
	teamName: string;
	status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
	playbackUrl: string | null;
	hlsMasterUrl: string | null;
	durationMs: number | null;
	width: number | null;
	height: number | null;
	fps: number | null;
	playbackSizeBytes: number | null;
	errorMessage: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ApiError {
	status: number;
	error: string;
	message: string;
	timestamp: string;
}

// --- Error handling ---

async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const err: ApiError = await res.json().catch(() => ({
			status: res.status,
			error: res.statusText,
			message: `HTTP ${res.status}`,
			timestamp: new Date().toISOString()
		}));
		throw err;
	}
	if (res.status === 204) return undefined as T;
	return res.json();
}

// --- Teams ---

export async function getTeams(): Promise<TeamResponse[]> {
	const res = await apiFetch(`${API_BASE}/teams`);
	return handleResponse<TeamResponse[]>(res);
}

export async function getTeam(id: string): Promise<TeamResponse> {
	const res = await apiFetch(`${API_BASE}/teams?id=${id}`);
	return handleResponse<TeamResponse>(res);
}

export async function createTeam(name: string): Promise<TeamResponse> {
	const res = await apiFetch(`${API_BASE}/teams`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name })
	});
	return handleResponse<TeamResponse>(res);
}

export async function deleteTeam(id: string): Promise<void> {
	const res = await apiFetch(`${API_BASE}/teams?id=${id}`, { method: 'DELETE' });
	return handleResponse<void>(res);
}

// --- Participants ---

export async function getParticipants(): Promise<ParticipantResponse[]> {
	const res = await apiFetch(`${API_BASE}/participants`);
	return handleResponse<ParticipantResponse[]>(res);
}

export async function getParticipant(id: string): Promise<ParticipantResponse> {
	const res = await apiFetch(`${API_BASE}/participants?id=${id}`);
	return handleResponse<ParticipantResponse>(res);
}

export async function createParticipant(data: FormData): Promise<ParticipantResponse> {
	const res = await apiFetch(`${API_BASE}/participants`, { method: 'POST', body: data });
	return handleResponse<ParticipantResponse>(res);
}

export async function updateParticipant(id: string, data: FormData): Promise<ParticipantResponse> {
	const res = await apiFetch(`${API_BASE}/participants?id=${id}`, { method: 'PUT', body: data });
	return handleResponse<ParticipantResponse>(res);
}

export async function patchParticipantVoice(
	id: string,
	data: FormData
): Promise<ParticipantResponse> {
	const res = await apiFetch(`${API_BASE}/participants?id=${id}`, { method: 'PATCH', body: data });
	return handleResponse<ParticipantResponse>(res);
}

export async function deleteParticipant(id: string): Promise<void> {
	const res = await apiFetch(`${API_BASE}/participants?id=${id}`, { method: 'DELETE' });
	return handleResponse<void>(res);
}

export function getVoiceSampleUrl(id: string): string {
	const extra = API_TOKEN ? `&X-App-Token=${encodeURIComponent(API_TOKEN)}` : '';
	return `${API_BASE}/participants/voice-sample?id=${id}${extra}`;
}

// --- Team Members ---

export async function addTeamMember(
	teamId: string,
	participantId: string
): Promise<TeamMemberResponse> {
	const res = await apiFetch(`${API_BASE}/team-members?teamId=${teamId}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ participantId })
	});
	return handleResponse<TeamMemberResponse>(res);
}

export async function removeTeamMember(teamId: string, participantId: string): Promise<void> {
	const res = await apiFetch(
		`${API_BASE}/team-members?teamId=${teamId}&participantId=${participantId}`,
		{ method: 'DELETE' }
	);
	return handleResponse<void>(res);
}

export async function getTeamMembers(teamId?: string): Promise<TeamMemberResponse[]> {
	const url = teamId
		? `${API_BASE}/team-members?teamId=${teamId}`
		: `${API_BASE}/team-members`;
	const res = await apiFetch(url);
	return handleResponse<TeamMemberResponse[]>(res);
}

// --- Videos ---

export async function transcribeVideo(
	formData: FormData,
	teamId?: string,
	force?: boolean
): Promise<TranscriptionJobResponse> {
	const params = new URLSearchParams();
	if (teamId) params.set('teamId', teamId);
	if (force) params.set('force', 'true');
	const qs = params.toString();
	const url = `${API_BASE}/videos/transcribe${qs ? '?' + qs : ''}`;
	const res = await apiFetch(url, { method: 'POST', body: formData });
	return handleResponse<TranscriptionJobResponse>(res);
}

export async function getTranscriptionJob(jobId: string): Promise<TranscriptionJobResponse> {
	const res = await apiFetch(`${API_BASE}/videos/transcribe/${jobId}`);
	return handleResponse<TranscriptionJobResponse>(res);
}

export async function getAllVideoAssets(): Promise<VideoAssetResponse[]> {
	const res = await apiFetch(`${API_BASE}/videos/assets`);
	return handleResponse<VideoAssetResponse[]>(res);
}

export async function getVideoAssetsByTeam(teamId: string): Promise<VideoAssetResponse[]> {
	const res = await apiFetch(`${API_BASE}/videos/by-team/${teamId}`);
	return handleResponse<VideoAssetResponse[]>(res);
}

export async function persistVideo(
	teamId: string,
	formData: FormData
): Promise<VideoAssetResponse> {
	const res = await apiFetch(`${API_BASE}/videos/by-team/${teamId}/persist`, {
		method: 'POST',
		body: formData
	});
	return handleResponse<VideoAssetResponse>(res);
}
