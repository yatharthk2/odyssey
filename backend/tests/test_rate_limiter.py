"""Token-bucket rate limiter: burst, refill, isolation, and bounded memory."""

import pytest

import chat.rate_limiter as rl_mod
from chat.rate_limiter import RateLimiter


class FakeTime:
    """Controllable monotonic clock injected into the limiter's module."""

    def __init__(self, t: float = 1000.0) -> None:
        self.t = t

    def monotonic(self) -> float:
        return self.t


@pytest.fixture
def clock(monkeypatch):
    c = FakeTime()
    monkeypatch.setattr(rl_mod, "time", c)
    return c


def test_burst_allows_then_blocks(clock):
    rl = RateLimiter(per_minute=60, burst=3)  # refill 1/sec
    assert rl.allow("ip") is True
    assert rl.allow("ip") is True
    assert rl.allow("ip") is True
    assert rl.allow("ip") is False  # burst exhausted, no time has passed


def test_refill_over_time(clock):
    rl = RateLimiter(per_minute=60, burst=2)  # refill 1 token/sec
    assert rl.allow("ip")
    assert rl.allow("ip")
    assert not rl.allow("ip")
    clock.t += 1.0  # one second -> one token back
    assert rl.allow("ip")
    assert not rl.allow("ip")


def test_keys_are_independent(clock):
    rl = RateLimiter(per_minute=1, burst=1)
    assert rl.allow("a")
    assert not rl.allow("a")
    assert rl.allow("b")  # b has its own bucket


def test_tokens_capped_at_burst(clock):
    rl = RateLimiter(per_minute=600, burst=2)  # very fast refill
    assert rl.allow("ip")
    assert rl.allow("ip")
    assert not rl.allow("ip")
    clock.t += 100  # would refill hundreds, but the cap is the burst size
    assert rl.allow("ip")
    assert rl.allow("ip")
    assert not rl.allow("ip")


def test_idle_buckets_evicted_when_full(clock):
    rl = RateLimiter(per_minute=60, burst=1, max_keys=2)
    rl.allow("a")
    rl.allow("b")
    clock.t += 10  # a and b refill to full -> considered idle
    rl.allow("c")  # creating c trips eviction
    assert "c" in rl._buckets
    assert "a" not in rl._buckets
    assert "b" not in rl._buckets


def test_map_cleared_when_all_active(clock):
    rl = RateLimiter(per_minute=60, burst=5, max_keys=2)
    rl.allow("a")  # still has tokens -> active, not idle
    rl.allow("b")
    rl.allow("c")  # nothing idle to evict -> fall back to clearing the map
    assert list(rl._buckets.keys()) == ["c"]
