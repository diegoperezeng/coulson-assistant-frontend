export function formatDuration(ms: number | null | undefined): string {
	if (!ms) return '--';
	const totalSeconds = Math.floor(ms / 1000);
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = totalSeconds % 60;
	if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatBytes(bytes: number | null | undefined): string {
	if (!bytes) return '--';
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function formatDate(iso: string | null | undefined): string {
	if (!iso) return '--';
	return new Date(iso).toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatSeconds(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${String(s).padStart(2, '0')}`;
}

export function getErrorMessage(e: unknown): string {
	if (e && typeof e === 'object') {
		if ('message' in e) return String((e as { message: unknown }).message);
		if ('error' in e) return String((e as { error: unknown }).error);
	}
	if (typeof e === 'string') return e;
	return 'Erro desconhecido';
}

export function initials(name: string): string {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}
