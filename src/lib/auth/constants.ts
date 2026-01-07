export const COOKIE_NAME = 'auth_token';
export const REFRESH_COOKIE_NAME = 'auth_refresh';
export const JWT_SECRET: string = process.env.JWT_SECRET || 'neural-threads-secret-key';
export const ACCESS_TOKEN_EXPIRY: string = process.env.JWT_ACCESS_EXPIRY || '7d';
export const REFRESH_TOKEN_EXPIRY: string = process.env.JWT_REFRESH_EXPIRY || '30d';
