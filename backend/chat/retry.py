"""Retry transient LLM failures.

The deploy's documented #1 failure is provider rate-limiting (Groq free tier
~30 req/min). Providers raise different exception types, so we classify by
message substring rather than by class, and retry only the transient ones
(429 / 5xx / "overloaded" / "resource exhausted") with exponential backoff and
jitter. Non-transient errors (bad request, auth) are not retried.
"""

import logging

from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_random_exponential,
)

logger = logging.getLogger(__name__)

_RETRYABLE_SUBSTRINGS = (
    "429",
    "rate limit",
    "rate_limit",
    "ratelimit",
    "resource exhausted",
    "resourceexhausted",
    "quota",
    "overloaded",
    "503",
    "502",
    "500",
    "temporarily unavailable",
    "service unavailable",
    "try again",
)


def is_transient(exc: BaseException) -> bool:
    msg = str(exc).lower()
    return any(s in msg for s in _RETRYABLE_SUBSTRINGS)


def call_with_retry(fn, *args, max_attempts: int = 4, **kwargs):
    """Call ``fn(*args, **kwargs)``, retrying transient LLM errors with backoff.

    Re-raises the original exception once attempts are exhausted, so the caller
    surfaces a clean message and the real error is logged.
    """

    @retry(
        retry=retry_if_exception(is_transient),
        wait=wait_random_exponential(multiplier=1, max=15),
        stop=stop_after_attempt(max_attempts),
        reraise=True,
        before_sleep=before_sleep_log(logger, logging.WARNING),
    )
    def _attempt():
        return fn(*args, **kwargs)

    return _attempt()
