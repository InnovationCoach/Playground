import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getGeminiErrorStatus,
  executeWithRetry,
  withTimeout,
  handleAiError,
  createRateLimiter,
  getFriendlyFeedbackFallback,
  TimeoutError
} from '../server/lib/ai-resilience.js';
import { PERSONAS } from '../server/safety.js';

describe('Server AI Resilience & Error Handling', () => {
  describe('getGeminiErrorStatus', () => {
    it('classifies 429 status or quota/resource_exhausted messages as 429', () => {
      expect(getGeminiErrorStatus({ status: 429 })).toBe(429);
      expect(getGeminiErrorStatus({ statusCode: 429 })).toBe(429);
      expect(getGeminiErrorStatus(new Error('Resource has been exhausted (e.g. check quota).'))).toBe(429);
      expect(getGeminiErrorStatus(new Error('Quota exceeded for quota metric'))).toBe(429);
      expect(getGeminiErrorStatus(new Error('429 Too Many Requests'))).toBe(429);
      expect(getGeminiErrorStatus(new Error('Rate limit exceeded: 5 RPM'))).toBe(429);
    });

    it('classifies 503 status or overload/demand spike messages as 503', () => {
      expect(getGeminiErrorStatus({ status: 503 })).toBe(503);
      expect(getGeminiErrorStatus({ statusCode: 503 })).toBe(503);
      expect(getGeminiErrorStatus(new Error('The model is overloaded. Please try again later.'))).toBe(503);
      expect(getGeminiErrorStatus(new Error('Service Unavailable: high demand'))).toBe(503);
    });

    it('classifies 504 / timeout errors as 504', () => {
      expect(getGeminiErrorStatus({ status: 504 })).toBe(504);
      expect(getGeminiErrorStatus(new TimeoutError())).toBe(504);
      expect(getGeminiErrorStatus(new Error('Gateway Timeout waiting for upstream response'))).toBe(504);
    });

    it('classifies general errors as 500', () => {
      expect(getGeminiErrorStatus(new Error('Unknown internal fault'))).toBe(500);
      expect(getGeminiErrorStatus(null)).toBe(500);
    });
  });

  describe('executeWithRetry', () => {
    it('succeeds on first try if no error occurs', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await executeWithRetry(fn, 1, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries once with backoff when 429 is encountered and succeeds on second attempt', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('429 Quota exceeded'))
        .mockResolvedValueOnce('recovered');

      const result = await executeWithRetry(fn, 1, 10);
      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries once when 503 is encountered and throws if retry also fails', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('503 The model is overloaded.'))
        .mockRejectedValueOnce(new Error('503 The model is overloaded.'));

      await expect(executeWithRetry(fn, 1, 10)).rejects.toThrow('overloaded');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not retry on 400 or other non-transient errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('400 Invalid argument'));
      await expect(executeWithRetry(fn, 1, 10)).rejects.toThrow('Invalid argument');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('withTimeout', () => {
    it('returns operation result if it completes before timeout', async () => {
      const fastOp = new Promise((resolve) => setTimeout(() => resolve('fast-data'), 20));
      const result = await withTimeout(fastOp, 100);
      expect(result).toBe('fast-data');
    });

    it('throws TimeoutError if operation exceeds timeout without fallback', async () => {
      const slowOp = new Promise((resolve) => setTimeout(() => resolve('slow-data'), 100));
      await expect(withTimeout(slowOp, 20)).rejects.toThrow('exceeded timeout');
    });

    it('returns fallback value on timeout when fallback is provided', async () => {
      const slowOp = new Promise((resolve) => setTimeout(() => resolve('slow-data'), 100));
      const result = await withTimeout(slowOp, 20, { fallbackUsed: true });
      expect(result).toEqual({ fallbackUsed: true });
    });
  });

  describe('handleAiError', () => {
    function createMockRes() {
      const res = {
        statusCode: 200,
        headers: {},
        body: null,
        set: vi.fn((key, val) => { res.headers[key] = val; return res; }),
        status: vi.fn((code) => { res.statusCode = code; return res; }),
        json: vi.fn((data) => { res.body = data; return res; })
      };
      return res;
    }

    it('returns 429 with Retry-After header on quota error', () => {
      const res = createMockRes();
      handleAiError(res, new Error('429 Quota exceeded'), 'test-endpoint', 'Fallback message');

      expect(res.statusCode).toBe(429);
      expect(res.set).toHaveBeenCalledWith('Retry-After', '5');
      expect(res.body.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(res.body.retryAfter).toBe(5);
    });

    it('returns 503 with Retry-After header on demand spike / overload', () => {
      const res = createMockRes();
      handleAiError(res, new Error('503 Service Unavailable: overloaded'), 'test-endpoint', 'Fallback message');

      expect(res.statusCode).toBe(503);
      expect(res.set).toHaveBeenCalledWith('Retry-After', '3');
      expect(res.body.code).toBe('SERVICE_UNAVAILABLE');
      expect(res.body.retryAfter).toBe(3);
    });

    it('returns 504 on timeout error', () => {
      const res = createMockRes();
      handleAiError(res, new TimeoutError(), 'test-endpoint', 'Fallback message');

      expect(res.statusCode).toBe(504);
      expect(res.body.code).toBe('GATEWAY_TIMEOUT');
    });

    it('returns 500 with custom message on unexpected errors', () => {
      const res = createMockRes();
      handleAiError(res, new Error('Database disconnected'), 'test-endpoint', 'Tutor is unavailable');

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Tutor is unavailable');
      expect(res.body.code).toBe('AI_SERVICE_ERROR');
    });
  });

  describe('createRateLimiter (memory-leak free)', () => {
    it('allows requests within window and blocks exceeding', () => {
      const limiter = createRateLimiter({ maxEntries: 10 });
      expect(limiter.check('user-1', 2, 1000)).toBe(true);
      expect(limiter.check('user-1', 2, 1000)).toBe(true);
      expect(limiter.check('user-1', 2, 1000)).toBe(false);
    });

    it('prunes expired entries when capacity is reached', () => {
      const limiter = createRateLimiter({ maxEntries: 2 });
      limiter.check('key-1', 5, -100); // Expired immediately
      limiter.check('key-2', 5, -100); // Expired immediately
      limiter.check('key-3', 5, 5000); // Active

      // Exceeds maxEntries -> triggers prune
      expect(limiter.size()).toBe(1);
    });
  });

  describe('Friendly Fallbacks', () => {
    it('creates helpful feedback without throwing', () => {
      const fallback = getFriendlyFeedbackFallback('Solar Car Challenge', 85);
      expect(fallback.feedback).toContain('Solar Car Challenge');
      expect(fallback.feedback).toContain('85%');
      expect(fallback.isFallback).toBe(true);
    });
  });

  describe('Roleplay persona validation', () => {
    it('has valid registered personas including somchai', () => {
      expect(PERSONAS).toBeDefined();
      expect(PERSONAS.somchai).toBeDefined();
      expect(PERSONAS.somchai.name).toBe('Somchai Seenoi');
    });
  });

  describe('requireClaims security contract', () => {
    it('requires authentication and exports requireClaims function', async () => {
      const { requireClaims } = await import('../server/middleware/auth.js');
      expect(typeof requireClaims).toBe('function');
    });
  });
});

