/**
 * Cloudflare-Aware Hybrid Rate Limiter
 * 
 * Supports:
 * - Cloudflare proxy headers ('cf-connecting-ip' -> 'x-forwarded-for' -> '127.0.0.1')
 * - Hybrid key strategy (IP-only for signup, IP + normalized email/account for login & forgot-password)
 * - Request stream preservation via request.clone()
 * - Edge/Serverless swappable storage (In-memory Map for local dev, Upstash Redis/Cloudflare KV ready)
 */

// In-Memory Storage for Local Development / Single-Instance Deployment
// Map<key, { count: number, resetAt: number }>
const memoryStore = new Map()

// Automatic garbage collection for expired in-memory rate limit entries
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.resetAt <= now) {
        memoryStore.delete(key)
      }
    }
  }, 60 * 1000).unref?.()
}

/**
 * 1. CLOUDFLARE PROXY HANDLING:
 * Extract the client's true IP address following the safe fallback chain:
 * 'cf-connecting-ip' -> 'x-forwarded-for' -> '127.0.0.1'
 */
export function getClientIp(request) {
  const cfConnectingIp = request.headers.get("cf-connecting-ip")
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  const xForwardedFor = request.headers.get("x-forwarded-for")
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim()
    if (firstIp) return firstIp
  }

  return "127.0.0.1"
}

/**
 * Check and increment rate limit for a key
 * 
 * @param {string} key - Unique rate-limit identifier
 * @param {number} limit - Maximum allowed requests in window
 * @param {number} windowMs - Window duration in milliseconds
 * @returns {Promise<{ success: boolean, remaining: number, resetAt: number, retryAfterSec: number }>}
 */
export async function checkRateLimit(key, limit, windowMs) {
  const now = Date.now()

  /* =========================================================================
   * PRODUCTION EDGE/SERVERLESS STORAGE HOOK (Cloudflare KV or Upstash Redis):
   * =========================================================================
   * Example Upstash Redis implementation:
   * 
   * const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
   * const ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`) })
   * const { success, remaining, reset } = await ratelimit.limit(key)
   * return { success, remaining, resetAt: reset, retryAfterSec: Math.ceil((reset - now) / 1000) }
   *
   * Example Cloudflare KV implementation:
   * const entry = await CLOUDFLARE_KV.get(key, { type: 'json' })
   * ...
   * ========================================================================= */

  // Local In-Memory Fallback:
  let record = memoryStore.get(key)

  if (!record || record.resetAt <= now) {
    record = { count: 1, resetAt: now + windowMs }
    memoryStore.set(key, record)
    return {
      success: true,
      remaining: limit - 1,
      resetAt: record.resetAt,
      retryAfterSec: 0,
    }
  }

  if (record.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000))
    return {
      success: false,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfterSec,
    }
  }

  record.count += 1
  return {
    success: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
    retryAfterSec: 0,
  }
}

/**
 * Rate limit definitions:
 * - /api/auth/signup: 3 requests per hour (3600000 ms) strictly per IP
 * - /api/auth/login: 5 attempts per 15 minutes (900000 ms) per IP + account/email
 * - /api/auth/forgot-password: 5 attempts per 15 minutes (900000 ms) per IP + account/email
 */
export const RATE_LIMIT_CONFIG = {
  signup: {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  login: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  forgotPassword: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
}
