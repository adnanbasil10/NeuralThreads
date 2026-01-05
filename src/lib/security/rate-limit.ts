import rateLimit, {
  type Options as RateLimitOptions,
  type RateLimitRequestHandler,
} from 'express-rate-limit';
import type { NextRequest } from 'next/server';

export class RateLimitError extends Error {
  statusCode: number;
  retryAfter?: number;
  limit?: number;

  constructor(message: string, statusCode = 429, retryAfter?: number, limit?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
    this.limit = limit;
  }
}

type MockRequest = Parameters<RateLimitRequestHandler>[0];
type MockResponse = Parameters<RateLimitRequestHandler>[1];

const BASE_OPTIONS: Partial<RateLimitOptions> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  requestPropertyName: 'rateLimit',
  skipFailedRequests: false,
  handler: (_req, _res, _next, options) => {
    const retryAfter = options.windowMs ? Math.ceil(options.windowMs / 1000) : undefined;
    throw new RateLimitError(
      options.message?.toString() || 'Too many requests',
      options.statusCode ?? 429,
      retryAfter,
      (options as unknown as { limit?: number; max?: number }).limit ??
        (options as unknown as { limit?: number; max?: number }).max
    );
  },
};

function createLimiter(options: Partial<RateLimitOptions>): RateLimitRequestHandler {
  return rateLimit({
    ...BASE_OPTIONS,
    ...options,
  });
}

export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
});

export const signupLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 3,
});

export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 200, // Increased from 100 to 200 for better UX
});

// More lenient limiter for chat endpoints (real-time communication needs)
export const chatLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300, // Higher limit for chat messages
});

// More lenient limiter for wardrobe operations
export const wardrobeLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 150, // Higher limit for wardrobe operations
});

function createMockRequest(request: NextRequest, keyOverride?: string): MockRequest {
  const headers = Object.fromEntries(request.headers.entries());
  const ip =
    keyOverride ||
    (request as any).ip ||
    headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    headers['cf-connecting-ip'] ||
    '0.0.0.0';

  return {
    ip,
    method: request.method,
    path: request.nextUrl.pathname,
    originalUrl: request.nextUrl.pathname,
    headers,
    socket: { remoteAddress: ip } as unknown as MockRequest['socket'],
  } as MockRequest;
}

function createMockResponse(): MockResponse {
  const headers = new Map<string, string>();
  return {
    statusCode: 200,
    setHeader: (name: string, value: string) => {
      headers.set(name, value);
    },
    getHeader: (name: string) => headers.get(name),
    headersSent: false,
    end: () => undefined,
    json: () => undefined,
    send: () => undefined,
    status(this: MockResponse, code: number) {
      this.statusCode = code;
      return this;
    },
  } as MockResponse;
}

export async function enforceRateLimit(
  request: NextRequest,
  limiter: RateLimitRequestHandler,
  keyOverride?: string
): Promise<void> {
  const req = createMockRequest(request, keyOverride);
  const res = createMockResponse();

  await new Promise<void>((resolve, reject) => {
    const next = (err?: unknown) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    };

    try {
      // express-rate-limit is synchronous, but we need to handle it properly
      const result = limiter(req, res, next);
      // If limiter returns a promise, wait for it
      if (result && typeof result.then === 'function') {
        result.catch(reject);
      }
    } catch (error) {
      reject(error);
    }
  }).catch((error) => {
    if (error instanceof RateLimitError) {
      throw error;
    }
    throw new RateLimitError('Too many requests');
  });
}


