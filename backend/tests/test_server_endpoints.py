"""HTTP surface: /health, /ready, /metrics, and the client-key helper.

The TestClient is used WITHOUT its lifespan context manager, so the heavy RAG
stack is never initialized — exactly the cold-start state /ready must report as
503.
"""

from types import SimpleNamespace

from fastapi.testclient import TestClient

import server

client = TestClient(server.app)


def test_health_always_ok():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_ready_returns_503_before_warm(monkeypatch):
    monkeypatch.setattr(server, "chat_manager", None, raising=False)
    r = client.get("/ready")
    assert r.status_code == 503
    assert r.json()["status"] == "initializing"


def test_ready_returns_200_when_engines_built(monkeypatch):
    warm = SimpleNamespace(query_engine=SimpleNamespace(query_engine_KG=object()))
    monkeypatch.setattr(server, "chat_manager", warm, raising=False)
    r = client.get("/ready")
    assert r.status_code == 200
    assert r.json()["status"] == "ready"


def test_metrics_exposition_format():
    r = client.get("/metrics")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/plain")
    body = r.text
    assert "inpersona_queries_total" in body
    assert "inpersona_active_connections" in body


def test_client_key_prefers_forwarded_for():
    ws = SimpleNamespace(
        headers={"x-forwarded-for": "9.9.9.9, 10.0.0.1"},
        client=SimpleNamespace(host="1.1.1.1"),
    )
    assert server._client_key(ws) == "9.9.9.9"


def test_client_key_falls_back_to_peer():
    ws = SimpleNamespace(headers={}, client=SimpleNamespace(host="1.1.1.1"))
    assert server._client_key(ws) == "1.1.1.1"


def test_client_key_unknown_without_client():
    ws = SimpleNamespace(headers={}, client=None)
    assert server._client_key(ws) == "unknown"
