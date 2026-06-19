"""In-process per-IP token-bucket rate limiter.

The chat is a public WebSocket where every non-cached question costs a paid
LLM call, so an unthrottled client can exhaust the provider free tier (429-ing
real visitors) or run up the bill. This caps questions per IP with a small
burst allowance. State is per-process and resets on restart, which is fine for
a single-instance deploy; swap for a Redis-backed limiter if it ever scales
horizontally.
"""

import time


class _Bucket:
    __slots__ = ("tokens", "updated")

    def __init__(self, capacity: float) -> None:
        self.tokens = capacity
        self.updated = time.monotonic()


class RateLimiter:
    def __init__(self, per_minute: int = 15, burst: int = 5, max_keys: int = 4096) -> None:
        self.capacity = float(burst)
        self.refill_per_sec = per_minute / 60.0
        self.max_keys = max_keys
        self._buckets: dict[str, _Bucket] = {}

    def allow(self, key: str) -> bool:
        """Consume one token for ``key``. Returns False when the bucket is empty."""
        now = time.monotonic()
        bucket = self._buckets.get(key)
        if bucket is None:
            if len(self._buckets) >= self.max_keys:
                self._evict_idle(now)
            bucket = _Bucket(self.capacity)
            self._buckets[key] = bucket

        elapsed = now - bucket.updated
        bucket.tokens = min(self.capacity, bucket.tokens + elapsed * self.refill_per_sec)
        bucket.updated = now

        if bucket.tokens >= 1.0:
            bucket.tokens -= 1.0
            return True
        return False

    def _evict_idle(self, now: float) -> None:
        """Drop buckets that have refilled to full (idle long enough to forget)."""
        for key in [
            k
            for k, b in self._buckets.items()
            if min(self.capacity, b.tokens + (now - b.updated) * self.refill_per_sec)
            >= self.capacity
        ]:
            del self._buckets[key]
        # If everything is still active, fall back to clearing the map so an
        # adversary can't pin memory by cycling IPs.
        if len(self._buckets) >= self.max_keys:
            self._buckets.clear()
