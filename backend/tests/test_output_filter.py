"""PII redaction: targeted contact-info scrubbing that survives a token stream."""

from chat.output_filter import StreamRedactor, redact_text

REDACTED = "[hidden]"


def test_redacts_phone_with_country_code():
    out = redact_text("Reach me at +1 (930) 333-4182 today")
    assert REDACTED in out
    assert "930" not in out and "4182" not in out


def test_redacts_email():
    out = redact_text("Email yatharth.k2@outlook.com please")
    assert REDACTED in out
    assert "outlook.com" not in out


def test_redacts_multiple_in_one_string():
    out = redact_text("call +1 (930) 333-4182 or mail a@b.com")
    assert out.count(REDACTED) == 2


def test_preserves_metric_like_numbers():
    # The redactor is intentionally targeted so resume metrics survive untouched.
    for s in [
        "Cut latency 40%",
        "Reduced from 350ms to 210ms",
        "300k+ downloads",
        "4ms P99",
        "2000ms to 50ms",
        "Graduated May 2025",
    ]:
        assert redact_text(s) == s


def test_bare_ten_digit_number_is_not_redacted():
    # Documents the deliberate boundary: the pattern requires a country-code
    # group, so a bare 10-digit number passes through. The real contact PII
    # (the +1 form) and emails are caught; the primary defense is the scrubbed
    # knowledge base, this is only the backstop.
    assert redact_text("930-333-4182") == "930-333-4182"


def test_stream_redactor_catches_phone_split_across_chunks():
    r = StreamRedactor()
    out = ""
    for chunk in ["My number is +1 (930) ", "333-4182, ", "call anytime"]:
        out += r.feed(chunk)
    out += r.flush()
    assert REDACTED in out
    assert "930" not in out and "4182" not in out
    assert "call anytime" in out


def test_stream_redactor_emits_safe_prefix_past_holdback():
    r = StreamRedactor()
    big = "x" * 200
    emitted = r.feed(big)
    # Everything except the trailing 80-char hold-back window is released.
    assert emitted == "x" * (200 - 80)
    rest = r.flush()
    assert emitted + rest == big


def test_stream_redactor_passes_clean_text_through():
    r = StreamRedactor()
    text = "Hello there. I cut p99 latency 40% on the search path."
    out = "".join(r.feed(c) for c in text) + r.flush()
    assert out == text
