"""Transient-error classification and retry-with-backoff behavior."""

import time

import pytest

from chat.retry import call_with_retry, is_transient


@pytest.fixture(autouse=True)
def _no_sleep(monkeypatch):
    # Neutralize tenacity's backoff sleeps so the suite stays fast/deterministic.
    monkeypatch.setattr(time, "sleep", lambda *a, **k: None)


@pytest.mark.parametrize(
    "msg",
    [
        "Error code: 429 - rate limit exceeded",
        "RESOURCE_EXHAUSTED: quota reached",
        "Service Unavailable (503)",
        "The model is overloaded, please try again later",
        "502 Bad Gateway",
    ],
)
def test_is_transient_true(msg):
    assert is_transient(Exception(msg)) is True


@pytest.mark.parametrize(
    "msg",
    [
        "401 Unauthorized: invalid api key",
        "400 Bad Request: malformed payload",
        "KeyError: 'foo'",
    ],
)
def test_is_transient_false(msg):
    assert is_transient(Exception(msg)) is False


def test_retries_transient_then_succeeds():
    calls = {"n": 0}

    def flaky():
        calls["n"] += 1
        if calls["n"] < 3:
            raise Exception("429 rate limit")
        return "ok"

    assert call_with_retry(flaky, max_attempts=4) == "ok"
    assert calls["n"] == 3


def test_non_transient_not_retried():
    calls = {"n": 0}

    def boom():
        calls["n"] += 1
        raise ValueError("401 Unauthorized")

    with pytest.raises(ValueError):
        call_with_retry(boom, max_attempts=4)
    assert calls["n"] == 1  # tried exactly once, no retry


def test_exhausts_attempts_and_reraises_original():
    calls = {"n": 0}

    def always():
        calls["n"] += 1
        raise RuntimeError("503 service unavailable")

    with pytest.raises(RuntimeError, match="503"):
        call_with_retry(always, max_attempts=3)
    assert calls["n"] == 3


def test_forwards_args_and_kwargs():
    assert call_with_retry(lambda a, b=0: a + b, 2, b=3) == 5
