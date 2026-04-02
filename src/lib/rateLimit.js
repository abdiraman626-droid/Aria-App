/**
 * localStorage-based rate limiting for login attempts.
 * 5 failed attempts triggers a 15-minute lockout.
 */

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 15 * 60 * 1000; // 15 minutes

function keys(namespace) {
  return {
    attempts:  `rl_attempts_${namespace}`,
    lockedAt:  `rl_locked_${namespace}`,
  };
}

/** Returns { locked: true, remainingMs } or { locked: false } */
export function checkRateLimit(namespace) {
  const k        = keys(namespace);
  const lockedAt = Number(localStorage.getItem(k.lockedAt) || 0);
  if (lockedAt) {
    const elapsed = Date.now() - lockedAt;
    if (elapsed < LOCKOUT_MS) {
      return { locked: true, remainingMs: LOCKOUT_MS - elapsed };
    }
    // Lockout expired — reset
    localStorage.removeItem(k.lockedAt);
    localStorage.removeItem(k.attempts);
  }
  return { locked: false };
}

/** Call after a failed attempt. Returns { locked, attemptsLeft } */
export function recordFailedAttempt(namespace) {
  const k        = keys(namespace);
  const attempts = Number(localStorage.getItem(k.attempts) || 0) + 1;
  localStorage.setItem(k.attempts, String(attempts));
  if (attempts >= MAX_ATTEMPTS) {
    localStorage.setItem(k.lockedAt, String(Date.now()));
    return { locked: true, attemptsLeft: 0 };
  }
  return { locked: false, attemptsLeft: MAX_ATTEMPTS - attempts };
}

/** Call after a successful login to clear the counter */
export function clearRateLimit(namespace) {
  const k = keys(namespace);
  localStorage.removeItem(k.attempts);
  localStorage.removeItem(k.lockedAt);
}

/** Human-readable remaining lockout time, e.g. "12 minutes" */
export function formatRemaining(ms) {
  const mins = Math.ceil(ms / 60000);
  return `${mins} minute${mins !== 1 ? 's' : ''}`;
}
