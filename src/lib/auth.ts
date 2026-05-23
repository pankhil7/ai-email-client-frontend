const TOKEN_KEY = 'mailai_access_token';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // sends httpOnly cookie
    });
    if (!res.ok) return null;
    const { accessToken } = await res.json();
    setAccessToken(accessToken);
    return accessToken;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  clearAccessToken();
  try {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {}
  window.location.href = '/';
}
