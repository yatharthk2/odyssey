"""QueryEngine streaming: cache, routing, redaction, errors, timeout, top_k.

These exercise the async streaming pipeline with stubbed LlamaIndex engines, so
no API keys / model downloads are needed. The real retrieval engines are
replaced with fakes that hand back canned chunks (or raise / block).
"""

import asyncio
import threading
from types import SimpleNamespace

from prometheus_client import REGISTRY

from chat.chatdata import Chat
from chat.query_engine import GENERIC_ERROR, GENERIC_TIMEOUT, QueryEngine

# --- fakes ------------------------------------------------------------------


class FakeResponse:
    def __init__(self, chunks, response_gen_none=False):
        self.response = "".join(chunks) if chunks else ""
        self.response_gen = None if response_gen_none else iter(chunks)


class FakeEngine:
    """Stand-in for a LlamaIndex query engine's ``.query`` call."""

    def __init__(self, chunks=None, exc=None, gate=None, response_gen_none=False):
        self.chunks = chunks or []
        self.exc = exc
        self.gate = gate  # if set, block until released (simulate a hung call)
        self.response_gen_none = response_gen_none
        self.calls = 0

    def query(self, _query_context):
        self.calls += 1
        if self.gate is not None:
            self.gate.wait()
        if self.exc is not None:
            raise self.exc
        return FakeResponse(self.chunks, self.response_gen_none)


class RecordingIndex:
    def __init__(self):
        self.calls = []

    def as_query_engine(self, **kwargs):
        self.calls.append(kwargs)
        return FakeEngine([])


class FakeCache:
    def __init__(self, cached=None):
        self.cached = cached
        self.stored = []

    def is_available(self):
        return True

    def get_cached_response(self, _question):
        return self.cached

    def cache_response(self, question, response):
        self.stored.append((question, response))


def make_qe(cache=None, kg=None, vector=None, timeout=45.0, retries=4):
    gm = SimpleNamespace(
        settings=SimpleNamespace(
            similarity_top_k=6,
            query_timeout_seconds=timeout,
            llm_max_retries=retries,
        )
    )
    qe = QueryEngine(gm, cache)
    qe.query_engine_KG = kg or FakeEngine([])
    qe.query_engine_vector = vector or FakeEngine([])
    qe.hyde_engine_KG = kg or FakeEngine([])
    qe.hyde_engine_vector = vector or FakeEngine([])
    return qe


async def drain(agen):
    return [c async for c in agen]


def qval(cache, engine="kg", transformation="none"):
    v = REGISTRY.get_sample_value(
        "inpersona_queries_total",
        {"engine": engine, "transformation": transformation, "cache": cache},
    )
    return v or 0.0


def errval(stage):
    v = REGISTRY.get_sample_value("inpersona_errors_total", {"stage": stage})
    return v or 0.0


# --- tests ------------------------------------------------------------------


async def test_cache_hit_returns_cached_without_touching_engine():
    cache = FakeCache(cached="<p>Hi there.</p>")
    kg = FakeEngine(["SHOULD NOT RUN"])
    qe = make_qe(cache=cache, kg=kg)
    chat = Chat(10)
    before = qval("hit")

    out = await drain(qe.process_query("hello", chat, None, "KG"))

    assert out == ["<p>Hi there.</p>"]
    assert kg.calls == 0  # engine never consulted on a cache hit
    assert chat.to_list()[-2:] == [
        {"role": "user", "content": "hello"},
        {"role": "assistant", "content": "<p>Hi there.</p>"},
    ]
    assert qval("hit") == before + 1


async def test_stream_yields_chunks_and_caches_full_response():
    cache = FakeCache(cached=None)
    qe = make_qe(cache=cache, kg=FakeEngine(["Hi, ", "I'm Yatharth."]))
    chat = Chat(10)

    out = "".join(await drain(qe.process_query("who are you", chat, None, "KG")))

    assert out == "Hi, I'm Yatharth."
    assert chat.to_list()[-1] == {"role": "assistant", "content": "Hi, I'm Yatharth."}
    assert ("who are you", "Hi, I'm Yatharth.") in cache.stored


async def test_stream_redacts_pii_split_across_chunks():
    qe = make_qe(kg=FakeEngine(["You can reach me at +1 (930) ", "333-4182 anytime."]))
    chat = Chat(10)

    out = "".join(await drain(qe.process_query("contact", chat, None, "KG")))

    assert "[hidden]" in out
    assert "930" not in out and "4182" not in out
    assert chat.to_list()[-1]["content"].count("[hidden]") >= 1


async def test_vector_store_routes_to_vector_engine():
    kg = FakeEngine(exc=AssertionError("KG engine must not be used"))
    vec = FakeEngine(["from the vector index"])
    qe = make_qe(kg=kg, vector=vec)

    out = "".join(await drain(qe.process_query("q", Chat(10), None, "vector")))

    assert out == "from the vector index"
    assert vec.calls == 1
    assert kg.calls == 0


async def test_hyde_routes_to_hyde_engine():
    qe = make_qe(kg=FakeEngine(exc=AssertionError("plain KG engine must not run")))
    qe.hyde_engine_KG = FakeEngine(["from the hyde engine"])

    out = "".join(await drain(qe.process_query("q", Chat(10), "HyDE", "KG")))

    assert out == "from the hyde engine"


async def test_stream_error_yields_generic_message_and_skips_cache():
    cache = FakeCache(cached=None)
    qe = make_qe(cache=cache, kg=FakeEngine(exc=RuntimeError("boom internal detail")))
    chat = Chat(10)
    before = errval("stream")

    out = "".join(await drain(qe.process_query("q", chat, None, "KG")))

    assert out == GENERIC_ERROR
    assert "boom internal detail" not in out  # internal error never leaks
    assert cache.stored == []  # a failed response is never cached
    assert errval("stream") == before + 1
    assert chat.to_list()[-1]["role"] == "assistant"


async def test_query_timeout_yields_generic_timeout():
    gate = threading.Event()
    qe = make_qe(kg=FakeEngine(["late chunk"], gate=gate), timeout=0.2)
    chat = Chat(10)
    before = errval("timeout")

    out = []
    try:
        async for chunk in qe.process_query("q", chat, None, "KG"):
            out.append(chunk)
    finally:
        gate.set()  # release the worker thread so it exits cleanly
        await asyncio.sleep(0.05)

    assert "".join(out) == GENERIC_TIMEOUT
    assert errval("timeout") == before + 1
    assert chat.to_list()[-1] == {"role": "assistant", "content": GENERIC_TIMEOUT}


async def test_empty_response_gen_yields_fallback_message():
    qe = make_qe(kg=FakeEngine(chunks=[], response_gen_none=True))

    out = "".join(await drain(qe.process_query("q", Chat(10), None, "KG")))

    assert out == "I apologize, but I couldn't find any relevant information in the documents."


def test_initialize_propagates_similarity_top_k():
    # similarity_top_k must be passed to as_query_engine() explicitly; setting it
    # on the global Settings does not propagate. HyDEQueryTransform needs an LLM,
    # so install a mock for the duration of the test.
    from llama_index.core import Settings
    from llama_index.core.llms import MockLLM

    Settings.llm = MockLLM()
    try:
        gm = SimpleNamespace(
            settings=SimpleNamespace(
                similarity_top_k=6, query_timeout_seconds=45.0, llm_max_retries=4
            ),
            index_KG=RecordingIndex(),
            index_vector=RecordingIndex(),
        )
        qe = QueryEngine(gm, None)

        assert qe.initialize() is True
        assert gm.index_KG.calls[0]["similarity_top_k"] == 6
        assert gm.index_vector.calls[0]["similarity_top_k"] == 6
        assert gm.index_KG.calls[0]["streaming"] is True
    finally:
        Settings.llm = None
