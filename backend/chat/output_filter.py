"""Backstop PII redaction for model output.

The primary defense is redacting PII from the knowledge base (documents/),
so the model never sees a phone number or personal email to recite. This
module is the second layer: it scrubs contact-info patterns from the model's
response even if they somehow appear, before anything reaches the client.

``StreamRedactor`` makes this work over a token stream: a pattern can straddle
two chunks, so it redacts the whole accumulated buffer each step and only
emits text outside a trailing hold-back window, keeping any in-progress match
buffered until it is complete.
"""

import re

# Targeted, not greedy: only contact-shaped strings, so normal text with
# numbers ("4ms P99", "2000ms to 50ms", "300k+ downloads") is never touched.
_EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
_PHONE = re.compile(r"\+?\d{1,3}[\s.\-]?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}")

_REPLACEMENT = "[hidden]"

# Longer than any phone/email we redact, so a match split across stream chunks
# is always fully buffered before the safe region is emitted.
_HOLDBACK = 80


def redact_text(text: str) -> str:
    """Replace any phone number / email in ``text`` with a placeholder."""
    return _PHONE.sub(_REPLACEMENT, _EMAIL.sub(_REPLACEMENT, text))


class StreamRedactor:
    """Streaming-safe redactor.

    Feed chunks in order; each ``feed`` returns the next slice of redacted text
    that is safe to emit (everything except a trailing hold-back window). Call
    ``flush`` once at the end to drain the remainder.
    """

    def __init__(self) -> None:
        self._raw = ""
        self._sent = 0  # chars already emitted, in redacted-string coordinates

    def feed(self, chunk: str) -> str:
        self._raw += chunk
        redacted = redact_text(self._raw)
        safe_upto = max(0, len(redacted) - _HOLDBACK)
        if safe_upto <= self._sent:
            return ""
        out = redacted[self._sent : safe_upto]
        self._sent = safe_upto
        return out

    def flush(self) -> str:
        redacted = redact_text(self._raw)
        out = redacted[self._sent :]
        self._sent = len(redacted)
        return out
