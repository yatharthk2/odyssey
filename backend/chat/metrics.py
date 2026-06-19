"""Prometheus metrics for the chat service.

Exposed at GET /metrics. Gives the per-query visibility a production RAG
service is expected to have: throughput, cache-hit rate, error rate by stage,
end-to-end latency, and time-to-first-chunk, all labelled by retrieval path.
"""

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest

# Labelled by the retrieval path so cache-hit rate and latency can be sliced
# per engine / transformation.
QUERIES = Counter(
    "inpersona_queries_total",
    "Chat queries processed.",
    ["engine", "transformation", "cache"],
)

ERRORS = Counter(
    "inpersona_errors_total",
    "Query failures, by stage.",
    ["stage"],  # "stream" | "timeout" | "internal"
)

LATENCY = Histogram(
    "inpersona_query_latency_seconds",
    "End-to-end query latency.",
    buckets=(0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 45),
)

TTFB = Histogram(
    "inpersona_query_ttfb_seconds",
    "Time to first streamed chunk.",
    buckets=(0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10),
)

ACTIVE_CONNECTIONS = Gauge(
    "inpersona_active_connections",
    "Currently open chat WebSocket connections.",
)

CONTENT_TYPE = CONTENT_TYPE_LATEST


def render() -> bytes:
    """Prometheus text exposition of all metrics."""
    return generate_latest()
