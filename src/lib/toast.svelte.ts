export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
}

let nextId = 0;

export const toasts = $state<Toast[]>([]);

export function toast(message: string, type: ToastType = 'info') {
	const id = nextId++;
	toasts.push({ id, message, type });
	setTimeout(() => {
		const idx = toasts.findIndex((t) => t.id === id);
		if (idx !== -1) toasts.splice(idx, 1);
	}, 4500);
}
