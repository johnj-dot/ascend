/**
 * Resolves the backend API base URL.
 * In development, defaults to 'http://localhost:3001' if not set.
 * In production, uses VITE_API_URL if provided, or relative '' if served from same origin.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');
