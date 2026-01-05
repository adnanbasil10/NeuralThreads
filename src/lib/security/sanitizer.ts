import validator from 'validator';

// Server-side HTML sanitization without jsdom
// Using a simpler approach that works in Node.js without ES Module issues
function sanitizeHtmlServer(value: string): string {
  // Basic HTML sanitization for server-side
  // Remove script tags and event handlers
  let sanitized = value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '');
  
  // Allow safe HTML tags only
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote'];
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    const lowerTag = tagName.toLowerCase();
    if (allowedTags.includes(lowerTag)) {
      // Remove dangerous attributes
      return match.replace(/\s*(on\w+|javascript:|data:text\/html)[^=]*="[^"]*"/gi, '');
    }
    return ''; // Remove disallowed tags
  });
  
  return sanitized;
}

const STRIP_OPTIONS: { keep_new_lines?: boolean } = {
  keep_new_lines: false,
};

export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = validator.trim(value);
  const withoutLow = validator.stripLow(trimmed, STRIP_OPTIONS.keep_new_lines);
  const withoutNull = withoutLow.replace(/\0/g, '');
  return withoutNull;
}

export function sanitizeHtml(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  // Use server-side sanitization (jsdom causes ES Module issues)
  return sanitizeHtmlServer(value);
}

export function sanitizeUrl(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  const url = validator.trim(value);
  if (!validator.isURL(url, { require_protocol: true, allow_protocol_relative_urls: false })) {
    return '';
  }
  const sanitized = sanitizeString(url);
  return sanitized.startsWith('javascript:') ? '' : sanitized;
}

export function sanitizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && validator.isNumeric(value)) {
    return Number(value);
  }
  return fallback;
}

export function sanitizeArray<T>(value: unknown[], sanitizer: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => sanitizer(item)).filter((item) => item !== undefined);
}

export function sanitizePayload<T extends Record<string, unknown>>(payload: T): T {
  const sanitizedEntries = Object.entries(payload).map(([key, value]) => {
    if (typeof value === 'string') {
      return [key, sanitizeString(value)];
    }
    if (Array.isArray(value)) {
      return [key, value.map((item) => (typeof item === 'string' ? sanitizeString(item) : item))];
    }
    if (value && typeof value === 'object') {
      return [key, sanitizePayload(value as Record<string, unknown>)];
    }
    return [key, value];
  });

  return Object.fromEntries(sanitizedEntries) as T;
}

export function sanitizeJsonBody<T>(body: unknown): T {
  if (!body || typeof body !== 'object') {
    return {} as T;
  }
  return sanitizePayload(body as Record<string, unknown>) as T;
}


