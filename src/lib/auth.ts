import { PUBLIC_ACCESS_PASSWORD } from '$env/static/public';

const KEY = 'coulson_auth';

export function isAuthenticated(): boolean {
	if (typeof window === 'undefined') return false;
	return sessionStorage.getItem(KEY) === '1';
}

export function login(password: string): boolean {
	const expected = PUBLIC_ACCESS_PASSWORD;
	if (!expected || password === expected) {
		sessionStorage.setItem(KEY, '1');
		return true;
	}
	return false;
}

export function logout(): void {
	sessionStorage.removeItem(KEY);
}
